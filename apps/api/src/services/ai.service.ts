import { getOpenAiClient, isOpenAiConfigured, getActiveAiModel } from '../ai/client';
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
  private defaultModel?: string;

  constructor(defaultModel?: string) {
    this.defaultModel = defaultModel;
  }

  private resolveModel(): string {
    return this.defaultModel || getActiveAiModel();
  }

  /**
   * Fetches ticket context + comments and streams a suggested reply.
   */
  async streamSuggestReply(
    ticketId: number,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const startTime = Date.now();
    const model = this.resolveModel();

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

    // If no OpenAI API key is configured in dev environment, stream realistic simulated response
    if (!isOpenAiConfigured()) {
      await this.streamSimulatedReply(ticketId, context, model, startTime, callbacks);
      return;
    }

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
    const model = this.resolveModel();

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

    // If no OpenAI API key is configured in dev environment, use intelligent rule-based categorizer
    if (!isOpenAiConfigured()) {
      return this.simulatedCategorization(ticketId, title, description, model, startTime);
    }

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

  /**
   * Local development simulation for streaming suggested reply when no OpenAI API key is present.
   */
  private async streamSimulatedReply(
    ticketId: number,
    context: SuggestReplyContext,
    model: string,
    startTime: number,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const customerName = context.ticket.customerName || 'there';
    const title = context.ticket.title;
    const desc = (context.ticket.description || '').toLowerCase();

    let issueFocus =
      'We have reviewed your inquiry and escalated it to our engineering triage queue for immediate investigation.';
    if (desc.includes('billing') || desc.includes('invoice') || desc.includes('payment') || desc.includes('charge')) {
      issueFocus =
        'Our billing operations team has reviewed your transaction records. We are verifying the charge details to ensure proper adjustment.';
    } else if (desc.includes('504') || desc.includes('gateway') || desc.includes('network') || desc.includes('timeout')) {
      issueFocus =
        'Our infrastructure telemetry indicates transient edge gateway latency affecting service routing. Traffic failover is actively mitigating this.';
    } else if (desc.includes('password') || desc.includes('login') || desc.includes('account') || desc.includes('auth')) {
      issueFocus =
        'We have checked your account status and reset authentication flags. Please check your inbox for an authorization token.';
    }

    const draft = `Hello ${customerName},

Thank you for reaching out to SupportDesk regarding "${title}".

${issueFocus}

We are actively monitoring system logs and will share an update as soon as the next milestone is verified. In the meantime, please let us know if you observe any change in behavior or have relevant error screenshots.

Best regards,
SupportDesk Engineering Support`;

    // Stream out chunks with slight delay to simulate realistic SSE streaming
    const words = draft.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ') + ' ';
      callbacks.onChunk(chunk);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }

    const promptTokens = 120;
    const completionTokens = words.length;
    const totalTokens = promptTokens + completionTokens;
    const cost = calculateCost('gpt-4o-mini', promptTokens, completionTokens);
    const durationMs = Date.now() - startTime;

    logAiUsage({
      feature: 'suggest_reply',
      model: `${model} (dev-simulated)`,
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      durationMs,
      ticketId,
      success: true,
    });

    callbacks.onDone?.({
      model: `${model} (dev-simulated)`,
      promptTokens,
      completionTokens,
      totalTokens,
      totalCost: cost.totalCost,
    });
  }

  /**
   * Local development simulation for categorization when no OpenAI API key is present.
   */
  private async simulatedCategorization(
    ticketId: number | undefined,
    title: string,
    description: string,
    model: string,
    startTime: number
  ): Promise<AiCategorization & { meta: { model: string; tokens: number; cost: number } }> {
    const text = `${title} ${description}`.toLowerCase();

    let category: 'Billing' | 'Technical' | 'Security' | 'Network' | 'Account' | 'General' = 'General';
    let priority: 'P1' | 'P2' | 'P3' | 'P4' = 'P3';
    let confidence = 0.88;
    let reasoning = 'Standard multi-purpose customer inquiry analyzed via SupportDesk triage heuristics.';

    if (text.includes('security') || text.includes('breach') || text.includes('vulnerability') || text.includes('compromised')) {
      category = 'Security';
      priority = 'P1';
      confidence = 0.96;
      reasoning = 'High risk: critical security or vulnerability terminology detected.';
    } else if (text.includes('504') || text.includes('outage') || text.includes('down') || text.includes('gateway timeout')) {
      category = text.includes('payment') || text.includes('checkout') ? 'Billing' : 'Network';
      priority = 'P1';
      confidence = 0.94;
      reasoning = 'Critical service outage or transaction gateway timeout affecting availability.';
    } else if (text.includes('billing') || text.includes('invoice') || text.includes('charge') || text.includes('refund') || text.includes('payment')) {
      category = 'Billing';
      priority = text.includes('urgent') || text.includes('double') ? 'P1' : 'P2';
      confidence = 0.93;
      reasoning = 'Payment, invoice reconciliation, or financial adjustment request.';
    } else if (text.includes('vpn') || text.includes('latency') || text.includes('dns') || text.includes('network') || text.includes('connection')) {
      category = 'Network';
      priority = 'P2';
      confidence = 0.91;
      reasoning = 'Network routing, edge gateway latency, or connectivity constraint detected.';
    } else if (text.includes('login') || text.includes('password') || text.includes('2fa') || text.includes('account') || text.includes('auth')) {
      category = 'Account';
      priority = 'P2';
      confidence = 0.90;
      reasoning = 'Account authentication or credential access management.';
    } else if (text.includes('bug') || text.includes('error') || text.includes('crash') || text.includes('null') || text.includes('exception')) {
      category = 'Technical';
      priority = 'P2';
      confidence = 0.89;
      reasoning = 'Application code exception or runtime software defect.';
    }

    const payload = {
      category,
      priority,
      confidence,
      reasoning,
    };

    // Strictly validate against Zod schema to uphold contract
    const validationResult = aiCategorizationSchema.safeParse(payload);
    if (!validationResult.success) {
      throw new ValidationError(
        'Simulated AI output failed structured schema validation',
        validationResult.error.format()
      );
    }

    const promptTokens = 95;
    const completionTokens = 42;
    const totalTokens = promptTokens + completionTokens;
    const cost = calculateCost('gpt-4o-mini', promptTokens, completionTokens);
    const durationMs = Date.now() - startTime;

    logAiUsage({
      feature: 'categorize_ticket',
      model: `${model} (dev-simulated)`,
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
        model: `${model} (dev-simulated)`,
        tokens: totalTokens,
        cost: cost.totalCost,
      },
    };
  }
}

export const aiService = new AiService();

