import { z } from 'zod';

export const ticketIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'Ticket ID is required')
    .regex(/^\d+$/, 'Ticket ID must be a positive integer')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive('Ticket ID must be greater than 0')),
});

export const sortableTicketFields = ['createdAt', 'updatedAt', 'priority', 'status', 'title'] as const;
export type SortableTicketField = (typeof sortableTicketFields)[number];

export const ticketQuerySchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a positive integer')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, 'Page must be at least 1'))
    .default(1),
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a positive integer')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100'))
    .default(10),
  status: z
    .enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'])
    .optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  customerId: z
    .string()
    .regex(/^\d+$/, 'customerId must be a positive integer')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1, 'customerId must be at least 1'))
    .optional(),
  assigneeId: z
    .string()
    .regex(/^\d+$/, 'assigneeId must be a positive integer')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1, 'assigneeId must be at least 1'))
    .optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(sortableTicketFields).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ParsedTicketQuery = z.infer<typeof ticketQuerySchema>;

export const createTicketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(255, 'Title cannot exceed 255 characters'),
  description: z
    .string()
    .trim()
    .min(5, 'Description must be at least 5 characters long'),
  customerId: z
    .number()
    .int('customerId must be an integer')
    .positive('customerId must be positive')
    .optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3').optional(),
  status: z
    .enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'])
    .default('open')
    .optional(),
  category: z.string().trim().max(100).optional(),
  assigneeId: z.number().int().positive().nullable().optional(),
});

export const updateTicketSchema = z
  .object({
    title: z.string().trim().min(3).max(255).optional(),
    description: z.string().trim().min(5).optional(),
    status: z
      .enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'])
      .optional(),
    priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
    category: z.string().trim().max(100).optional(),
    assigneeId: z.number().int().positive().nullable().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided for update'
  );
