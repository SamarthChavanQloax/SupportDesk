import { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/comment.service';
import { successResponse } from '../utils/response.util';

function parseId(param: string | string[] | undefined): number {
  const val = Array.isArray(param) ? param[0] : param;
  return parseInt(val || '0', 10);
}

export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = parseId(req.params.id);
    const comments = await commentService.getComments(ticketId, req.user!);
    res.status(200).json(successResponse(comments));
  } catch (error) {
    next(error);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = parseId(req.params.id);
    const comment = await commentService.createComment(ticketId, req.body, req.user!);
    res.status(201).json(successResponse(comment));
  } catch (error) {
    next(error);
  }
}
