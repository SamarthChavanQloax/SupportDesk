import { ticketRepository, TicketFilterOptions, CreateTicketData, UpdateTicketData } from '../repositories/ticket.repository';
import { NotFoundError, BadRequestError } from '../errors/app.error';

export interface CreateTicketDTO {
  title: string;
  description: string;
  customerId: number;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  status?: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';
  category?: string;
  assigneeId?: number;
  reference?: string;
}

export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4';
  status?: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';
  category?: string;
  assigneeId?: number | null;
}

export class TicketService {
  /**
   * Retrieve all tickets matching optional query filters
   */
  async getAllTickets(filters: TicketFilterOptions = {}) {
    return ticketRepository.findMany(filters);
  }

  /**
   * Retrieve a single ticket by ID or throw NotFoundError
   */
  async getTicketById(id: number) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${id}`);
    }
    return ticket;
  }

  /**
   * Create a new ticket with business validation and reference generation
   */
  async createTicket(dto: CreateTicketDTO) {
    // 1. Verify customer exists
    const customerExists = await ticketRepository.userExists(dto.customerId);
    if (!customerExists) {
      throw new BadRequestError(`Customer with ID ${dto.customerId} does not exist`);
    }

    // 2. Verify assignee exists if provided
    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const assigneeExists = await ticketRepository.userExists(dto.assigneeId);
      if (!assigneeExists) {
        throw new BadRequestError(`Assignee with ID ${dto.assigneeId} does not exist`);
      }
    }

    // 3. Generate unique human-readable reference if not explicitly supplied
    let reference = dto.reference;
    if (!reference) {
      const totalCount = await ticketRepository.count();
      const currentYear = new Date().getFullYear();
      const sequence = String(totalCount + 1).padStart(4, '0');
      reference = `TCK-${currentYear}-${sequence}`;

      // Guarantee collision-free reference
      let existing = await ticketRepository.findByReference(reference);
      let attempts = 0;
      while (existing && attempts < 10) {
        attempts++;
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        reference = `TCK-${currentYear}-${randomSuffix}`;
        existing = await ticketRepository.findByReference(reference);
      }
    }

    const createData: CreateTicketData = {
      reference,
      title: dto.title.trim(),
      description: dto.description.trim(),
      status: dto.status ?? 'open',
      priority: dto.priority ?? 'P3',
      category: dto.category?.trim() || null,
      customerId: dto.customerId,
      assigneeId: dto.assigneeId || null,
    };

    return ticketRepository.create(createData);
  }

  /**
   * Update existing ticket with state-transition validation
   */
  async updateTicket(id: number, dto: UpdateTicketDTO) {
    // 1. Verify ticket exists
    const existingTicket = await ticketRepository.findById(id);
    if (!existingTicket) {
      throw new NotFoundError(`Ticket with ID ${id}`);
    }

    // 2. Verify assignee exists if assigned
    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const assigneeExists = await ticketRepository.userExists(dto.assigneeId);
      if (!assigneeExists) {
        throw new BadRequestError(`Assignee with ID ${dto.assigneeId} does not exist`);
      }
    }

    const updateData: UpdateTicketData = {};

    if (dto.title !== undefined) updateData.title = dto.title.trim();
    if (dto.description !== undefined) updateData.description = dto.description.trim();
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.category !== undefined) updateData.category = dto.category.trim();
    if (dto.assigneeId !== undefined) updateData.assigneeId = dto.assigneeId;

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === 'resolved' && !existingTicket.resolvedAt) {
        updateData.resolvedAt = new Date();
      } else if (dto.status === 'closed') {
        updateData.closedAt = new Date();
        if (!existingTicket.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
      } else if (dto.status === 'open' || dto.status === 'in_progress') {
        // If re-opened, clear resolved timestamp
        updateData.resolvedAt = null;
        updateData.closedAt = null;
      }
    }

    return ticketRepository.update(id, updateData);
  }

  /**
   * Soft-delete ticket to maintain historical and audit compliance
   */
  async deleteTicket(id: number) {
    const existing = await ticketRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Ticket with ID ${id}`);
    }

    await ticketRepository.softDelete(id);
    return { id, deleted: true, message: `Ticket ${existing.reference} soft-deleted successfully` };
  }
}

export const ticketService = new TicketService();
