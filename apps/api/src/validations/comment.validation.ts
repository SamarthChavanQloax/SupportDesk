import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Comment body cannot be empty')
    .max(2000, 'Comment cannot exceed 2000 characters'),
  isInternal: z.boolean().default(false).optional(),
});

export type CreateCommentDTO = z.infer<typeof createCommentSchema>;

