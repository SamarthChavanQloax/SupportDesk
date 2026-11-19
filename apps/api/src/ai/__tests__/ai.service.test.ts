import { AiService } from '../../services/ai.service';
import { calculateCost } from '../cost';
import { logAiUsage } from '../usage-logger';
import { setOpenAiClient } from '../client';
import { ticketRepository } from '../../repositories/ticket.repository';
import { commentRepository } from '../../repositories/comment.repository';
import {
  NotFoundError,
  BadRequestError,
  ValidationError,
} from '../../errors/app.error';

// Mock repositories
jest.mock('../../repositories/ticket.repository');
jest.mock('../../repositories/comment.repository');
jest.mock('../usage-logger');

describe('AI Cost and Usage Calculation', () => {
  it('calculates cost accurately for gpt-4o-mini', () => {
    // 1,000,000 prompt tokens = $0.15, 1,000,000 completion tokens = $0.60
    const result = calculateCost('gpt-4o-mini', 1000, 500);
    expect(result.promptCost).toBe(0.00015);
    expect(result.completionCost).toBe(0.0003);
    expect(result.totalCost).toBe(0.00045);
    expect(result.currency).toBe('USD');
  });

  it('calculates cost accurately for gpt-4o', () => {
    // gpt-4o: $2.50 / 1M prompt, $10.00 / 1M completion
    const result = calculateCost('gpt-4o', 1000, 1000);
    expect(result.promptCost).toBe(0.0025);
    expect(result.completionCost).toBe(0.01);
    expect(result.totalCost).toBe(0.0125);
  });
});

describe('AiService - Suggest Reply (Streaming)', () => {
  let aiService: AiService;
  const mockTicket = {
    id: 101,
    reference: 'TCK-2026-0101',
    title: 'Cannot access payment gateway',
    description: 'Receiving 504 Gateway Timeout during checkout.',
    status: 'open',
    priority: 'P1',
    category: 'Billing',
    customer: { name: 'Alice Smith' },
  };

  const mockComments = [
    {
      id: 1,
      body: 'I tried refreshing but it still fails.',
      isInternal: false,
      author: { name: 'Alice Smith', role: 'customer' },
      createdAt: new Date(),
    },
    {
      id: 2,
      body: 'Stripe webhook gateway #3 is experiencing elevated latency.',
      isInternal: true,
      author: { name: 'Dave Agent', role: 'agent' },
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    aiService = new AiService('gpt-4o-mini');
    jest.clearAllMocks();
  });

  afterEach(() => {
    setOpenAiClient(null);
  });

  it('streams suggested reply chunks and logs usage upon completion', async () => {
    (ticketRepository.findById as jest.Mock).mockResolvedValue(mockTicket);
    (commentRepository.findByTicketId as jest.Mock).mockResolvedValue(mockComments);

    const mockChunks = [
      { choices: [{ delta: { content: 'Hello Alice, ' } }] },
      { choices: [{ delta: { content: 'we are investigating the payment timeout. ' } }] },
      { choices: [{ delta: { content: 'Please hold on.' } }], usage: { prompt_tokens: 150, completion_tokens: 30, total_tokens: 180 } },
    ];

    async function* asyncGenerator() {
      for (const chunk of mockChunks) {
        yield chunk;
      }
    }

    const mockOpenAi = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(asyncGenerator()),
        },
      },
    };
    setOpenAiClient(mockOpenAi as any);

    const chunksReceived: string[] = [];
    let metaReceived: any = null;

    await aiService.streamSuggestReply(101, {
      onChunk: (chunk) => chunksReceived.push(chunk),
      onDone: (meta) => {
        metaReceived = meta;
      },
    });

    expect(chunksReceived.join('')).toBe(
      'Hello Alice, we are investigating the payment timeout. Please hold on.'
    );
    expect(metaReceived).not.toBeNull();
    expect(metaReceived.totalTokens).toBe(180);
    expect(logAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: 'suggest_reply',
        success: true,
        ticketId: 101,
      })
    );
  });

  it('throws NotFoundError when ticket does not exist', async () => {
    (ticketRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      aiService.streamSuggestReply(999, {
        onChunk: jest.fn(),
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('handles provider error and reports failure without crashing', async () => {
    (ticketRepository.findById as jest.Mock).mockResolvedValue(mockTicket);
    (commentRepository.findByTicketId as jest.Mock).mockResolvedValue([]);

    const mockOpenAi = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('OpenAI rate limit exceeded (429)')),
        },
      },
    };
    setOpenAiClient(mockOpenAi as any);

    const onErrorMock = jest.fn();

    await expect(
      aiService.streamSuggestReply(101, {
        onChunk: jest.fn(),
        onError: onErrorMock,
      })
    ).rejects.toThrow(/AI unavailable — reply manually.*OpenAI rate limit exceeded/);

    expect(onErrorMock).toHaveBeenCalledWith(expect.any(Error));
    expect(logAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: 'suggest_reply',
        success: false,
        errorMessage: 'OpenAI rate limit exceeded (429)',
      })
    );
  });
});

