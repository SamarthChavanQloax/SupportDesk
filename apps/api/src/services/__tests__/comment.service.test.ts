import { CommentService } from '../comment.service';
import { commentRepository, Comment } from '../../repositories/comment.repository';
import { ticketRepository, Ticket } from '../../repositories/ticket.repository';
import { NotFoundError, ForbiddenError } from '../../errors/app.error';

jest.mock('../../repositories/comment.repository');
jest.mock('../../repositories/ticket.repository');

const createMockTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 10,
  reference: 'TCK-2026-0010',
  title: 'Customer Ticket',
  description: 'Desc',
  status: 'open',
  priority: 'P3',
  category: null,
  slaDueTime: null,
  customerId: 5,
  assigneeId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  resolvedAt: null,
  closedAt: null,
  deletedAt: null,
  ...overrides,
});

describe('CommentService Unit Tests (Repositories Mocked)', () => {
  let commentService: CommentService;
  const mockedCommentRepo = jest.mocked(commentRepository);
  const mockedTicketRepo = jest.mocked(ticketRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    commentService = new CommentService();
  });

  describe('getComments', () => {
    it('should query comments with includeInternal = false for customer users', async () => {
      mockedTicketRepo.findById.mockResolvedValue(createMockTicket({ customerId: 5 }));

      const mockComments = [
        {
          id: 1,
          ticketId: 10,
          authorId: 5,
          body: 'Hello, need help',
          isInternal: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          author: { id: 5, name: 'Alice Customer', role: 'customer' },
        },
      ];
      mockedCommentRepo.findByTicketId.mockResolvedValue(mockComments);

      const customer = { id: 5, email: 'alice@test.com', role: 'customer' };
      const comments = await commentService.getComments(10, customer);

      expect(mockedTicketRepo.findById).toHaveBeenCalledWith(10, false, 5);
      expect(mockedCommentRepo.findByTicketId).toHaveBeenCalledWith(10, { includeInternal: false });
      expect(comments).toHaveLength(1);
    });

    it('should query comments with includeInternal = true for agent users', async () => {
      mockedTicketRepo.findById.mockResolvedValue(createMockTicket({ customerId: 5, assigneeId: 2 }));

      mockedCommentRepo.findByTicketId.mockResolvedValue([]);

      const agent = { id: 2, email: 'agent@test.com', role: 'agent' };
      await commentService.getComments(10, agent);

      expect(mockedTicketRepo.findById).toHaveBeenCalledWith(10, false, undefined);
      expect(mockedCommentRepo.findByTicketId).toHaveBeenCalledWith(10, { includeInternal: true });
    });

    it('should throw NotFoundError if customer tries to access comments on another customer ticket', async () => {
      mockedTicketRepo.findById.mockResolvedValue(null);

      const customer = { id: 5, email: 'alice@test.com', role: 'customer' };
      await expect(commentService.getComments(99, customer)).rejects.toThrow(NotFoundError);
      expect(mockedCommentRepo.findByTicketId).not.toHaveBeenCalled();
    });
  });

  describe('createComment', () => {
    it('should allow customer to create a public comment on their ticket', async () => {
      mockedTicketRepo.findById.mockResolvedValue(createMockTicket({ customerId: 5 }));

      mockedCommentRepo.create.mockResolvedValue({
        id: 1,
        ticketId: 10,
        authorId: 5,
        body: 'Follow-up comment',
        isInternal: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const customer = { id: 5, email: 'alice@test.com', role: 'customer' };
      const comment = await commentService.createComment(
        10,
        { body: 'Follow-up comment' },
        customer
      );

      expect(comment.body).toBe('Follow-up comment');
      expect(mockedCommentRepo.create).toHaveBeenCalledWith({
        ticketId: 10,
        authorId: 5,
        body: 'Follow-up comment',
        isInternal: false,
      });
    });

    it('should reject customer attempting to create internal comment with ForbiddenError', async () => {
      mockedTicketRepo.findById.mockResolvedValue(createMockTicket({ customerId: 5 }));

      const customer = { id: 5, email: 'alice@test.com', role: 'customer' };
      await expect(
        commentService.createComment(10, { body: 'Secret note', isInternal: true }, customer)
      ).rejects.toThrow(ForbiddenError);

      expect(mockedCommentRepo.create).not.toHaveBeenCalled();
    });

    it('should allow agent to create internal note', async () => {
      mockedTicketRepo.findById.mockResolvedValue(createMockTicket({ customerId: 5, assigneeId: 2 }));

      mockedCommentRepo.create.mockResolvedValue({
        id: 2,
        ticketId: 10,
        authorId: 2,
        body: 'Investigating customer database logs',
        isInternal: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      const agent = { id: 2, email: 'bob@test.com', role: 'agent' };
      const comment = await commentService.createComment(
        10,
        { body: 'Investigating customer database logs', isInternal: true },
        agent
      );

      expect(comment.isInternal).toBe(true);
      expect(mockedCommentRepo.create).toHaveBeenCalledWith({
        ticketId: 10,
        authorId: 2,
        body: 'Investigating customer database logs',
        isInternal: true,
      });
    });
  });
});
