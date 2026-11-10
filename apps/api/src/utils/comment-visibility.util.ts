export interface CommentEntity {
  id: number;
  ticketId: number;
  authorId: number;
  body: string;
  isInternal: boolean;
  createdAt: Date;
  [key: string]: unknown;
}

export type Role = 'customer' | 'agent' | 'admin';

/**
 * Filters a list of comments based on the user's role.
 * - 'customer': can only view public comments (isInternal === false)
 * - 'agent' or 'admin': can view all comments (public and internal)
 */
export function filterCommentsForRole<T extends { isInternal: boolean }>(
  comments: T[],
  role: Role
): T[] {
  if (role === 'customer') {
    return comments.filter((comment) => !comment.isInternal);
  }
  return [...comments];
}
