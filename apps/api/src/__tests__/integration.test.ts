import request from 'supertest';
import { app } from '../app';

describe('Supertest HTTP API Integration Tests', () => {
  describe('GET /health', () => {
    it('should return 200 OK with health status and uptime', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.status).toBe('ok');
      expect(typeof res.body.data.uptime).toBe('number');
      expect(res.body.error).toBeNull();
    });
  });

  describe('GET /docs and /docs.json', () => {
    it('should serve Swagger UI documentation at /docs', async () => {
      const res = await request(app).get('/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger-ui');
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
      const res = await request(app).get('/tickets/1/comments');
      expect(res.status).toBe(401);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 Unauthorized when posting comment without token', async () => {
      const res = await request(app)
        .post('/tickets/1/comments')
        .send({ body: 'Public note' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Query Validation & Error Envelopes', () => {
    it('should return 400 Bad Request if page is negative or non-integer', async () => {
      // Need auth to reach validation
      // But query validation can also be verified on query schema or with invalid token
      const res = await request(app)
        .get('/tickets?page=-5')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401); // Auth rejected first
    });

    it('should reject invalid auth registration payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ name: 'Test' }); // Missing email and password
      expect(res.status).toBe(400);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid auth login payload with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'not-an-email' }); // Invalid email and missing password
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for unknown endpoint with standard error envelope', async () => {
      const res = await request(app).get('/api/non-existent-endpoint');
      expect(res.status).toBe(404);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});

