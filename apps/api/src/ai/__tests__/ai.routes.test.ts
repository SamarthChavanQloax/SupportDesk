import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app';
import { env } from '../../config/env';
import { setOpenAiClient } from '../client';
import { ticketRepository } from '../../repositories/ticket.repository';
import { commentRepository } from '../../repositories/comment.repository';

jest.mock('../../repositories/ticket.repository');
jest.mock('../../repositories/comment.repository');
jest.mock('../usage-logger');

describe('AI Routes Security and Handlers', () => {
  const customerToken = jwt.sign(
    { id: 10, email: 'customer@test.com', role: 'customer' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const agentToken = jwt.sign(
    { id: 20, email: 'agent@test.com', role: 'agent' },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    setOpenAiClient(null);
  });

  describe('GET /tickets/:id/ai/suggest-reply', () => {
    it('returns 401 Unauthorized when no token is provided', async () => {
      const res = await request(app).get('/tickets/101/ai/suggest-reply');
      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden when authenticated as customer', async () => {
      const res = await request(app)
        .get('/tickets/101/ai/suggest-reply')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('streams suggested reply as text/event-stream for agent', async () => {
      (ticketRepository.findById as jest.Mock).mockResolvedValue({
        id: 101,
        reference: 'TCK-101',
        title: 'Need help with login',
        description: 'Password reset link expired',
        status: 'open',
        priority: 'P2',
        customer: { name: 'Alice' },
      });
      (commentRepository.findByTicketId as jest.Mock).mockResolvedValue([]);

      async function* mockGenerator() {
        yield { choices: [{ delta: { content: 'Hi Alice, ' } }] };
        yield { choices: [{ delta: { content: 'here is a fresh reset link.' } }] };
      }

      setOpenAiClient({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue(mockGenerator()),
          },
        },
      } as any);

      const res = await request(app)
        .get('/tickets/101/ai/suggest-reply')
        .set('Authorization', `Bearer ${agentToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
      expect(res.text).toContain('Hi Alice');
      expect(res.text).toContain('done');
    });
  });

  describe('POST /tickets/ai/categorize', () => {
    it('returns 401 Unauthorized when no token is provided', async () => {
      const res = await request(app)
        .post('/tickets/ai/categorize')
        .send({ title: 'Payment issue', description: 'Cannot charge card' });

      expect(res.status).toBe(401);
    });

    it('returns 403 Forbidden when authenticated as customer', async () => {
      const res = await request(app)
        .post('/tickets/ai/categorize')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ title: 'Payment issue', description: 'Cannot charge card' });

      expect(res.status).toBe(403);
    });

    it('returns 200 with validated categorization for agent', async () => {
      const validJsonOutput = JSON.stringify({
        category: 'Billing',
        priority: 'P1',
        confidence: 0.98,
        reasoning: 'Direct charge failure',
      });

      setOpenAiClient({
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{ message: { content: validJsonOutput } }],
              usage: { prompt_tokens: 100, completion_tokens: 25, total_tokens: 125 },
            }),
          },
        },
      } as any);

      const res = await request(app)
        .post('/tickets/ai/categorize')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          title: 'Invoice double charge',
          description: 'Payment was charged two times for the same month invoice.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.category).toBe('Billing');
      expect(res.body.data.priority).toBe('P1');
      expect(res.body.data.confidence).toBe(0.98);
      expect(res.body.error).toBeNull();
      expect(res.body.meta.tokens).toBe(125);
    });

    it('returns 400 Bad Request when title or description is missing', async () => {
      const res = await request(app)
        .post('/tickets/ai/categorize')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
    });
  });
});
