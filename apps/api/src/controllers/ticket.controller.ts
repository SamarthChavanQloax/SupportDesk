import { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service';
import { successResponse } from '../utils/response.util';
import { TicketFilterOptions, TicketPriority, TicketStatus } from '../repositories/ticket.repository';
import { parseIdParam } from '../utils/params.util';
import { ParsedTicketQuery } from '../validations/ticket.validation';

export async function getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = res.locals.validatedQuery as ParsedTicketQuery | undefined;
    const filters: TicketFilterOptions = validated
      ? { ...validated }
      : {
          page: typeof req.query.page === 'string' ? parseInt(req.query.page, 10) : undefined,
          limit: typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : undefined,
          status: typeof req.query.status === 'string' ? (req.query.status as TicketStatus) : undefined,
          priority: typeof req.query.priority === 'string' ? (req.query.priority as TicketPriority) : undefined,
          customerId: typeof req.query.customerId === 'string' ? parseInt(req.query.customerId, 10) : undefined,
          assigneeId: typeof req.query.assigneeId === 'string' ? parseInt(req.query.assigneeId, 10) : undefined,
          search: typeof req.query.search === 'string' ? req.query.search : undefined,
          sortBy: typeof req.query.sortBy === 'string' ? req.query.sortBy : undefined,
          sortOrder: typeof req.query.sortOrder === 'string' ? (req.query.sortOrder as 'asc' | 'desc') : undefined,
        };

    const result = await ticketService.getAllTickets(filters, req.user);
    res.status(200).json(
      successResponse(result.tickets, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      })
    );
  } catch (error) {
    next(error);
  }
}

export async function getTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = parseIdParam(req.params.id);
    const ticket = await ticketService.getTicketById(ticketId, req.user);
    res.status(200).json(successResponse(ticket));
  } catch (error) {
    next(error);
  }
}

export async function createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const newTicket = await ticketService.createTicket(req.body, req.user);
    res.status(201).json(successResponse(newTicket));
  } catch (error) {
    next(error);
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = parseIdParam(req.params.id);
    const updatedTicket = await ticketService.updateTicket(ticketId, req.body, req.user);
    res.status(200).json(successResponse(updatedTicket));
  } catch (error) {
    next(error);
  }
}

export async function deleteTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = parseIdParam(req.params.id);
    const result = await ticketService.deleteTicket(ticketId, req.user);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
}
