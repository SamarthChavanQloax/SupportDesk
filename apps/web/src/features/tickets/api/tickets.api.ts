import { apiClient, type ApiMeta } from '../../../lib/api-client';

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_customer'
  | 'resolved'
  | 'closed';

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export interface TicketUserSummary {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface TicketCommentAuthor {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface TicketComment {
  id: number;
  body: string;
  isInternal: boolean;
  ticketId: number;
  authorId: number;
  createdAt: string;
  author?: TicketCommentAuthor;
}

export interface Ticket {
  id: number;
  reference: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string | null;
  customerId: number;
  assigneeId: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  customer?: TicketUserSummary;
  assignee?: TicketUserSummary | null;
  comments?: TicketComment[];
}

export type TicketSummary = Ticket;

export interface TicketQueryParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority?: TicketPriority;
  category?: string;
  customerId?: number;
  assigneeId?: number | null;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assigneeId?: number | null;
}

export interface CreateCommentPayload {
  body: string;
  isInternal?: boolean;
}

/**
 * Fetch server-paginated and filtered tickets list
 */
export async function fetchTickets(
  params?: TicketQueryParams,
): Promise<{ tickets: Ticket[]; meta: ApiMeta }> {
  const query = new URLSearchParams();

  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.status) query.set('status', params.status);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.search && params.search.trim().length > 0) {
    query.set('search', params.search.trim());
  }
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const queryString = query.toString();
  const endpoint = queryString ? `/tickets?${queryString}` : '/tickets';
  const response = await apiClient.get<Ticket[]>(endpoint);

  return {
    tickets: response.data,
    meta: response.meta,
  };
}

/**
 * Fetch a single ticket by its integer ID
 */
export async function fetchTicketById(id: number): Promise<Ticket> {
  const response = await apiClient.get<Ticket>(`/tickets/${id}`);
  return response.data;
}

/**
 * Create a new ticket
 */
export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const response = await apiClient.post<Ticket>('/tickets', payload);
  return response.data;
}

/**
 * Update a ticket's status, priority, or other metadata
 */
export async function updateTicket(
  id: number,
  payload: UpdateTicketPayload,
): Promise<Ticket> {
  const response = await apiClient.patch<Ticket>(`/tickets/${id}`, payload);
  return response.data;
}

/**
 * Fetch comments for a specific ticket
 */
export async function fetchComments(ticketId: number): Promise<TicketComment[]> {
  const response = await apiClient.get<TicketComment[]>(`/tickets/${ticketId}/comments`);
  return response.data;
}

/**
 * Add a comment to a ticket
 */
export async function createComment(
  ticketId: number,
  payload: CreateCommentPayload,
): Promise<TicketComment> {
  const response = await apiClient.post<TicketComment>(
    `/tickets/${ticketId}/comments`,
    payload,
  );
  return response.data;
}
