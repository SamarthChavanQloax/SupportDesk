import { getOpenAiClient } from '../ai/client';
import { calculateCost } from '../ai/cost';
import { logAiUsage } from '../ai/usage-logger';
import {
  aiCategorizationSchema,
  AiCategorization,
} from '../ai/schemas/ai.schema';
import {
  SUGGEST_REPLY_SYSTEM_INSTRUCTION,
  buildSuggestReplyUserPrompt,
  SuggestReplyContext,
} from '../ai/prompts/suggest-reply.v1';
import {
  CATEGORIZE_SYSTEM_INSTRUCTION,
  buildCategorizeUserPrompt,
  CategorizeContext,
} from '../ai/prompts/categorize.v1';
import { ticketRepository } from '../repositories/ticket.repository';
import { commentRepository } from '../repositories/comment.repository';
import { env } from '../config/env';
import {
  NotFoundError,
  BadRequestError,
  ValidationError,
  InternalServerError,
} from '../errors/app.error';

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onDone?: (meta: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    totalCost: number;
  }) => void;
  onError?: (err: Error) => void;
}

export class AiService {
  private defaultModel: string;

  constructor(defaultModel?: string) {
    this.defaultModel = defaultModel || env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  /**
   * Fetches ticket context + comments and streams a suggested reply.
   */
  async streamSuggestReply(
    ticketId: number,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const startTime = Date.now();
    const model = this.defaultModel;

    // 1. Fetch ticket
    const ticket = await ticketRepository.findById(ticketId, false);
    if (!ticket) {
      throw new NotFoundError('Ticket');
    }

    // 2. Fetch comments (support agents see both public and internal notes)
    const comments = await commentRepository.findByTicketId(ticketId, {
      includeInternal: true,
    });

    // 3. Assemble prompt context
    const context: SuggestReplyContext = {
      ticket: {
        reference: ticket.reference,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        customerName: (ticket as any).customer?.name ?? 'Customer',
      },
      comments: comments.map((c: any) => ({
        authorName: c.author?.name ?? 'Support User',
        authorRole: c.author?.role ?? (c.isInternal ? 'agent' : 'customer'),
        body: c.body,
        isInternal: c.isInternal,
        createdAt: new Date(c.createdAt).toLocaleString(),
      })),
    };

    const userPrompt = buildSuggestReplyUserPrompt(context);

    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;

    try {
      const openai = getOpenAiClient();

      const stream = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SUGGEST_REPLY_SYSTEM_INSTRUCTION },
          { role: 'user', content: userPrompt },
        ],
        stream: true,
        stream_options: { include_usage: true },
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          callbacks.onChunk(text);
        }

        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens ?? 0;
          completionTokens = chunk.usage.completion_tokens ?? 0;
          totalTokens = chunk.usage.total_tokens ?? 0;
        }
      }

      // If stream_options wasn't supported by mock/provider, estimate roughly
      if (totalTokens === 0) {
        promptTokens = Math.ceil((SUGGEST_REPLY_SYSTEM_INSTRUCTION.length + userPrompt.length) / 4);
        completionTokens = 150;
        totalTokens = promptTokens + completionTokens;
      }

      const cost = calculateCost(model, promptTokens, completionTokens);
      const durationMs = Date.now() - startTime;

      logAiUsage({
        feature: 'suggest_reply',
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        durationMs,
        ticketId,
        success: true,
      });

      callbacks.onDone?.({
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        totalCost: cost.totalCost,
      });
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const cost = calculateCost(model, 0, 0);

      logAiUsage({
        feature: 'suggest_reply',
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost,
        durationMs,
        ticketId,
        success: false,
        errorMessage: error?.message || 'Unknown stream error',
      });

      callbacks.onError?.(error);
      throw error;
    }
  }

  /**
   * Predicts Category and Priority using structured JSON output and validates with Zod.
   */
  async categorizeTicket(
    ticketId?: number,
    textData?: { title: string; description: string }
  ): Promise<AiCategorization & { meta: { model: string; tokens: number; cost: number } }> {
    const startTime = Date.now();
    const model = this.defaultModel;

    let title = textData?.title?.trim();
    let description = textData?.description?.trim();

    if (ticketId) {
      const ticket = await ticketRepository.findById(ticketId, false);
      if (!ticket) {
        throw new NotFoundError('Ticket');
      }
      title = ticket.title;
      description = ticket.description;
    }

    if (!title || !description) {
      throw new BadRequestError('Both title and description are required for categorization');
    }

    const context: CategorizeContext = {
      title,
      description,
    };

    const userPrompt = buildCategorizeUserPrompt(context);

    try {
      const openai = getOpenAiClient();

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: CATEGORIZE_SYSTEM_INSTRUCTION },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2, // Low temperature for deterministic classification
      });

      const promptTokens = response.usage?.prompt_tokens ?? 0;
      const completionTokens = response.usage?.completion_tokens ?? 0;
      const totalTokens = response.usage?.total_tokens ?? 0;
      const cost = calculateCost(model, promptTokens, completionTokens);
      const durationMs = Date.now() - startTime;

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) {
        throw new InternalServerError('AI provider returned empty response content');
      }

      // Parse JSON
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(rawContent);
      } catch (parseError) {
        throw new ValidationError('AI model output was not valid JSON', {
          rawContent,
        });
      }

      // Validate with Zod
      const validationResult = aiCategorizationSchema.safeParse(parsedJson);
      if (!validationResult.success) {
        throw new ValidationError(
          'AI model output failed structured schema validation',
          validationResult.error.format()
        );
      }

      logAiUsage({
        feature: 'categorize_ticket',
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        durationMs,
        ticketId,
        success: true,
      });

      return {
        ...validationResult.data,
        meta: {
          model,
          tokens: totalTokens,
          cost: cost.totalCost,
        },
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const cost = calculateCost(model, 0, 0);

      logAiUsage({
        feature: 'categorize_ticket',
        model,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost,
        durationMs,
        ticketId,
        success: false,
        errorMessage: error?.message || 'Categorization failure',
      });

      throw error;
    }
  }
}

export const aiService = new AiService();
