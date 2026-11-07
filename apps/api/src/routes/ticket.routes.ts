import { Router } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
} from '../controllers/ticket.controller';
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

const router = Router();

router.get('/', validateQuery(ticketQuerySchema), getTickets);
router.get('/:id', validateParams(ticketIdParamSchema), getTicketById);
router.post('/', validateBody(createTicketSchema), createTicket);
router.patch(
  '/:id',
  validateParams(ticketIdParamSchema),
  validateBody(updateTicketSchema),
  updateTicket
);
router.delete('/:id', validateParams(ticketIdParamSchema), deleteTicket);

export { router as ticketRouter };
export default router;
