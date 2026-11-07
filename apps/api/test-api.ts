import http from 'http';
import { app } from './src/app';
import { prisma } from './src/repositories/prisma.client';

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  response: unknown;
}

const results: TestResult[] = [];

function makeRequest(
  port: number,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : undefined;
    const options: http.RequestOptions = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode || 0, body: parsed });
        } catch {
          resolve({ status: res.statusCode || 0, body: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  const TEST_PORT = 3005;
  const server = app.listen(TEST_PORT, () => {
    console.log(`\n==================================================`);
    console.log(`Starting Day 9 API Integration Tests on port ${TEST_PORT}`);
    console.log(`==================================================\n`);
  });

  try {
    let createdTicketId: number | null = null;

    // Test 1: GET /health
    {
      const res = await makeRequest(TEST_PORT, 'GET', '/health');
      const passed = res.status === 200 && (res.body as any)?.data?.status === 'ok';
      results.push({
        name: 'Health Check Endpoint',
        endpoint: 'GET /health',
        method: 'GET',
        expectedStatus: 200,
        actualStatus: res.status,
        passed,
        response: res.body,
      });
      console.log(`[TEST 1] GET /health -> Status: ${res.status} | Passed: ${passed}`);
    }

    // Test 2: GET /tickets (List tickets)
    {
      const res = await makeRequest(TEST_PORT, 'GET', '/tickets');
      const passed = res.status === 200 && Array.isArray((res.body as any)?.data);
      results.push({
        name: 'List Tickets',
        endpoint: 'GET /tickets',
        method: 'GET',
        expectedStatus: 200,
        actualStatus: res.status,
        passed,
        response: { count: (res.body as any)?.data?.length, meta: (res.body as any)?.meta },
      });
      console.log(`[TEST 2] GET /tickets -> Status: ${res.status} | Total: ${(res.body as any)?.data?.length} | Passed: ${passed}`);
    }

    // Test 3: GET /tickets/:id (Existing Ticket #1)
    {
      const res = await makeRequest(TEST_PORT, 'GET', '/tickets/1');
      const passed = res.status === 200 && (res.body as any)?.data?.id === 1;
      results.push({
        name: 'Get Existing Ticket by ID',
        endpoint: 'GET /tickets/1',
        method: 'GET',
        expectedStatus: 200,
        actualStatus: res.status,
        passed,
        response: res.body,
      });
      console.log(`[TEST 3] GET /tickets/1 -> Status: ${res.status} | Title: ${(res.body as any)?.data?.title} | Passed: ${passed}`);
    }

    // Test 4: GET /tickets/:id (Non-existent Ticket #999999 -> 404)
    {
      const res = await makeRequest(TEST_PORT, 'GET', '/tickets/999999');
      const passed = res.status === 404 && (res.body as any)?.error?.code === 'NOT_FOUND';
      results.push({
        name: 'Get Nonexistent Ticket (404)',
        endpoint: 'GET /tickets/999999',
        method: 'GET',
        expectedStatus: 404,
        actualStatus: res.status,
        passed,
        response: res.body,
      });
      console.log(`[TEST 4] GET /tickets/999999 -> Status: ${res.status} | Error Code: ${(res.body as any)?.error?.code} | Passed: ${passed}`);
    }

    // Test 5: POST /tickets (Create valid ticket -> 201)
    {
      const payload = {
        title: 'Day 9 Integration Test Ticket',
        description: 'Verifying end-to-end 4-layer architecture ticket creation',
        customerId: 1,
        priority: 'P2',
        status: 'open',
        category: 'Testing',
      };
      const res = await makeRequest(TEST_PORT, 'POST', '/tickets', payload);
      createdTicketId = (res.body as any)?.data?.id;
      const passed = res.status === 201 && createdTicketId !== null && (res.body as any)?.data?.title === payload.title;
      results.push({
        name: 'Create Valid Ticket',
        endpoint: 'POST /tickets',
        method: 'POST',
        expectedStatus: 201,
        actualStatus: res.status,
        passed,
        response: res.body,
      });
      console.log(`[TEST 5] POST /tickets -> Status: ${res.status} | Created ID: ${createdTicketId} | Passed: ${passed}`);
    }

    // Test 6: POST /tickets (Validation failure - Missing required fields -> 400)
    {
      const invalidPayload = {
        title: 'AB', // too short (<3 chars)
        // missing description and customerId
      };
      const res = await makeRequest(TEST_PORT, 'POST', '/tickets', invalidPayload);
      const passed = res.status === 400 && (res.body as any)?.error?.code === 'VALIDATION_ERROR';
      results.push({
        name: 'Create Invalid Ticket (400 Validation Error)',
        endpoint: 'POST /tickets',
        method: 'POST',
        expectedStatus: 400,
        actualStatus: res.status,
        passed,
        response: res.body,
      });
      console.log(`[TEST 6] POST /tickets (Invalid) -> Status: ${res.status} | Error: ${(res.body as any)?.error?.message} | Passed: ${passed}`);
    }

    // Test 7: PATCH /tickets/:id (Update existing ticket -> 200)
    {
      if (createdTicketId) {
        const updatePayload = {
          title: 'Day 9 Integration Test Ticket (Updated)',
          status: 'in_progress',
          priority: 'P1',
        };
        const res = await makeRequest(TEST_PORT, 'PATCH', `/tickets/${createdTicketId}`, updatePayload);
        const passed = res.status === 200 && (res.body as any)?.data?.status === 'in_progress';
        results.push({
          name: 'Update Existing Ticket',
          endpoint: `PATCH /tickets/${createdTicketId}`,
          method: 'PATCH',
          expectedStatus: 200,
          actualStatus: res.status,
          passed,
          response: res.body,
        });
        console.log(`[TEST 7] PATCH /tickets/${createdTicketId} -> Status: ${res.status} | Status: ${(res.body as any)?.data?.status} | Passed: ${passed}`);
      }
    }

    // Test 8: PATCH /tickets/:id (Update non-existent ticket -> 404)
    {
      const res = await makeRequest(TEST_PORT, 'PATCH', '/tickets/999999', { title: 'Ghost Update' });
      const passed = res.status === 404 && (res.body as any)?.error?.code === 'NOT_FOUND';
      results.push({
        name: 'Update Nonexistent Ticket (404)',
        endpoint: 'PATCH /tickets/999999',
        method: 'PATCH',
        expectedStatus: 404,
        actualStatus: res.status,
        passed,
        response: res.body,
      });
      console.log(`[TEST 8] PATCH /tickets/999999 -> Status: ${res.status} | Passed: ${passed}`);
    }

    // Test 9: DELETE /tickets/:id (Soft-delete created ticket -> 200)
    {
      if (createdTicketId) {
        const res = await makeRequest(TEST_PORT, 'DELETE', `/tickets/${createdTicketId}`);
        const passed = res.status === 200 && (res.body as any)?.data?.deleted === true;
        results.push({
          name: 'Soft-Delete Ticket',
          endpoint: `DELETE /tickets/${createdTicketId}`,
          method: 'DELETE',
          expectedStatus: 200,
          actualStatus: res.status,
          passed,
          response: res.body,
        });
        console.log(`[TEST 9] DELETE /tickets/${createdTicketId} -> Status: ${res.status} | Passed: ${passed}`);

        // Confirm ticket is now filtered out by findById (returns 404)
        const checkRes = await makeRequest(TEST_PORT, 'GET', `/tickets/${createdTicketId}`);
        console.log(`[TEST 9.1 Verification] GET soft-deleted ticket -> Status: ${checkRes.status} (Expected 404)`);
      }
    }

    // Test 10: GET /test/error (Controlled test of central 500 handler)
    {
      const res = await makeRequest(TEST_PORT, 'GET', '/test/error');
      const passed = res.status === 500 && (res.body as any)?.error?.code === 'INTERNAL_SERVER_ERROR';
      results.push({
        name: 'Central 500 Error Handler',
        endpoint: 'GET /test/error',
        method: 'GET',
        expectedStatus: 500,
        actualStatus: res.status,
        passed,
        response: res.body,
      });
      console.log(`[TEST 10] GET /test/error -> Status: ${res.status} | Error Code: ${(res.body as any)?.error?.code} | Passed: ${passed}`);
    }

    // Test 11: GET /unknown-endpoint (404 Route Handler)
    {
      const res = await makeRequest(TEST_PORT, 'GET', '/nonexistent-route');
      const passed = res.status === 404 && (res.body as any)?.error?.code === 'NOT_FOUND';
      results.push({
        name: 'Unknown Route 404 Handler',
        endpoint: 'GET /nonexistent-route',
        method: 'GET',
        expectedStatus: 404,
        actualStatus: res.status,
        passed,
        response: res.body,
      });
      console.log(`[TEST 11] GET /nonexistent-route -> Status: ${res.status} | Passed: ${passed}`);
    }

    console.log(`\n==================================================`);
    console.log(`SUMMARY: ${results.filter((r) => r.passed).length} / ${results.length} Tests Passed`);
    console.log(`==================================================\n`);
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await prisma.$disconnect();
    server.close(() => {
      console.log('Test HTTP server closed.');
    });
  }
}

runTests();
