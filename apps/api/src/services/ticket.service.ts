import { ticketRepository, TicketFilterOptions, CreateTicketData, UpdateTicketData } from '../repositories/ticket.repository';
import { NotFoundError, BadRequestError, ForbiddenError } from '../errors/app.error';

export interface UserContext {
  id: number;
  email: string;
  role: string;
}

export interface CreateTicketDTO {
  title: string;
  description: string;
  customerId?: number;
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
   * Retrieve all tickets matching optional query filters with ownership scoping & pagination
   * Security Rule:
   * - Customers can see ONLY their own tickets (customerId = currentUser.id).
   * - Agents and Admins can see all tickets.
   */
  async getAllTickets(filters: TicketFilterOptions = {}, currentUser?: UserContext) {
    const scopedFilters = { ...filters };

    if (currentUser?.role === 'customer') {
      scopedFilters.customerId = currentUser.id;
    }

    return ticketRepository.findManyWithPagination(scopedFilters);
  }

  /**
   * Retrieve a single ticket by ID with ownership check
   * Security Rule:
   * - Customers can access ONLY their own ticket.
   * - If a customer requests another customer's ticket, return NotFoundError
   *   (avoids leaking the existence of other tickets, preventing ID enumeration).
   */
  async getTicketById(id: number, currentUser?: UserContext) {
    const customerScope = currentUser?.role === 'customer' ? currentUser.id : undefined;
    const ticket = await ticketRepository.findById(id, false, customerScope);
    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${id}`);
    }
    return ticket;
  }

  /**
   * Create a new ticket with business validation and reference generation
   * Security Rule:
   * - For customers, customerId is ALWAYS set to currentUser.id
   *   (prevents parameter tampering / BOLA / IDOR).
   */
  async createTicket(dto: CreateTicketDTO, currentUser?: UserContext) {
    const customerId = currentUser?.role === 'customer'
      ? currentUser.id
      : (dto.customerId || currentUser?.id);

    if (!customerId) {
      throw new BadRequestError('Customer ID is required');
    }

    // 1. Verify customer exists
    const customerExists = await ticketRepository.userExists(customerId);
    if (!customerExists) {
      throw new BadRequestError(`Customer with ID ${customerId} does not exist`);
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
      customerId,
      assigneeId: dto.assigneeId || null,
    };

    return ticketRepository.create(createData);
  }

  /**
   * Update existing ticket with state-transition validation and ownership check
   */
  async updateTicket(id: number, dto: UpdateTicketDTO, currentUser?: UserContext) {
    // 1. Verify ticket exists and is accessible
    const customerScope = currentUser?.role === 'customer' ? currentUser.id : undefined;
    const existingTicket = await ticketRepository.findById(id, false, customerScope);
    if (!existingTicket) {
      throw new NotFoundError(`Ticket with ID ${id}`);
    }

    // 2. Customers cannot reassign tickets to agents
    if (currentUser?.role === 'customer' && dto.assigneeId !== undefined) {
      throw new ForbiddenError('Customers cannot assign or reassign tickets');
    }

    // 3. Verify assignee exists if assigned
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
        updateData.resolvedAt = null;
        updateData.closedAt = null;
      }
    }

    return ticketRepository.update(id, updateData);
  }

  /**
   * Soft-delete ticket with ownership check
   */
  async deleteTicket(id: number, currentUser?: UserContext) {
    const customerScope = currentUser?.role === 'customer' ? currentUser.id : undefined;
    const existing = await ticketRepository.findById(id, false, customerScope);
    if (!existing) {
      throw new NotFoundError(`Ticket with ID ${id}`);
    }

    await ticketRepository.softDelete(id);
    return { id, deleted: true, message: `Ticket ${existing.reference} soft-deleted successfully` };
  }
}

export const ticketService = new TicketService();
