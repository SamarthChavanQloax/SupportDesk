import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import type { ApiMeta } from '../../../lib/api-client';
import {
  createComment,
  createTicket,
  fetchComments,
  fetchTicketById,
  fetchTickets,
  updateTicket,
  type CreateCommentPayload,
  type CreateTicketPayload,
  type Ticket,
  type TicketComment,
  type TicketQueryParams,
  type UpdateTicketPayload,
} from '../api/tickets.api';

/**
 * Hierarchical query key factory for tickets feature
 */
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (params?: TicketQueryParams) =>
    [...ticketKeys.lists(), params ?? {}] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: number) => [...ticketKeys.details(), id] as const,
  comments: (ticketId: number) =>
    [...ticketKeys.detail(ticketId), 'comments'] as const,
};

/**
 * Query for fetching paginated & filtered tickets
 */
export function useTickets(
  params?: TicketQueryParams,
): UseQueryResult<{ tickets: Ticket[]; meta: ApiMeta }> {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => fetchTickets(params),
  });
}

/**
 * Query for fetching an individual ticket by its numeric ID
 */
export function useTicket(id: number): UseQueryResult<Ticket> {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => fetchTicketById(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

/**
 * Query for fetching comments on a ticket
 */
export function useComments(
  ticketId: number,
  options?: { enabled?: boolean },
): UseQueryResult<TicketComment[]> {
  return useQuery({
    queryKey: ticketKeys.comments(ticketId),
    queryFn: () => fetchComments(ticketId),
    enabled:
      (options?.enabled ?? true) && Number.isInteger(ticketId) && ticketId > 0,
  });
}

/**
 * Mutation for creating a new ticket, invalidating ticket list queries on success
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createTicket(payload),
    onSuccess: (newTicket) => {
      // Invalidate ticket list queries so queue reflects newly created ticket
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      // Pre-seed detail cache for instant navigation
      queryClient.setQueryData(ticketKeys.detail(newTicket.id), newTicket);
    },
  });
}

/**
 * Mutation for updating a ticket (e.g. status transition, priority, category)
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTicketPayload }) =>
      updateTicket(id, data),
    onSuccess: (updatedTicket) => {
      // Invalidate and update the specific ticket detail
      queryClient.setQueryData(ticketKeys.detail(updatedTicket.id), updatedTicket);
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(updatedTicket.id) });
      // Invalidate list queries so badges and queues refresh
      void queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

/**
 * Mutation for adding a comment to a ticket
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: number;
      data: CreateCommentPayload;
    }) => createComment(ticketId, data),
    onSuccess: (_, { ticketId }) => {
      // Invalidate comment thread and ticket detail so comment counts/history refresh
      void queryClient.invalidateQueries({ queryKey: ticketKeys.comments(ticketId) });
      void queryClient.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
    },
  });
}
