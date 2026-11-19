import { z } from 'zod';

export const supportedCategories = [
  'Billing',
  'Technical',
  'Security',
  'Network',
  'Account',
  'General',
] as const;

export type SupportedCategory = (typeof supportedCategories)[number];

export const supportedPriorities = ['P1', 'P2', 'P3', 'P4'] as const;
export type SupportedPriority = (typeof supportedPriorities)[number];

export const aiCategorizationSchema = z.object({
  category: z.enum(supportedCategories, {
    message: `Category must be one of: ${supportedCategories.join(', ')}`,
  }),
  priority: z.enum(supportedPriorities, {
    message: `Priority must be one of: ${supportedPriorities.join(', ')}`,
  }),
  confidence: z
    .number()
    .min(0, 'Confidence must be between 0 and 1')
    .max(1, 'Confidence must be between 0 and 1'),
  reasoning: z
    .string()
    .trim()
    .min(3, 'Reasoning must be at least 3 characters')
    .max(300, 'Reasoning cannot exceed 300 characters'),
}).strict();

export type AiCategorization = z.infer<typeof aiCategorizationSchema>;
