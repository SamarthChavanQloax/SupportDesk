const { spawn } = require('child_process');

async function waitForServer(url, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        return true;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

async function runTests() {
  console.log('--- Spawning server: node messy-express-app.js ---');
  const server = spawn('node', ['messy-express-app.js'], { cwd: __dirname });

  server.stdout.on('data', (d) => process.stdout.write(`[SERVER] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[SERVER ERR] ${d}`));

  try {
    await waitForServer('http://127.0.0.1:3000/health');
    console.log('[TEST RUNNER] Server is ready. Executing test cases...\n');
  } catch (err) {
    console.error(`[TEST RUNNER] Readiness check failed: ${err.message}`);
    server.kill();
    process.exit(1);
  }

  const testCases = [
    {
      id: 'TC-01',
      name: 'Fetch existing ticket by ID (GET /tickets/1)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/1');
        const body = await res.json();
        const pass = res.status === 200 &&
                     body.success === true &&
                     body.data &&
                     body.data.id === 1 &&
                     body.data.title === 'Login issue';
        return { pass, status: res.status, body };
      }
    },
    {
      id: 'TC-02',
      name: 'Fetch nonexistent ticket by ID (GET /tickets/999)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/999');
        const body = await res.json();
        const pass = res.status === 404 &&
                     body.success === false &&
                     body.message === 'Ticket not found';
        return { pass, status: res.status, body };
      }
    },
    {
      id: 'TC-03',
      name: 'Close existing ticket with required confirmation (POST /tickets/1/close)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/1/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: true, closedBy: 'Mentor' })
        });
        const body = await res.json();
        const pass = res.status === 200 &&
                     body.success === true &&
                     body.message === 'Ticket closed' &&
                     body.data &&
                     body.data.id === 1 &&
                     body.data.status === 'closed' &&
                     body.data.closedBy === 'Mentor';
        return { pass, status: res.status, body };
      }
    },
    {
      id: 'TC-04',
      name: 'Attempt to close nonexistent ticket (POST /tickets/999/close)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/999/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: true })
        });
        const body = await res.json();
        const pass = res.status === 404 &&
                     body.success === false &&
                     body.message === 'Ticket not found';
        return { pass, status: res.status, body };
      }
    },
    {
      id: 'TC-05',
      name: 'Delete existing closed ticket (DELETE /tickets/3)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/3', {
          method: 'DELETE'
        });
        const body = await res.json();
        const pass = res.status === 200 &&
                     body.success === true &&
                     body.message === 'Ticket deleted' &&
                     body.data &&
                     body.data.id === 3;
        return { pass, status: res.status, body };
      }
    },
    {
      id: 'TC-06',
      name: 'Attempt to delete nonexistent ticket (DELETE /tickets/999)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/999', {
          method: 'DELETE'
        });
        const body = await res.json();
        const pass = res.status === 404 &&
                     body.success === false &&
                     body.message === 'Ticket not found';
        return { pass, status: res.status, body };
      }
    }
  ];

  let allPassed = true;
  const recordedResults = [];

  for (const tc of testCases) {
    try {
      const result = await tc.run();
      recordedResults.push({
        id: tc.id,
        name: tc.name,
        passed: result.pass,
        status: result.status,
        body: result.body
      });
      if (result.pass) {
        console.log(`[PASS] ${tc.id}: ${tc.name} -> Status: ${result.status}`);
      } else {
        console.error(`[FAIL] ${tc.id}: ${tc.name} -> Status: ${result.status}, Body: ${JSON.stringify(result.body)}`);
        allPassed = false;
      }
    } catch (e) {
      console.error(`[ERROR] ${tc.id}: ${tc.name} -> Exception: ${e.message}`);
      recordedResults.push({
        id: tc.id,
        name: tc.name,
        passed: false,
        error: e.message
      });
      allPassed = false;
    }
  }

  server.kill();

  console.log('\n--- Recorded Output Summary ---');
  console.log(JSON.stringify(recordedResults, null, 2));

  if (!allPassed) {
    console.error('\n[TEST RUNNER] One or more tests failed.');
    process.exitCode = 1;
  } else {
    console.log('\n[TEST RUNNER] All tests passed successfully.');
    process.exitCode = 0;
  }
}

runTests();
