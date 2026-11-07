import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../utils/response.util';

export function getHealth(_req: Request, res: Response, next: NextFunction): void {
  try {
    const healthData = {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'SupportDesk API',
    };

    res.status(200).json(successResponse(healthData));
  } catch (error) {
    next(error);
  }
}
