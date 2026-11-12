import http from 'http';
import { app } from './src/app';
import { prisma } from './src/repositories/prisma.client';
import bcrypt from 'bcryptjs';

const PORT = 3006;
const BASE_URL = `http://localhost:${PORT}`;

interface RequestOptions {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
}

interface ResponseResult {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: any;
}

function makeRequest(opts: RequestOptions): Promise<ResponseResult> {
  return new Promise((resolve, reject) => {
    const payload = opts.body ? JSON.stringify(opts.body) : undefined;
    const headers: Record<string, string> = {
      ...(opts.headers || {}),
    };

    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      `${BASE_URL}${opts.path}`,
      {
        method: opts.method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsedBody: any;
          try {
            parsedBody = JSON.parse(rawData);
          } catch {
            parsedBody = rawData;
          }
          resolve({
            status: res.statusCode || 500,
            headers: res.headers,
            body: parsedBody,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('Starting Day 10 Authentication & Security Test Suite');
  console.log('====================================================\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));

  let passedCount = 0;
  let totalCount = 0;

  function assert(testId: string, description: string, condition: boolean, extraInfo: string = '') {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`[PASS] ${testId} - ${description} ${extraInfo}`);
    } else {
      console.error(`[FAIL] ${testId} - ${description} ${extraInfo}`);
    }
  }

  try {
    // Clean up any previous test user
    const testEmail = 'day10.tester@example.com';
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // AUTH-19: Helmet Security Headers on GET /health
    const healthRes = await makeRequest({ method: 'GET', path: '/health' });
    assert(
      'AUTH-19',
      'Helmet Security Headers present on responses',
      healthRes.status === 200 &&
        !!healthRes.headers['x-content-type-options'] &&
        !!healthRes.headers['x-frame-options'],
      `Status: ${healthRes.status}`
    );

    // AUTH-17: CORS allowlist check
    const corsApproved = await makeRequest({
      method: 'GET',
      path: '/health',
      headers: { Origin: 'http://localhost:5173' },
    });
    const corsDisallowed = await makeRequest({
      method: 'GET',
      path: '/health',
      headers: { Origin: 'http://malicious-site.com' },
    });
    assert(
      'AUTH-17',
      'CORS origin allowlist correctly permits approved and rejects unapproved',
      corsApproved.headers['access-control-allow-origin'] === 'http://localhost:5173' &&
        !corsDisallowed.headers['access-control-allow-origin'],
      `Approved: ${corsApproved.headers['access-control-allow-origin']}, Disallowed: ${corsDisallowed.headers['access-control-allow-origin'] || 'NONE'}`
    );

    // AUTH-01: Register valid customer
    const regRes = await makeRequest({
      method: 'POST',
      path: '/auth/register',
      body: {
        name: 'Day10 Test Customer',
        email: testEmail,
        password: 'Password123!',
      },
    });
    const createdUser = regRes.body?.data;
    assert(
      'AUTH-01',
      'Register valid customer succeeds with safe user and 201 Created',
      regRes.status === 201 &&
        createdUser?.email === testEmail &&
        createdUser?.role === 'customer' &&
        createdUser?.passwordHash === undefined,
      `Status: ${regRes.status}, User ID: ${createdUser?.id}, Role: ${createdUser?.role}`
    );

    // AUTH-02: Duplicate registration rejected
    const dupRes = await makeRequest({
      method: 'POST',
      path: '/auth/register',
      body: {
        name: 'Day10 Imposter',
        email: testEmail,
        password: 'Password123!',
      },
    });
    assert(
      'AUTH-02',
      'Duplicate registration returns 409 Conflict',
      dupRes.status === 409 && dupRes.body?.error?.code === 'CONFLICT',
      `Status: ${dupRes.status}, Code: ${dupRes.body?.error?.code}`
    );

    // AUTH-03: Invalid registration input rejected
    const invRegRes = await makeRequest({
      method: 'POST',
      path: '/auth/register',
      body: {
        name: 'X',
        email: 'not-an-email',
        password: '123',
      },
    });
    assert(
      'AUTH-03',
      'Invalid registration input returns 400 Validation Error',
      invRegRes.status === 400 && invRegRes.body?.error?.code === 'VALIDATION_ERROR',
      `Status: ${invRegRes.status}, Details count: ${invRegRes.body?.error?.details?.length}`
    );

    // AUTH-04: Password storage check in DB
    const dbRecord = await prisma.user.findUnique({ where: { email: testEmail } });
    const isBcrypt = dbRecord?.passwordHash?.startsWith('$2b$10$');
    const isMatch = dbRecord?.passwordHash
      ? await bcrypt.compare('Password123!', dbRecord.passwordHash)
      : false;
    assert(
      'AUTH-04',
      'Password stored as bcrypt hash; plain password absent in DB',
      !!isBcrypt && isMatch && dbRecord?.passwordHash !== 'Password123!',
      `Hash prefix: ${dbRecord?.passwordHash?.slice(0, 7)}`
    );

    // AUTH-05: Login with valid credentials
    const loginRes = await makeRequest({
      method: 'POST',
      path: '/auth/login',
      body: {
        email: testEmail,
        password: 'Password123!',
      },
    });
    const customerToken = loginRes.body?.data?.accessToken;
    assert(
      'AUTH-05',
      'Login valid credentials returns 200 OK and JWT access token',
      loginRes.status === 200 && typeof customerToken === 'string' && customerToken.length > 20,
      `Status: ${loginRes.status}, Token length: ${customerToken?.length}`
    );

    // AUTH-06: Login with wrong password
    const wrongPassRes = await makeRequest({
      method: 'POST',
      path: '/auth/login',
      body: {
        email: testEmail,
        password: 'WrongPassword999!',
      },
    });
    assert(
      'AUTH-06',
      'Login with wrong password returns 401 Unauthorized with generic message',
      wrongPassRes.status === 401 && wrongPassRes.body?.error?.message === 'Invalid email or password',
      `Status: ${wrongPassRes.status}, Error: ${wrongPassRes.body?.error?.message}`
    );

    // AUTH-07: Login with unknown email
    const unknownEmailRes = await makeRequest({
      method: 'POST',
      path: '/auth/login',
      body: {
        email: 'nonexistent-user-999@example.com',
        password: 'Password123!',
      },
    });
    assert(
      'AUTH-07',
      'Login with unknown email returns identical 401 generic error (prevents enumeration)',
      unknownEmailRes.status === 401 &&
        unknownEmailRes.body?.error?.message === 'Invalid email or password',
      `Status: ${unknownEmailRes.status}, Error: ${unknownEmailRes.body?.error?.message}`
    );

    // AUTH-08: Missing token on protected route
    const noTokenRes = await makeRequest({
      method: 'GET',
      path: '/tickets',
    });
    assert(
      'AUTH-08',
      'Protected endpoint without Authorization header returns 401 Unauthorized',
      noTokenRes.status === 401 && noTokenRes.body?.error?.code === 'UNAUTHORIZED',
      `Status: ${noTokenRes.status}`
    );

    // AUTH-09: Malformed token on protected route
    const malformedTokenRes = await makeRequest({
      method: 'GET',
      path: '/tickets',
      headers: { Authorization: 'Bearer this-is-not-a-valid-jwt' },
    });
    assert(
      'AUTH-09',
      'Protected endpoint with malformed token returns 401 Unauthorized',
      malformedTokenRes.status === 401,
      `Status: ${malformedTokenRes.status}`
    );

    // AUTH-10: Expired / invalid signature token
    const invalidSigToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhbGljZUBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAwfQ.invalidSignatureFakeHash';
    const expiredTokenRes = await makeRequest({
      method: 'GET',
      path: '/tickets',
      headers: { Authorization: `Bearer ${invalidSigToken}` },
    });
    assert(
      'AUTH-10',
      'Protected endpoint with invalid signature token returns 401 Unauthorized',
      expiredTokenRes.status === 401,
      `Status: ${expiredTokenRes.status}`
    );

    // Log in as seeded customer Alice (ID 1)
    const aliceLogin = await makeRequest({
      method: 'POST',
      path: '/auth/login',
      body: { email: 'alice.customer@example.com', password: 'Password123!' },
    });
    const aliceToken = aliceLogin.body?.data?.accessToken;

    // Log in as seeded agent Dave (ID 4)
    const daveLogin = await makeRequest({
      method: 'POST',
      path: '/auth/login',
      body: { email: 'dave.agent@example.com', password: 'Password123!' },
    });
    const daveToken = daveLogin.body?.data?.accessToken;

    // AUTH-11: Customer allowed route
    const customerTicketsRes = await makeRequest({
      method: 'GET',
      path: '/tickets',
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(
      'AUTH-11',
      'Customer token on customer-permitted route returns 200 OK',
      customerTicketsRes.status === 200 && Array.isArray(customerTicketsRes.body?.data),
      `Status: ${customerTicketsRes.status}, Tickets returned: ${customerTicketsRes.body?.data?.length}`
    );

    // AUTH-12: Wrong role - Customer attempts agent-only DELETE endpoint
    const wrongRoleRes = await makeRequest({
      method: 'DELETE',
      path: '/tickets/1',
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(
      'AUTH-12',
      'Customer token on agent-only route (DELETE /tickets/:id) returns 403 Forbidden',
      wrongRoleRes.status === 403 && wrongRoleRes.body?.error?.code === 'FORBIDDEN',
      `Status: ${wrongRoleRes.status}, Error Code: ${wrongRoleRes.body?.error?.code}`
    );

    // AUTH-13: Customer reads own ticket
    // Ticket 1 belongs to Alice (customerId 1)
    const ownTicketRes = await makeRequest({
      method: 'GET',
      path: '/tickets/1',
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(
      'AUTH-13',
      'Customer can retrieve their own ticket',
      ownTicketRes.status === 200 && ownTicketRes.body?.data?.id === 1,
      `Status: ${ownTicketRes.status}, Ticket ID: ${ownTicketRes.body?.data?.id}, Title: ${ownTicketRes.body?.data?.title}`
    );

    // AUTH-14: Customer attempts to read another customer's ticket
    // Find a ticket that does NOT belong to customerId 1
    const otherTicket = await prisma.ticket.findFirst({
      where: { customerId: { not: 1 }, deletedAt: null },
    });
    const otherTicketId = otherTicket?.id || 2;

    const foreignTicketRes = await makeRequest({
      method: 'GET',
      path: `/tickets/${otherTicketId}`,
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(
      'AUTH-14',
      'Customer querying another customer ticket returns 404 Not Found (no data leakage)',
      foreignTicketRes.status === 404 && foreignTicketRes.body?.error?.code === 'NOT_FOUND',
      `Status: ${foreignTicketRes.status}, Ticket Target: #${otherTicketId}`
    );

    // AUTH-15: Agent ticket visibility
    const agentTicketsRes = await makeRequest({
      method: 'GET',
      path: '/tickets',
      headers: { Authorization: `Bearer ${daveToken}` },
    });
    assert(
      'AUTH-15',
      'Agent can view all tickets across all customers',
      agentTicketsRes.status === 200 &&
        agentTicketsRes.body?.meta?.total >= 50 &&
        agentTicketsRes.body?.meta?.total > (customerTicketsRes.body?.meta?.total || 0),
      `Total tickets visible to agent: ${agentTicketsRes.body?.meta?.total}, customer total: ${customerTicketsRes.body?.meta?.total}`
    );

    // AUTH-16: Password hash exposure check across all endpoints
    const hasPasswordHash =
      JSON.stringify(regRes.body).includes('passwordHash') ||
      JSON.stringify(loginRes.body).includes('passwordHash') ||
      JSON.stringify(customerTicketsRes.body).includes('passwordHash') ||
      JSON.stringify(ownTicketRes.body).includes('passwordHash');
    assert(
      'AUTH-16',
      'passwordHash is never exposed in any API response',
      !hasPasswordHash,
      `Exposed: ${hasPasswordHash}`
    );

    // AUTH-18: Login rate limiting (exceeding 10 attempts returns 429)
    let rateLimitTriggered = false;
    let rateLimitStatus = 0;
    // We already sent ~6 login requests. Sending 10 more will exceed the limit of 10.
    for (let i = 0; i < 10; i++) {
      const rlRes = await makeRequest({
        method: 'POST',
        path: '/auth/login',
        body: { email: 'rate.limit@example.com', password: 'Password123!' },
      });
      if (rlRes.status === 429) {
        rateLimitTriggered = true;
        rateLimitStatus = rlRes.status;
        break;
      }
    }
    assert(
      'AUTH-18',
      'Login rate limiter returns 429 Too Many Requests when threshold exceeded',
      rateLimitTriggered && rateLimitStatus === 429,
      `Status: ${rateLimitStatus}`
    );

    // Clean up test user
    await prisma.user.deleteMany({ where: { email: testEmail } });

    console.log('\n====================================================');
    console.log(`DAY 10 TEST RESULTS: ${passedCount} / ${totalCount} PASSED`);
    console.log('====================================================\n');
  } catch (error) {
    console.error('Fatal test execution failure:', error);
  } finally {
    await prisma.$disconnect();
    server.close();
  }
}

runTests();
