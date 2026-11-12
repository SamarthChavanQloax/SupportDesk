import { commentRepository } from '../repositories/comment.repository';
import { ticketRepository } from '../repositories/ticket.repository';
import { NotFoundError, ForbiddenError } from '../errors/app.error';
import { CreateCommentDTO } from '../validations/comment.validation';
import { UserContext } from './ticket.service';

export class CommentService {
  /**
   * Retrieve comments for a specific ticket
   * Access Rules:
   * - Customers can ONLY list comments on their own tickets.
   * - Customers NEVER see internal comments (isInternal = false).
   * - Agents and Admins see all comments (both public and internal).
   */
  async getComments(ticketId: number, currentUser: UserContext) {
    // 1. Verify ticket existence and ownership
    const customerScope = currentUser.role === 'customer' ? currentUser.id : undefined;
    const ticket = await ticketRepository.findById(ticketId, false, customerScope);

    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${ticketId}`);
    }

    // 2. Determine internal comment visibility
    const includeInternal = currentUser.role === 'agent' || currentUser.role === 'admin';

    return commentRepository.findByTicketId(ticketId, { includeInternal });
  }

  /**
   * Add a new comment to a ticket
   * Access Rules:
   * - Customers can only comment on tickets they own.
   * - Customers cannot create internal notes (isInternal is restricted to agents/admins).
   * - Author is always taken from authenticated context.
   */
  async createComment(ticketId: number, dto: CreateCommentDTO, currentUser: UserContext) {
    // 1. Verify ticket existence and ownership
    const customerScope = currentUser.role === 'customer' ? currentUser.id : undefined;
    const ticket = await ticketRepository.findById(ticketId, false, customerScope);

    if (!ticket) {
      throw new NotFoundError(`Ticket with ID ${ticketId}`);
    }

    // 2. Validate internal comment permissions
    let isInternal = dto.isInternal ?? false;
    if (currentUser.role === 'customer' && isInternal) {
      throw new ForbiddenError('Customers are not permitted to create internal notes');
    }

    // 3. Persist comment
    return commentRepository.create({
      ticketId,
      authorId: currentUser.id,
      body: dto.body.trim(),
      isInternal,
    });
  }
}

export const commentService = new CommentService();

