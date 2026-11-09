import { prisma } from './prisma.client';
import { TicketStatus, TicketPriority, Ticket } from '@prisma/client';

export { TicketStatus, TicketPriority, Ticket };

export interface TicketFilterOptions {
  status?: TicketStatus;
  priority?: TicketPriority;
  customerId?: number;
  assigneeId?: number;
  includeDeleted?: boolean;
}

export interface CreateTicketData {
  reference: string;
  title: string;
  description: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string | null;
  slaDueTime?: Date | null;
  customerId: number;
  assigneeId?: number | null;
}

export interface UpdateTicketData {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string | null;
  assigneeId?: number | null;
  resolvedAt?: Date | null;
  closedAt?: Date | null;
}

export class TicketRepository {
  /**
   * Retrieve tickets with optional filtering
   */
  async findMany(filters: TicketFilterOptions = {}): Promise<Ticket[]> {
    const where: Record<string, unknown> = {};

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    return prisma.ticket.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find a single ticket by its numerical ID, optionally scoped to a customer
   */
  async findById(id: number, includeDeleted = false, customerId?: number): Promise<Ticket | null> {
    const where: Record<string, unknown> = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    if (customerId !== undefined) {
      where.customerId = customerId;
    }

    return prisma.ticket.findFirst({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            body: true,
            isInternal: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find a ticket by its unique reference code (e.g. TCK-2026-0001)
   */
  async findByReference(reference: string): Promise<Ticket | null> {
    return prisma.ticket.findUnique({
      where: { reference },
    });
  }

  /**
   * Insert a new ticket record
   */
  async create(data: CreateTicketData): Promise<Ticket> {
    return prisma.ticket.create({
      data: {
        reference: data.reference,
        title: data.title,
        description: data.description,
        status: data.status ?? 'open',
        priority: data.priority ?? 'P3',
        category: data.category ?? null,
        slaDueTime: data.slaDueTime ?? null,
        customerId: data.customerId,
        assigneeId: data.assigneeId ?? null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Update an existing ticket record
   */
  async update(id: number, data: UpdateTicketData): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Perform soft-delete by setting deletedAt timestamp
   */
  async softDelete(id: number): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Check if a user exists by ID (for foreign key validation)
   */
  async userExists(userId: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return user !== null;
  }

  /**
   * Count total non-deleted tickets
   */
  async count(): Promise<number> {
    return prisma.ticket.count({
      where: { deletedAt: null },
    });
  }
}

export const ticketRepository = new TicketRepository();
