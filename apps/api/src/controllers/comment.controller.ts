import { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/comment.service';
import { successResponse } from '../utils/response.util';
import { parseIdParam } from '../utils/params.util';

export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = parseIdParam(req.params.id);
    const comments = await commentService.getComments(ticketId, req.user!);
    res.status(200).json(successResponse(comments));
  } catch (error) {
    next(error);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = parseIdParam(req.params.id);
    const comment = await commentService.createComment(ticketId, req.body, req.user!);
    res.status(201).json(successResponse(comment));
  } catch (error) {
    next(error);
  }
}

