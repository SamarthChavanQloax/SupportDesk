import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { BadRequestError } from '../errors/app.error';

/**
 * Controller: Streams suggested reply draft using Server-Sent Events (SSE).
 */
export async function suggestReply(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const ticketId = parseInt(rawId, 10);
  if (isNaN(ticketId) || ticketId <= 0) {
    return next(new BadRequestError('Invalid ticket ID'));
  }

  // Set SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Client disconnect handling
  let isClosed = false;
  req.on('close', () => {
    isClosed = true;
  });

  try {
    await aiService.streamSuggestReply(ticketId, {
      onChunk: (chunk: string) => {
        if (!isClosed) {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      },
      onDone: (meta) => {
        if (!isClosed) {
          res.write(`data: ${JSON.stringify({ done: true, meta })}\n\n`);
          res.end();
        }
      },
      onError: (err) => {
        if (!isClosed) {
          res.write(
            `data: ${JSON.stringify({ error: err.message || 'Stream error' })}\n\n`
          );
          res.end();
        }
      },
    });
  } catch (error: any) {
    if (!res.headersSent) {
      return next(error);
    }
    if (!isClosed) {
      res.write(
        `data: ${JSON.stringify({ error: error.message || 'AI provider error' })}\n\n`
      );
      res.end();
    }
  }
}

/**
 * Controller: Auto-categorises and predicts priority with Zod validation.
 */
export async function categorizeTicket(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let ticketId: number | undefined;
    if (req.params.id) {
      const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      ticketId = parseInt(rawId, 10);
      if (isNaN(ticketId) || ticketId <= 0) {
        throw new BadRequestError('Invalid ticket ID parameter');
      }
    }

    const title = req.body?.title;
    const description = req.body?.description;

    const result = await aiService.categorizeTicket(
      ticketId,
      title && description ? { title, description } : undefined
    );

    const { meta, ...data } = result;

    res.status(200).json({
      data,
      error: null,
      meta,
    });
  } catch (error) {
    next(error);
  }
}
