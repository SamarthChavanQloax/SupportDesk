import { Router } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} from '../controllers/ticket.controller';
import {
  getComments,
  createComment,
} from '../controllers/comment.controller';
import {
  suggestReply,
  categorizeTicket,
} from '../controllers/ai.controller';
import {
  validateParams,
  validateQuery,
  validateBody,
} from '../middlewares/validate.middleware';
import {
  ticketIdParamSchema,
  ticketQuerySchema,
  createTicketSchema,
  updateTicketSchema,
} from '../validations/ticket.validation';
import { createCommentSchema } from '../validations/comment.validation';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// All ticket endpoints require valid authentication
router.use(requireAuth);

// Customer, Agent, and Admin can list tickets (service scopes customer to own tickets only)
router.get('/', requireRole('customer', 'agent', 'admin'), validateQuery(ticketQuerySchema), getTickets);

// Customer, Agent, and Admin can read a ticket by ID (service enforces customer ownership)
router.get('/:id', requireRole('customer', 'agent', 'admin'), validateParams(ticketIdParamSchema), getTicketById);

// Customer, Agent, and Admin can create a ticket
router.post('/', requireRole('customer', 'agent', 'admin'), validateBody(createTicketSchema), createTicket);

// Customer, Agent, and Admin can update a ticket (service enforces customer ownership)
router.patch(
  '/:id',
  requireRole('customer', 'agent', 'admin'),
  validateParams(ticketIdParamSchema),
  validateBody(updateTicketSchema),
  updateTicket
);

// Privileged route: Only Agent and Admin can soft-delete tickets (Customers receive 403 Forbidden)
router.delete('/:id', requireRole('agent', 'admin'), validateParams(ticketIdParamSchema), deleteTicket);

// Comments endpoints: list and create comments on a ticket
router.get(
  '/:id/comments',
  requireRole('customer', 'agent', 'admin'),
  validateParams(ticketIdParamSchema),
  getComments
);

router.post(
  '/:id/comments',
  requireRole('customer', 'agent', 'admin'),
  validateParams(ticketIdParamSchema),
  validateBody(createCommentSchema),
  createComment
);

// AI Feature 1: Streamed Suggest Reply (Agent & Admin only)
router.get(
  '/:id/ai/suggest-reply',
  requireRole('agent', 'admin'),
  validateParams(ticketIdParamSchema),
  suggestReply
);

router.post(
  '/:id/ai/suggest-reply',
  requireRole('agent', 'admin'),
  validateParams(ticketIdParamSchema),
  suggestReply
);

// AI Feature 2: Auto-categorize + Priority (Agent & Admin only)
// 1) For an existing ticket by ID
router.post(
  '/:id/ai/categorize',
  requireRole('agent', 'admin'),
  validateParams(ticketIdParamSchema),
  categorizeTicket
);

// 2) For draft tickets (e.g. create ticket form) passing title and description in body
router.post(
  '/ai/categorize',
  requireRole('agent', 'admin'),
  categorizeTicket
);

export { router as ticketRouter };
export default router;
