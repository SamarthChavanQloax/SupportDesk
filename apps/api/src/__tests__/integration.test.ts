import request from 'supertest';
import { app } from '../app';
import { resetAndSeedDatabase, TestFixtures } from './setup-test-db';
import { prisma } from '../repositories/prisma.client';

describe('Supertest HTTP API Integration Tests (Isolated Test Database)', () => {
  let fixtures: TestFixtures;

  beforeAll(async () => {
    fixtures = await resetAndSeedDatabase();
  });

  beforeEach(async () => {
    fixtures = await resetAndSeedDatabase();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /health & /docs', () => {
    it('should return 200 OK with health status and uptime', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.status).toBe('ok');
      expect(typeof res.body.data.uptime).toBe('number');
      expect(res.body.error).toBeNull();
    });

    it('should serve Swagger UI HTML documentation at /docs/', async () => {
      const res = await request(app).get('/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger-ui');
      expect(res.text).toContain('html');
    });

    it('should serve raw OpenAPI JSON specification at /docs.json', async () => {
      const res = await request(app).get('/docs.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.info.title).toBe('SupportDesk API');
      expect(res.body.paths).toHaveProperty('/tickets');
      expect(res.body.paths).toHaveProperty('/tickets/{id}/comments');
    });
  });

  describe('Authentication & Authorization Guards', () => {
    it('should return 401 Unauthorized when accessing /tickets without token', async () => {
      const res = await request(app).get('/tickets');
      expect(res.status).toBe(401);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 Unauthorized when accessing /tickets/:id/comments without token', async () => {
      const res = await request(app).get(`/tickets/${fixtures.tickets.customer1P1Open.id}/comments`);
      expect(res.status).toBe(401);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 Unauthorized when posting comment without token', async () => {
      const res = await request(app)
        .post(`/tickets/${fixtures.tickets.customer1P1Open.id}/comments`)
        .send({ body: 'Public note without token' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 Forbidden when customer accesses agent-only route (DELETE /tickets/:id)', async () => {
      const res = await request(app)
        .delete(`/tickets/${fixtures.tickets.customer1P1Open.id}`)
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`);
      expect(res.status).toBe(403);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Query Validation & Error Envelopes', () => {
    it('should return 400 Bad Request with validation error envelope if page is negative or non-integer', async () => {
      const res = await request(app)
        .get('/tickets?page=-5')
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`);
      expect(res.status).toBe(400);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Request input validation failed');
    });

    it('should return 400 Bad Request if limit exceeds maximum 100', async () => {
      const res = await request(app)
        .get('/tickets?limit=150')
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 Bad Request if filter value for status is invalid', async () => {
      const res = await request(app)
        .get('/tickets?status=invalid_status_enum')
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 Bad Request if sortBy field is not in allowlist', async () => {
      const res = await request(app)
        .get('/tickets?sortBy=password_hash')
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid auth registration payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid auth login payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for unknown endpoint with standard error envelope', async () => {
      const res = await request(app).get('/api/non-existent-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Ticket Querying, Scoping, Filtering & Sorting', () => {
    it('should paginate results with small limit and return accurate meta { page, limit, total, totalPages }', async () => {
      // Customer 1 has 3 tickets. limit=2 should return 2 on page 1, total=3, totalPages=2
      const res = await request(app)
        .get('/tickets?page=1&limit=2')
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('should strictly scope customer queries to their own tickets and total count', async () => {
      const res = await request(app)
        .get('/tickets')
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.data.every((t: any) => t.customerId === fixtures.users.customer1.id)).toBe(true);
    });

    it('should allow agents to view all tickets in system across all customers', async () => {
      const res = await request(app)
        .get('/tickets')
        .set('Authorization', `Bearer ${fixtures.users.agent.token}`);

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(5);
      expect(res.body.data).toHaveLength(5);
    });

    it('should filter tickets by status', async () => {
      const res = await request(app)
        .get('/tickets?status=in_progress')
        .set('Authorization', `Bearer ${fixtures.users.agent.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.every((t: any) => t.status === 'in_progress')).toBe(true);
    });

    it('should filter tickets by priority', async () => {
      const res = await request(app)
        .get('/tickets?priority=P1')
        .set('Authorization', `Bearer ${fixtures.users.agent.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].priority).toBe('P1');
    });

    it('should filter tickets by assigneeId', async () => {
      const res = await request(app)
        .get(`/tickets?assigneeId=${fixtures.users.agent.id}`)
        .set('Authorization', `Bearer ${fixtures.users.agent.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.every((t: any) => t.assigneeId === fixtures.users.agent.id)).toBe(true);
    });

    it('should search tickets on known terms across title, description, and reference', async () => {
      const res = await request(app)
        .get('/tickets?search=checkout')
        .set('Authorization', `Bearer ${fixtures.users.agent.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].reference).toBe('TCK-TEST-0001');
    });

    it('should sort tickets by createdAt ascending and descending', async () => {
      const resAsc = await request(app)
        .get('/tickets?sortBy=createdAt&sortOrder=asc')
        .set('Authorization', `Bearer ${fixtures.users.agent.token}`);

      expect(resAsc.status).toBe(200);
      const datesAsc = resAsc.body.data.map((t: any) => new Date(t.createdAt).getTime());
      expect(datesAsc).toEqual([...datesAsc].sort((a, b) => a - b));

      const resDesc = await request(app)
        .get('/tickets?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${fixtures.users.agent.token}`);

      expect(resDesc.status).toBe(200);
      const datesDesc = resDesc.body.data.map((t: any) => new Date(t.createdAt).getTime());
      expect(datesDesc).toEqual([...datesDesc].sort((a, b) => b - a));
    });

    it('should return 404 when customer queries another customer ticket (no data leakage)', async () => {
      const foreignTicketId = fixtures.tickets.customer2P2Open.id;
      const res = await request(app)
        .get(`/tickets/${foreignTicketId}`)
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Ticket Comments Sub-resource Integration', () => {
    it('should create comment and set authorId equal to verified JWT user (ignores client authorId)', async () => {
      const ticketId = fixtures.tickets.customer1P1Open.id;
      const res = await request(app)
        .post(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`)
        .send({
          body: 'Legitimate comment from Customer 1',
          authorId: 99999, // Attempted spoofing
        });

      expect(res.status).toBe(201);
      expect(res.body.data.body).toBe('Legitimate comment from Customer 1');
      expect(res.body.data.authorId).toBe(fixtures.users.customer1.id);
      expect(res.body.data.isInternal).toBe(false);
    });

    it('should return 403 Forbidden when customer attempts to post isInternal: true', async () => {
      const ticketId = fixtures.tickets.customer1P1Open.id;
      const res = await request(app)
        .post(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`)
        .send({
          body: 'Customer attempting internal note',
          isInternal: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 Bad Request when posting empty or whitespace comment body', async () => {
      const ticketId = fixtures.tickets.customer1P1Open.id;
      const res = await request(app)
        .post(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`)
        .send({ body: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 Not Found when commenting on non-existent ticket', async () => {
      const res = await request(app)
        .post('/tickets/99999/comments')
        .set('Authorization', `Bearer ${fixtures.users.agent.token}`)
        .send({ body: 'Comment on non-existent ticket' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('should filter out internal comments when customer lists comments', async () => {
      // Ticket 1 has 1 customer public comment, 1 agent internal note, 1 agent public comment
      const ticketId = fixtures.tickets.customer1P1Open.id;
      const res = await request(app)
        .get(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.every((c: any) => c.isInternal === false)).toBe(true);
    });

    it('should include all comments (both public and internal) when agent lists comments', async () => {
      const ticketId = fixtures.tickets.customer1P1Open.id;
      const res = await request(app)
        .get(`/tickets/${ticketId}/comments`)
        .set('Authorization', `Bearer ${fixtures.users.agent.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data.some((c: any) => c.isInternal === true)).toBe(true);
    });

    it('should return 404 when customer requests comments for another customer ticket', async () => {
      const foreignTicketId = fixtures.tickets.customer2P2Open.id;
      const res = await request(app)
        .get(`/tickets/${foreignTicketId}/comments`)
        .set('Authorization', `Bearer ${fixtures.users.customer1.token}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
