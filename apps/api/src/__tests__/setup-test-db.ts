import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../repositories/prisma.client';
import { env } from '../config/env';
import { Role, TicketPriority, TicketStatus } from '@prisma/client';

export function assertTestDatabase(): void {
  const dbUrl = process.env.DATABASE_URL || env.DATABASE_URL;
  if (!dbUrl || !dbUrl.includes('_test')) {
    throw new Error(
      `FATAL SAFETY VIOLATION: Test suite attempted to run against non-test database! DATABASE_URL must contain "_test". Current: ${dbUrl}`
    );
  }
}

export interface TestFixtures {
  users: {
    customer1: { id: number; email: string; token: string; role: Role };
    customer2: { id: number; email: string; token: string; role: Role };
    agent: { id: number; email: string; token: string; role: Role };
    admin: { id: number; email: string; token: string; role: Role };
  };
  tickets: {
    customer1P1Open: { id: number; reference: string };
    customer1P2Progress: { id: number; reference: string };
    customer1P3Resolved: { id: number; reference: string };
    customer2P2Open: { id: number; reference: string };
    customer2P4Closed: { id: number; reference: string };
  };
  comments: {
    publicCommentCust1: { id: number };
    internalCommentAgent: { id: number };
    publicCommentAgent: { id: number };
  };
}

export async function resetAndSeedDatabase(): Promise<TestFixtures> {
  assertTestDatabase();

  // 1. Truncate tables cleanly
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "comments", "tickets", "users" RESTART IDENTITY CASCADE;'
  );

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 2. Seed Users
  const c1 = await prisma.user.create({
    data: {
      name: 'Customer One',
      email: 'customer1@test.com',
      passwordHash,
      role: Role.customer,
      isActive: true,
    },
  });

  const c2 = await prisma.user.create({
    data: {
      name: 'Customer Two',
      email: 'customer2@test.com',
      passwordHash,
      role: Role.customer,
      isActive: true,
    },
  });

  const ag = await prisma.user.create({
    data: {
      name: 'Agent Dave',
      email: 'agent@test.com',
      passwordHash,
      role: Role.agent,
      isActive: true,
    },
  });

  const ad = await prisma.user.create({
    data: {
      name: 'Admin Sarah',
      email: 'admin@test.com',
      passwordHash,
      role: Role.admin,
      isActive: true,
    },
  });

  // Generate deterministic tokens
  const c1Token = jwt.sign({ id: c1.id, email: c1.email, role: c1.role }, env.JWT_SECRET, { expiresIn: '8h' });
  const c2Token = jwt.sign({ id: c2.id, email: c2.email, role: c2.role }, env.JWT_SECRET, { expiresIn: '8h' });
  const agToken = jwt.sign({ id: ag.id, email: ag.email, role: ag.role }, env.JWT_SECRET, { expiresIn: '8h' });
  const adToken = jwt.sign({ id: ad.id, email: ad.email, role: ad.role }, env.JWT_SECRET, { expiresIn: '8h' });

  // 3. Seed Tickets
  const t1 = await prisma.ticket.create({
    data: {
      reference: 'TCK-TEST-0001',
      title: 'Payment gateway timeout error',
      description: 'Customer getting 500 on checkout step',
      status: TicketStatus.open,
      priority: TicketPriority.P1,
      category: 'Billing',
      customerId: c1.id,
      assigneeId: ag.id,
      createdAt: new Date('2026-11-10T08:00:00Z'),
    },
  });

  const t2 = await prisma.ticket.create({
    data: {
      reference: 'TCK-TEST-0002',
      title: 'Login button unresponsive on Safari',
      description: 'Mobile browser cannot submit login form',
      status: TicketStatus.in_progress,
      priority: TicketPriority.P2,
      category: 'Frontend',
      customerId: c1.id,
      assigneeId: ag.id,
      createdAt: new Date('2026-11-10T08:30:00Z'),
    },
  });

  const t3 = await prisma.ticket.create({
    data: {
      reference: 'TCK-TEST-0003',
      title: 'Documentation typography feedback',
      description: 'Spotted a minor typo in API docs section',
      status: TicketStatus.resolved,
      priority: TicketPriority.P3,
      category: 'General',
      customerId: c1.id,
      assigneeId: null,
      resolvedAt: new Date('2026-11-10T09:00:00Z'),
      createdAt: new Date('2026-11-10T08:45:00Z'),
    },
  });

  const t4 = await prisma.ticket.create({
    data: {
      reference: 'TCK-TEST-0004',
      title: 'Customer 2 private billing request',
      description: 'Invoice duplicate request for November',
      status: TicketStatus.open,
      priority: TicketPriority.P2,
      category: 'Billing',
      customerId: c2.id,
      assigneeId: null,
      createdAt: new Date('2026-11-10T09:15:00Z'),
    },
  });

  const t5 = await prisma.ticket.create({
    data: {
      reference: 'TCK-TEST-0005',
      title: 'Customer 2 old closed ticket',
      description: 'Resolved archived inquiry',
      status: TicketStatus.closed,
      priority: TicketPriority.P4,
      category: 'General',
      customerId: c2.id,
      assigneeId: ag.id,
      resolvedAt: new Date('2026-11-10T09:30:00Z'),
      closedAt: new Date('2026-11-10T09:45:00Z'),
      createdAt: new Date('2026-11-10T09:20:00Z'),
    },
  });

  // 4. Seed Comments on Ticket 1
  const com1 = await prisma.comment.create({
    data: {
      ticketId: t1.id,
      authorId: c1.id,
      body: 'Public note from customer: I tried with another credit card but still got 500 error.',
      isInternal: false,
      createdAt: new Date('2026-11-10T08:05:00Z'),
    },
  });

  const com2 = await prisma.comment.create({
    data: {
      ticketId: t1.id,
      authorId: ag.id,
      body: 'Internal agent note: Investigated gateway logs - vendor timeout contacting Stripe.',
      isInternal: true,
      createdAt: new Date('2026-11-10T08:15:00Z'),
    },
  });

  const com3 = await prisma.comment.create({
    data: {
      ticketId: t1.id,
      authorId: ag.id,
      body: 'Public note from agent: We identified a vendor routing glitch and applied a hotfix. Please retry.',
      isInternal: false,
      createdAt: new Date('2026-11-10T08:25:00Z'),
    },
  });

  return {
    users: {
      customer1: { id: c1.id, email: c1.email, token: c1Token, role: c1.role },
      customer2: { id: c2.id, email: c2.email, token: c2Token, role: c2.role },
      agent: { id: ag.id, email: ag.email, token: agToken, role: ag.role },
      admin: { id: ad.id, email: ad.email, token: adToken, role: ad.role },
    },
    tickets: {
      customer1P1Open: { id: t1.id, reference: t1.reference },
      customer1P2Progress: { id: t2.id, reference: t2.reference },
      customer1P3Resolved: { id: t3.id, reference: t3.reference },
      customer2P2Open: { id: t4.id, reference: t4.reference },
      customer2P4Closed: { id: t5.id, reference: t5.reference },
    },
    comments: {
      publicCommentCust1: { id: com1.id },
      internalCommentAgent: { id: com2.id },
      publicCommentAgent: { id: com3.id },
    },
  };
}
