import { useQuery } from '@tanstack/react-query';
import { fetchTickets, TicketQueryParams } from '../api/tickets.api';

export function useTickets(params: TicketQueryParams = { page: 1, limit: 10 }) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => fetchTickets(params),
  });
}

