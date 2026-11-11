import { TicketService } from '../ticket.service';
import { ticketRepository, Ticket } from '../../repositories/ticket.repository';
import { NotFoundError, BadRequestError, ForbiddenError, UnauthorizedError } from '../../errors/app.error';

jest.mock('../../repositories/ticket.repository');

const createMockTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 1,
  reference: 'TCK-2026-0001',
  title: 'Test Ticket',
  description: 'Test Description',
  status: 'open',
  priority: 'P3',
  category: 'General',
  slaDueTime: null,
  customerId: 10,
  assigneeId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  resolvedAt: null,
  closedAt: null,
  deletedAt: null,
  ...overrides,
});

describe('TicketService Unit Tests (Repository Mocked)', () => {
  let ticketService: TicketService;
  const mockedRepo = jest.mocked(ticketRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    ticketService = new TicketService();
  });

  describe('getAllTickets', () => {
    it('should scope customer queries to their own customerId', async () => {
      mockedRepo.findManyWithPagination.mockResolvedValue({
        tickets: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const customerUser = { id: 42, email: 'cust@test.com', role: 'customer' };
      const filters = { status: 'open' as const, page: 1, limit: 10 };

      await ticketService.getAllTickets(filters, customerUser);

      expect(mockedRepo.findManyWithPagination).toHaveBeenCalledWith({
        status: 'open',
        page: 1,
        limit: 10,
        customerId: 42,
      });
    });

    it('should NOT overwrite customerId for agent or admin unless provided in filter', async () => {
      mockedRepo.findManyWithPagination.mockResolvedValue({
        tickets: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const agentUser = { id: 7, email: 'agent@test.com', role: 'agent' };
      const filters = { priority: 'P1' as const, page: 2, limit: 20 };

      await ticketService.getAllTickets(filters, agentUser);

      expect(mockedRepo.findManyWithPagination).toHaveBeenCalledWith({
        priority: 'P1',
        page: 2,
        limit: 20,
      });
    });

    it('should forward search, sort, and pagination parameters cleanly to repository', async () => {
      mockedRepo.findManyWithPagination.mockResolvedValue({
        tickets: [createMockTicket({ id: 1, title: 'Payment failure', priority: 'P1' })],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const adminUser = { id: 1, email: 'admin@test.com', role: 'admin' };
      const result = await ticketService.getAllTickets(
        { search: 'failure', sortBy: 'priority', sortOrder: 'asc', page: 1, limit: 10 },
        adminUser
      );

      expect(result.total).toBe(1);
      expect(result.tickets).toHaveLength(1);
      expect(mockedRepo.findManyWithPagination).toHaveBeenCalledWith({
        search: 'failure',
        sortBy: 'priority',
        sortOrder: 'asc',
        page: 1,
        limit: 10,
      });
    });

    it('should fail closed with UnauthorizedError if currentUser is omitted', async () => {
      await expect(ticketService.getAllTickets({}, undefined)).rejects.toThrow(UnauthorizedError);
      expect(mockedRepo.findManyWithPagination).not.toHaveBeenCalled();
    });
  });

  describe('getTicketById', () => {
    it('should return ticket for authorized customer who owns the ticket', async () => {
      const mockTicket = createMockTicket({ id: 5, customerId: 10 });
      mockedRepo.findById.mockResolvedValue(mockTicket);

      const customerUser = { id: 10, email: 'c@test.com', role: 'customer' };
      const ticket = await ticketService.getTicketById(5, customerUser);

      expect(mockedRepo.findById).toHaveBeenCalledWith(5, false, 10);
      expect(ticket).toEqual(mockTicket);
    });

    it('should throw NotFoundError if customer queries ticket they do not own (prevents enumeration)', async () => {
      mockedRepo.findById.mockResolvedValue(null);

      const customerUser = { id: 10, email: 'c@test.com', role: 'customer' };
      await expect(ticketService.getTicketById(999, customerUser)).rejects.toThrow(NotFoundError);
      expect(mockedRepo.findById).toHaveBeenCalledWith(999, false, 10);
    });

    it('should allow agents to query any customer ticket without customer scoping', async () => {
      const mockTicket = createMockTicket({ id: 5, customerId: 99 });
      mockedRepo.findById.mockResolvedValue(mockTicket);

      const agentUser = { id: 2, email: 'agent@test.com', role: 'agent' };
      const ticket = await ticketService.getTicketById(5, agentUser);

      expect(mockedRepo.findById).toHaveBeenCalledWith(5, false, undefined);
      expect(ticket.id).toBe(5);
    });

    it('should strip internal comments when a customer fetches ticket details', async () => {
      const mockTicketWithComments = {
        ...createMockTicket({ id: 5, customerId: 10 }),
        comments: [
          { id: 1, body: 'Public note', isInternal: false, createdAt: new Date() },
          { id: 2, body: 'Internal agent note', isInternal: true, createdAt: new Date() },
        ],
      };
      mockedRepo.findById.mockResolvedValue(mockTicketWithComments as unknown as Ticket);

      const customerUser = { id: 10, email: 'c@test.com', role: 'customer' };
      const ticket = (await ticketService.getTicketById(5, customerUser)) as Ticket & {
        comments: { isInternal: boolean }[];
      };

      expect(ticket.comments).toHaveLength(1);
      expect(ticket.comments[0].isInternal).toBe(false);
    });

    it('should preserve internal comments when an agent fetches ticket details', async () => {
      const mockTicketWithComments = {
        ...createMockTicket({ id: 5, customerId: 10 }),
        comments: [
          { id: 1, body: 'Public note', isInternal: false, createdAt: new Date() },
          { id: 2, body: 'Internal agent note', isInternal: true, createdAt: new Date() },
        ],
      };
      mockedRepo.findById.mockResolvedValue(mockTicketWithComments as unknown as Ticket);

      const agentUser = { id: 2, email: 'agent@test.com', role: 'agent' };
      const ticket = (await ticketService.getTicketById(5, agentUser)) as Ticket & {
        comments: { isInternal: boolean }[];
      };

      expect(ticket.comments).toHaveLength(2);
    });
  });

  describe('createTicket', () => {
    it('should automatically assign customerId to currentUser.id when role is customer', async () => {
      mockedRepo.userExists.mockResolvedValue(true);
      mockedRepo.count.mockResolvedValue(0);
      mockedRepo.findByReference.mockResolvedValue(null);
      mockedRepo.create.mockResolvedValue(createMockTicket({ customerId: 15 }));

      const customerUser = { id: 15, email: 'customer15@test.com', role: 'customer' };
      const result = await ticketService.createTicket(
        { title: 'New bug', description: 'Description here', customerId: 999 },
        customerUser
      );

      expect(result.customerId).toBe(15);
      expect(mockedRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 15,
        })
      );
    });

    it('should throw BadRequestError if customer does not exist in database', async () => {
      mockedRepo.userExists.mockResolvedValue(false);

      const agentUser = { id: 1, email: 'agent@test.com', role: 'agent' };
      await expect(
        ticketService.createTicket({ title: 'Bug', description: 'Desc', customerId: 9999 }, agentUser)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if assignee does not exist when creating ticket', async () => {
      mockedRepo.userExists
        .mockResolvedValueOnce(true) // customer exists
        .mockResolvedValueOnce(false); // assignee does not exist

      const agentUser = { id: 1, email: 'agent@test.com', role: 'agent' };
      await expect(
        ticketService.createTicket({ title: 'Bug', description: 'Desc', customerId: 2, assigneeId: 888 }, agentUser)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if customerId cannot be resolved', async () => {
      await expect(
        ticketService.createTicket({ title: 'Bug', description: 'Desc' }, undefined)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('updateTicket', () => {
    it('should throw ForbiddenError if customer attempts to reassign a ticket', async () => {
      mockedRepo.findById.mockResolvedValue(createMockTicket({ customerId: 20 }));

      const customerUser = { id: 20, email: 'cust@test.com', role: 'customer' };
      await expect(
        ticketService.updateTicket(1, { assigneeId: 2 }, customerUser)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should set resolvedAt when status is transitioned to resolved', async () => {
      const existingTicket = createMockTicket({ status: 'in_progress', resolvedAt: null });
      mockedRepo.findById.mockResolvedValue(existingTicket);
      mockedRepo.update.mockResolvedValue({ ...existingTicket, status: 'resolved', resolvedAt: new Date() });

      const agentUser = { id: 2, email: 'agent@test.com', role: 'agent' };
      await ticketService.updateTicket(1, { status: 'resolved' }, agentUser);

      expect(mockedRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'resolved',
          resolvedAt: expect.any(Date),
        })
      );
    });

    it('should set closedAt when status is transitioned to closed', async () => {
      const existingTicket = createMockTicket({ status: 'open', resolvedAt: null, closedAt: null });
      mockedRepo.findById.mockResolvedValue(existingTicket);
      mockedRepo.update.mockResolvedValue({ ...existingTicket, status: 'closed' });

      const agentUser = { id: 2, email: 'agent@test.com', role: 'agent' };
      await ticketService.updateTicket(1, { status: 'closed' }, agentUser);

      expect(mockedRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'closed',
          closedAt: expect.any(Date),
        })
      );
    });

    it('should reset resolvedAt and closedAt when status transitions to open or in_progress', async () => {
      const existingTicket = createMockTicket({ status: 'resolved', resolvedAt: new Date() });
      mockedRepo.findById.mockResolvedValue(existingTicket);
      mockedRepo.update.mockResolvedValue({ ...existingTicket, status: 'in_progress', resolvedAt: null, closedAt: null });

      const agentUser = { id: 2, email: 'agent@test.com', role: 'agent' };
      await ticketService.updateTicket(1, { status: 'in_progress' }, agentUser);

      expect(mockedRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'in_progress',
          resolvedAt: null,
          closedAt: null,
        })
      );
    });

    it('should reset resolvedAt and closedAt when status transitions to waiting_on_customer', async () => {
      const existingTicket = createMockTicket({
        status: 'closed',
        resolvedAt: new Date(),
        closedAt: new Date(),
      });
      mockedRepo.findById.mockResolvedValue(existingTicket);
      mockedRepo.update.mockResolvedValue({
        ...existingTicket,
        status: 'waiting_on_customer',
        resolvedAt: null,
        closedAt: null,
      });

      const agentUser = { id: 2, email: 'agent@test.com', role: 'agent' };
      await ticketService.updateTicket(1, { status: 'waiting_on_customer' }, agentUser);

      expect(mockedRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'waiting_on_customer',
          resolvedAt: null,
          closedAt: null,
        })
      );
    });

    it('should throw BadRequestError if updated assignee does not exist', async () => {
      const existingTicket = createMockTicket();
      mockedRepo.findById.mockResolvedValue(existingTicket);
      mockedRepo.userExists.mockResolvedValue(false);

      const agentUser = { id: 2, email: 'agent@test.com', role: 'agent' };
      await expect(
        ticketService.updateTicket(1, { assigneeId: 9999 }, agentUser)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteTicket', () => {
    it('should soft-delete ticket if found', async () => {
      const existing = createMockTicket({ id: 1 });
      mockedRepo.findById.mockResolvedValue(existing);
      mockedRepo.softDelete.mockResolvedValue(existing);

      const adminUser = { id: 1, email: 'admin@test.com', role: 'admin' };
      const res = await ticketService.deleteTicket(1, adminUser);

      expect(res.deleted).toBe(true);
      expect(mockedRepo.softDelete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError if ticket to delete does not exist', async () => {
      mockedRepo.findById.mockResolvedValue(null);

      const adminUser = { id: 1, email: 'admin@test.com', role: 'admin' };
      await expect(ticketService.deleteTicket(999, adminUser)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Repository Failure Propagation', () => {
    it('should propagate database failure when finding tickets with pagination', async () => {
      mockedRepo.findManyWithPagination.mockRejectedValue(new Error('Connection timeout to DB'));

      const agent = { id: 2, email: 'agent@test.com', role: 'agent' };
      await expect(ticketService.getAllTickets({}, agent)).rejects.toThrow('Connection timeout to DB');
    });

    it('should propagate database failure when creating ticket', async () => {
      mockedRepo.userExists.mockResolvedValue(true);
      mockedRepo.count.mockResolvedValue(0);
      mockedRepo.findByReference.mockResolvedValue(null);
      mockedRepo.create.mockRejectedValue(new Error('PostgreSQL unique constraint violation'));

      const customer = { id: 10, email: 'cust@test.com', role: 'customer' };
      await expect(
        ticketService.createTicket({ title: 'Bug', description: 'Desc' }, customer)
      ).rejects.toThrow('PostgreSQL unique constraint violation');
    });

    it('should propagate database failure when updating ticket', async () => {
      mockedRepo.findById.mockResolvedValue(createMockTicket());
      mockedRepo.update.mockRejectedValue(new Error('DB lock acquisition failure'));

      const agent = { id: 2, email: 'agent@test.com', role: 'agent' };
      await expect(ticketService.updateTicket(1, { title: 'New' }, agent)).rejects.toThrow(
        'DB lock acquisition failure'
      );
    });

    it('should propagate database failure when soft-deleting ticket', async () => {
      mockedRepo.findById.mockResolvedValue(createMockTicket());
      mockedRepo.softDelete.mockRejectedValue(new Error('Foreign key cascade failure'));

      const admin = { id: 1, email: 'admin@test.com', role: 'admin' };
      await expect(ticketService.deleteTicket(1, admin)).rejects.toThrow(
        'Foreign key cascade failure'
      );
    });
  });
});
