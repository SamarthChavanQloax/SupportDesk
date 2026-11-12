import { apiClient, ApiMeta } from '../../../lib/api-client';

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_customer'
  | 'resolved'
  | 'closed';

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export interface TicketSummary {
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
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  assignee?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface TicketQueryParams {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
}

export interface TicketListResult {
  tickets: TicketSummary[];
  meta: ApiMeta;
}

export async function fetchTickets(params: TicketQueryParams = {}): Promise<TicketListResult> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.status) searchParams.set('status', params.status);
  if (params.priority) searchParams.set('priority', params.priority);
  if (params.search?.trim()) searchParams.set('search', params.search.trim());

  const queryString = searchParams.toString();
  const path = queryString ? `/tickets?${queryString}` : '/tickets';
  const response = await apiClient.get<TicketSummary[]>(path);

  return {
    tickets: response.data,
    meta: response.meta,
  };
}

