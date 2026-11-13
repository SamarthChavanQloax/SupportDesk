import { createTicketSchema } from '../../../../../api/src/validations/ticket.validation.ts';
import type { z } from 'zod';

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>;
export { createTicketSchema };
