// DEMO ONLY: intentionally messy single-file Express app for Clean Code practice.
// This is NOT the lead-provided SupportDesk exercise file.
// Run only in a separate practice folder after installing Express: npm install express

const express = require('express');
const app = express();
app.use(express.json());

// In-memory demo data; restarting the server resets these records.
let tickets = [
  { id: 1, title: 'Login issue', description: 'Cannot sign in', status: 'open', priority: 'high', owner: 'Asha', createdAt: new Date().toISOString() },
  { id: 2, title: 'Email update', description: 'Need to update email', status: 'open', priority: 'low', owner: 'Ravi', createdAt: new Date().toISOString() },
  { id: 3, title: 'Payment failed', description: 'Payment did not complete', status: 'closed', priority: 'high', owner: 'Mina', createdAt: new Date().toISOString() }
];
let nextId = 4;

function findTicketIndexById(id) {
  return tickets.findIndex((ticket) => ticket.id === id);
}

// List tickets. Filtering, business decisions, and response formatting live together.
app.get('/tickets', (req, res) => {
  try {
    let result = tickets;
    if (req.query.status) {
      result = result.filter((x) => x.status === req.query.status);
    }
    if (req.query.priority) {
      result = result.filter((x) => x.priority === req.query.priority);
    }
    if (req.query.owner) {
      result = result.filter((x) => x.owner.toLowerCase().includes(req.query.owner.toLowerCase()));
    }
    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});

// Fetch one ticket. The route handler also performs data access and mapping.
app.get('/tickets/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = findTicketIndexById(id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    const item = tickets[index];
    const response = {
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      owner: item.owner,
      createdAt: item.createdAt
    };
    return res.status(200).json({ success: true, data: response });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Unable to fetch ticket' });
  }
});

// Create ticket. Validation, policy, ID generation, persistence, and HTTP response
// are deliberately mixed into one handler for the refactoring exercise.
app.post('/tickets', (req, res) => {
  try {
    const title = req.body.title;
    const description = req.body.description;
    const priority = req.body.priority || 'medium';
    const owner = req.body.owner || 'Unassigned';
    if (!title || title.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Title must be at least 3 characters' });
    }
    if (!description || description.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Description must be at least 5 characters' });
    }
    if (!['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority' });
    }
    if (tickets.length > 1000) {
      return res.status(400).json({ success: false, message: 'Ticket limit reached' });
    }
    const duplicate = tickets.find((x) => x.title.toLowerCase() === title.toLowerCase() && x.status === 'open');
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'An open ticket with this title already exists' });
    }
    const created = {
      id: nextId++, title: title.trim(), description: description.trim(),
      status: 'open', priority, owner, createdAt: new Date().toISOString()
    };
    tickets.push(created);
    console.log('ticket created', created.id);
    return res.status(201).json({ success: true, message: 'Ticket created', data: created });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'Create failed' });
  }
});

// Close ticket. Business rules and storage mutation are embedded in the route.
app.post('/tickets/:id/close', (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = findTicketIndexById(id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Ticket not found' });
    const ticket = tickets[index];
    if (ticket.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Ticket is already closed' });
    }
    if (ticket.priority === 'high' && req.body.confirm !== true) {
      return res.status(400).json({ success: false, message: 'High priority ticket requires confirmation' });
    }
    ticket.status = 'closed';
    ticket.closedAt = new Date().toISOString();
    ticket.closedBy = req.body.closedBy || 'system';
    return res.status(200).json({ success: true, message: 'Ticket closed', data: ticket });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Could not close ticket' });
  }
});

// Delete ticket. No shared error middleware or reusable not-found handling is used.
app.delete('/tickets/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const index = findTicketIndexById(id);
    if (index === -1) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (tickets[index].status !== 'closed') {
      return res.status(400).json({ success: false, message: 'Only closed tickets can be deleted' });
    }
    const removed = tickets.splice(index, 1);
    return res.status(200).json({ success: true, message: 'Ticket deleted', data: removed[0] });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// Ticket statistics. Counting rules and response construction are mixed here.
app.get('/tickets/stats/summary', (req, res) => {
  try {
    const total = tickets.length;
    const open = tickets.filter((x) => x.status === 'open').length;
    const closed = tickets.filter((x) => x.status === 'closed').length;
    const high = tickets.filter((x) => x.priority === 'high').length;
    const low = tickets.filter((x) => x.priority === 'low').length;
    const medium = tickets.filter((x) => x.priority === 'medium').length;
    const summary = { total, open, closed, high, medium, low };
    return res.status(200).json({ success: true, data: summary });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Stats failed' });
  }
});

// Health endpoint is simple, but the port is a magic value below.
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, service: 'supportdesk-demo' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.listen(3000, () => {
  console.log('Demo API running on port 3000');
});