describe('AiService - Auto-categorise + Priority (Zod Validated)', () => {
  let aiService: AiService;

  beforeEach(() => {
    aiService = new AiService('gpt-4o-mini');
    jest.clearAllMocks();
  });

  afterEach(() => {
    setOpenAiClient(null);
  });

  it('validates and returns valid structured output', async () => {
    const validJsonOutput = JSON.stringify({
      category: 'Billing',
      priority: 'P1',
      confidence: 0.95,
      reasoning: 'Customer experiencing payment failure during checkout blocking revenue.',
    });

    const mockOpenAi = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: validJsonOutput } }],
            usage: { prompt_tokens: 120, completion_tokens: 40, total_tokens: 160 },
          }),
        },
      },
    };
    setOpenAiClient(mockOpenAi as any);

    const result = await aiService.categorizeTicket(undefined, {
      title: 'Checkout charge failure',
      description: 'Customer credit card was charged twice and error 500 thrown.',
    });

    expect(result.category).toBe('Billing');
    expect(result.priority).toBe('P1');
    expect(result.confidence).toBe(0.95);
    expect(result.reasoning).toContain('payment failure');
    expect(result.meta.tokens).toBe(160);
    expect(logAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: 'categorize_ticket',
        success: true,
      })
    );
  });

  it('rejects malformed non-JSON output and throws ValidationError', async () => {
    const malformedOutput = 'Sorry, as an AI model I think this is Billing.';

    const mockOpenAi = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: malformedOutput } }],
          }),
        },
      },
    };
    setOpenAiClient(mockOpenAi as any);

    await expect(
      aiService.categorizeTicket(undefined, {
        title: 'Server offline',
        description: 'Main database server crashed.',
      })
    ).rejects.toThrow(ValidationError);

    expect(logAiUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: 'categorize_ticket',
        success: false,
      })
    );
  });

  it('rejects unsupported category or priority enum values with Zod error', async () => {
    const invalidEnumsOutput = JSON.stringify({
      category: 'UnrecognizedCategory',
      priority: 'P99', // Invalid priority
      confidence: 0.8,
      reasoning: 'Random guess',
    });

    const mockOpenAi = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: invalidEnumsOutput } }],
          }),
        },
      },
    };
    setOpenAiClient(mockOpenAi as any);

    await expect(
      aiService.categorizeTicket(undefined, {
        title: 'Random question',
        description: 'Where is the documentation?',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('rejects missing required fields (e.g. missing confidence)', async () => {
    const incompleteJson = JSON.stringify({
      category: 'Technical',
      priority: 'P2',
      // confidence is missing
      reasoning: 'Major bug in application.',
    });

    const mockOpenAi = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: incompleteJson } }],
          }),
        },
      },
    };
    setOpenAiClient(mockOpenAi as any);

    await expect(
      aiService.categorizeTicket(undefined, {
        title: 'Bug report',
        description: 'App freezes on load.',
      })
    ).rejects.toThrow(ValidationError);
  });

  it('throws BadRequestError if title or description is missing', async () => {
    await expect(
      aiService.categorizeTicket(undefined, {
        title: '',
        description: 'Some description',
      })
    ).rejects.toThrow(BadRequestError);
  });
});

