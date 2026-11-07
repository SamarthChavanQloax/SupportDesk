import { Router } from 'express';
import { healthRouter } from './health.routes';
import { ticketRouter } from './ticket.routes';

const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/tickets', ticketRouter);

// Safe, controlled test endpoint for verifying central 500 handler without damaging the database
if (process.env.NODE_ENV !== 'production') {
  apiRouter.get('/test/error', () => {
    throw new Error('Controlled test error for verifying central 500 error handler');
  });
}

export { apiRouter };
