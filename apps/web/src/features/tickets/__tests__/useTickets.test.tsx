import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as ticketsApi from '../api/tickets.api';
import {
  ticketKeys,
  useCreateComment,
  useCreateTicket,
  useUpdateTicket,
} from '../hooks/useTickets';

vi.mock('../api/tickets.api', () => ({
  fetchTickets: vi.fn(),
  fetchTicketById: vi.fn(),
  fetchComments: vi.fn(),
  createTicket: vi.fn(),
  updateTicket: vi.fn(),
  createComment: vi.fn(),
}));

const mockCreateTicket = vi.mocked(ticketsApi.createTicket);
const mockUpdateTicket = vi.mocked(ticketsApi.updateTicket);
const mockCreateComment = vi.mocked(ticketsApi.createComment);

describe('useTickets hooks & cache invalidation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('ticketKeys factory produces stable, hierarchical keys that include all query parameters', () => {
    expect(ticketKeys.all).toEqual(['tickets']);
    expect(ticketKeys.lists()).toEqual(['tickets', 'list']);
    expect(
      ticketKeys.list({ page: 2, limit: 10, status: 'open', priority: 'P1' }),
    ).toEqual([
      'tickets',
      'list',
      { page: 2, limit: 10, status: 'open', priority: 'P1' },
    ]);
    expect(ticketKeys.detail(42)).toEqual(['tickets', 'detail', 42]);
    expect(ticketKeys.comments(42)).toEqual(['tickets', 'detail', 42, 'comments']);
  });

  it('useCreateTicket invalidates list queries and pre-seeds detail query on success', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const createdTicket = {
      id: 55,
      reference: 'TCK-2026-0055',
      title: 'New defect',
      description: 'Defect details',
      status: 'open' as const,
      priority: 'P3' as const,
      category: null,
      customerId: 1,
      assigneeId: null,
      createdAt: '2026-11-13T10:00:00.000Z',
      updatedAt: '2026-11-13T10:00:00.000Z',
    };
    mockCreateTicket.mockResolvedValue(createdTicket);

    const { result } = renderHook(() => useCreateTicket(), { wrapper });

    await result.current.mutateAsync({
      title: 'New defect',
      description: 'Defect details',
      priority: 'P3',
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tickets', 'list'] });
      expect(setQueryDataSpy).toHaveBeenCalledWith(['tickets', 'detail', 55], createdTicket);
    });
  });

  it('useUpdateTicket invalidates detail and list queries on success', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const updatedTicket = {
      id: 42,
      reference: 'TCK-2026-0042',
      title: 'Updated ticket',
      description: 'Details',
      status: 'resolved' as const,
      priority: 'P1' as const,
      category: null,
      customerId: 1,
      assigneeId: 2,
      createdAt: '2026-11-13T10:00:00.000Z',
      updatedAt: '2026-11-13T11:00:00.000Z',
    };
    mockUpdateTicket.mockResolvedValue(updatedTicket);

    const { result } = renderHook(() => useUpdateTicket(), { wrapper });

    await result.current.mutateAsync({
      id: 42,
      data: { status: 'resolved' },
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tickets', 'detail', 42] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tickets', 'list'] });
    });
  });

  it('useCreateComment invalidates comments and detail queries on success', async () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockCreateComment.mockResolvedValue({
      id: 10,
      ticketId: 42,
      authorId: 2,
      body: 'Verified resolved.',
      isInternal: false,
      createdAt: '2026-11-13T11:30:00.000Z',
    });

    const { result } = renderHook(() => useCreateComment(), { wrapper });

    await result.current.mutateAsync({
      ticketId: 42,
      data: { body: 'Verified resolved.' },
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['tickets', 'detail', 42, 'comments'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['tickets', 'detail', 42],
      });
    });
  });
});
