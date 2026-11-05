const { spawn } = require('child_process');

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAllTests() {
  console.log('=== Starting Test Run ===');
  const server = spawn('node', ['messy-express-app.js'], { cwd: __dirname });

  server.stdout.on('data', (d) => process.stdout.write(`[SERVER] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[SERVER ERR] ${d}`));

  await wait(1500);

  const testCases = [
    // T01: GET /tickets/1
    {
      id: 'T01',
      name: 'GET /tickets/1 (Existing ticket)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/1');
        const json = await res.json();
        return {
          pass: res.status === 200 && json.success === true && json.data.id === 1 && json.data.title === 'Login issue',
          status: res.status,
          json
        };
      }
    },
    // T02: GET /tickets/999
    {
      id: 'T02',
      name: 'GET /tickets/999 (Non-existent ticket)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/999');
        const json = await res.json();
        return {
          pass: res.status === 404 && json.success === false && json.message === 'Ticket not found',
          status: res.status,
          json
        };
      }
    },
    // T03: POST /tickets/1/close with confirm true
    {
      id: 'T03',
      name: 'POST /tickets/1/close (confirm true)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/1/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: true, closedBy: 'Mentor' })
        });
        const json = await res.json();
        return {
          pass: res.status === 200 && json.success === true && json.data.status === 'closed' && json.data.closedBy === 'Mentor',
          status: res.status,
          json
        };
      }
    },
    // T04: POST /tickets/999/close
    {
      id: 'T04',
      name: 'POST /tickets/999/close (Non-existent ticket)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/999/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm: true })
        });
        const json = await res.json();
        return {
          pass: res.status === 404 && json.success === false && json.message === 'Ticket not found',
          status: res.status,
          json
        };
      }
    },
    // T05: DELETE /tickets/999
    {
      id: 'T05',
      name: 'DELETE /tickets/999 (Non-existent ticket)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/999', { method: 'DELETE' });
        const json = await res.json();
        return {
          pass: res.status === 404 && json.success === false && json.message === 'Ticket not found',
          status: res.status,
          json
        };
      }
    },
    // T06: GET /tickets (List all with filters)
    {
      id: 'T06',
      name: 'GET /tickets?priority=high',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets?priority=high');
        const json = await res.json();
        return {
          pass: res.status === 200 && json.success === true && Array.isArray(json.data) && json.count === json.data.length,
          status: res.status,
          json
        };
      }
    },
    // T07: POST /tickets (Create new ticket)
    {
      id: 'T07',
      name: 'POST /tickets (Valid creation)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Printer Jam in Reception',
            description: 'Paper is stuck in tray 2',
            priority: 'low',
            owner: 'Carlos'
          })
        });
        const json = await res.json();
        return {
          pass: res.status === 201 && json.success === true && json.data.id === 4 && json.data.title === 'Printer Jam in Reception',
          status: res.status,
          json
        };
      }
    },
    // T08: POST /tickets (Validation error: short title)
    {
      id: 'T08',
      name: 'POST /tickets (Validation: title too short)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'No',
            description: 'Description long enough',
            priority: 'low'
          })
        });
        const json = await res.json();
        return {
          pass: res.status === 400 && json.success === false && json.message === 'Title must be at least 3 characters',
          status: res.status,
          json
        };
      }
    },
    // T09: POST /tickets (Duplicate open ticket check)
    {
      id: 'T09',
      name: 'POST /tickets (Duplicate open title check)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Email update',
            description: 'Another request for email',
            priority: 'medium'
          })
        });
        const json = await res.json();
        return {
          pass: res.status === 409 && json.success === false && json.message === 'An open ticket with this title already exists',
          status: res.status,
          json
        };
      }
    },
    // T10: DELETE /tickets/3 (Delete closed ticket)
    {
      id: 'T10',
      name: 'DELETE /tickets/3 (Delete closed ticket)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/3', { method: 'DELETE' });
        const json = await res.json();
        return {
          pass: res.status === 200 && json.success === true && json.data.id === 3 && json.message === 'Ticket deleted',
          status: res.status,
          json
        };
      }
    },
    // T11: GET /tickets/stats/summary
    {
      id: 'T11',
      name: 'GET /tickets/stats/summary',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/tickets/stats/summary');
        const json = await res.json();
        return {
          pass: res.status === 200 && json.success === true && typeof json.data.total === 'number',
          status: res.status,
          json
        };
      }
    },
    // T12: GET /health
    {
      id: 'T12',
      name: 'GET /health',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/health');
        const json = await res.json();
        return {
          pass: res.status === 200 && json.success === true && json.service === 'supportdesk-demo',
          status: res.status,
          json
        };
      }
    },
    // T13: Unmatched 404 endpoint
    {
      id: 'T13',
      name: 'GET /unknown-path (404 handler)',
      run: async () => {
        const res = await fetch('http://127.0.0.1:3000/unknown-path');
        const json = await res.json();
        return {
          pass: res.status === 404 && json.success === false && json.message === 'Endpoint not found',
          status: res.status,
          json
        };
      }
    }
  ];

  let passedCount = 0;
  for (const tc of testCases) {
    try {
      const res = await tc.run();
      if (res.pass) {
        console.log(`[PASS] ${tc.id}: ${tc.name}`);
        passedCount++;
      } else {
        console.log(`[FAIL] ${tc.id}: ${tc.name} -> Status: ${res.status}, Body: ${JSON.stringify(res.json)}`);
      }
    } catch (e) {
      console.log(`[ERROR] ${tc.id}: ${tc.name} -> ${e.message}`);
    }
  }

  console.log(`\nTest Summary: ${passedCount}/${testCases.length} Passed`);
  server.kill('SIGTERM');
}

runAllTests();
