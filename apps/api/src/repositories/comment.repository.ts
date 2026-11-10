import { prisma } from './prisma.client';
import { Comment } from '@prisma/client';

export { Comment };

export interface CreateCommentData {
  ticketId: number;
  authorId: number;
  body: string;
  isInternal?: boolean;
}

export interface CommentFilterOptions {
  includeInternal?: boolean;
}

export class CommentRepository {
  /**
   * Find comments for a ticket with optional internal comment inclusion
   */
  async findByTicketId(ticketId: number, options: CommentFilterOptions = {}): Promise<Comment[]> {
    const where: Record<string, unknown> = {
      ticketId,
      deletedAt: null,
    };

    // If internal comments should NOT be included (e.g. for customers), filter them out
    if (!options.includeInternal) {
      where.isInternal = false;
    }

    return prisma.comment.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        author: {
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
   * Find a comment by its ID
   */
  async findById(id: number): Promise<Comment | null> {
    return prisma.comment.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        author: {
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
   * Create a new comment record
   */
  async create(data: CreateCommentData): Promise<Comment> {
    return prisma.comment.create({
      data: {
        ticketId: data.ticketId,
        authorId: data.authorId,
        body: data.body,
        isInternal: data.isInternal ?? false,
      },
      include: {
        author: {
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
}

export const commentRepository = new CommentRepository();

