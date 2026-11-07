import { Request, Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service';
import { successResponse } from '../utils/response.util';
import { TicketFilterOptions, TicketPriority, TicketStatus } from '../repositories/ticket.repository';

function parseId(param: string | string[] | undefined): number {
  const val = Array.isArray(param) ? param[0] : param;
  return parseInt(val || '0', 10);
}

export async function getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters: TicketFilterOptions = {};

    if (typeof req.query.status === 'string') {
      filters.status = req.query.status as TicketStatus;
    }
    if (typeof req.query.priority === 'string') {
      filters.priority = req.query.priority as TicketPriority;
    }
    if (typeof req.query.customerId === 'string') {
      filters.customerId = parseInt(req.query.customerId, 10);
    }
    if (typeof req.query.assigneeId === 'string') {
      filters.assigneeId = parseInt(req.query.assigneeId, 10);
    }

    const tickets = await ticketService.getAllTickets(filters);
    res.status(200).json(successResponse(tickets, { total: tickets.length }));
  } catch (error) {
    next(error);
  }
}

export async function getTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = parseId(req.params.id);
    const ticket = await ticketService.getTicketById(ticketId);
    res.status(200).json(successResponse(ticket));
  } catch (error) {
    next(error);
  }
}

export async function createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const newTicket = await ticketService.createTicket(req.body);
    res.status(201).json(successResponse(newTicket));
  } catch (error) {
    next(error);
  }
}

export async function updateTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = parseId(req.params.id);
    const updatedTicket = await ticketService.updateTicket(ticketId, req.body);
    res.status(200).json(successResponse(updatedTicket));
  } catch (error) {
    next(error);
  }
}

export async function deleteTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ticketId = parseId(req.params.id);
    const result = await ticketService.deleteTicket(ticketId);
    res.status(200).json(successResponse(result));
  } catch (error) {
    next(error);
  }
}
