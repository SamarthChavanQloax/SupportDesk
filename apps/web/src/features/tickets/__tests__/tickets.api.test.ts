import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/api-client';
import {
  createComment,
  createTicket,
  fetchComments,
  fetchTicketById,
  fetchTickets,
  updateTicket,
} from '../api/tickets.api';

describe('tickets.api', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetchTickets constructs query string for page, limit, status, priority, and search', async () => {
    const mockTickets = [
      {
        id: 1,
        reference: 'TCK-2026-0001',
        title: 'Payment failure',
        description: 'Error 500',
        status: 'open',
        priority: 'P1',
        category: 'Billing',
        customerId: 1,
        assigneeId: null,
        createdAt: '2026-11-13T10:00:00.000Z',
        updatedAt: '2026-11-13T10:00:00.000Z',
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: mockTickets,
      error: null,
      meta: { page: 2, limit: 10, total: 15, totalPages: 2 },
    });

    const result = await fetchTickets({
      page: 2,
      limit: 10,
      status: 'open',
      priority: 'P1',
      search: 'Payment',
    });

    expect(getSpy).toHaveBeenCalledWith(
      '/tickets?page=2&limit=10&status=open&priority=P1&search=Payment',
    );
    expect(result.tickets).toEqual(mockTickets);
    expect(result.meta.totalPages).toBe(2);
  });

  it('fetchTicketById requests /tickets/:id', async () => {
    const mockTicket = {
      id: 42,
      reference: 'TCK-2026-0042',
      title: 'Database connection leak',
      description: 'Pool exhausted',
      status: 'in_progress',
      priority: 'P1',
      category: 'Backend',
      customerId: 3,
      assigneeId: 2,
      createdAt: '2026-11-13T10:00:00.000Z',
      updatedAt: '2026-11-13T10:30:00.000Z',
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: mockTicket,
      error: null,
      meta: {},
    });

    const ticket = await fetchTicketById(42);
    expect(getSpy).toHaveBeenCalledWith('/tickets/42');
    expect(ticket.reference).toBe('TCK-2026-0042');
  });

  it('createTicket posts payload to /tickets', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        id: 99,
        reference: 'TCK-2026-0099',
        title: 'New bug',
        description: 'Bug description',
        status: 'open',
        priority: 'P3',
        category: null,
        customerId: 1,
        assigneeId: null,
        createdAt: '2026-11-13T10:00:00.000Z',
        updatedAt: '2026-11-13T10:00:00.000Z',
      },
      error: null,
      meta: {},
    });

    const created = await createTicket({
      title: 'New bug',
      description: 'Bug description',
      priority: 'P3',
    });

    expect(postSpy).toHaveBeenCalledWith('/tickets', {
      title: 'New bug',
      description: 'Bug description',
      priority: 'P3',
    });
    expect(created.id).toBe(99);
  });

  it('updateTicket patches status or priority to /tickets/:id', async () => {
    const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      data: {
        id: 42,
        reference: 'TCK-2026-0042',
        title: 'Database issue',
        description: 'Details',
        status: 'resolved',
        priority: 'P1',
        category: null,
        customerId: 1,
        assigneeId: 2,
        createdAt: '2026-11-13T10:00:00.000Z',
        updatedAt: '2026-11-13T11:00:00.000Z',
      },
      error: null,
      meta: {},
    });

    const updated = await updateTicket(42, { status: 'resolved' });
    expect(patchSpy).toHaveBeenCalledWith('/tickets/42', { status: 'resolved' });
    expect(updated.status).toBe('resolved');
  });

  it('fetchComments and createComment operate on /tickets/:id/comments', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [
        {
          id: 1,
          body: 'Working on this issue now.',
          isInternal: false,
          ticketId: 42,
          authorId: 2,
          createdAt: '2026-11-13T10:15:00.000Z',
        },
      ],
      error: null,
      meta: {},
    });

    const comments = await fetchComments(42);
    expect(getSpy).toHaveBeenCalledWith('/tickets/42/comments');
    expect(comments).toHaveLength(1);

    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: {
        id: 2,
        body: 'Internal notes: customer called support hotline.',
        isInternal: true,
        ticketId: 42,
        authorId: 2,
        createdAt: '2026-11-13T10:20:00.000Z',
      },
      error: null,
      meta: {},
    });

    const newComment = await createComment(42, {
      body: 'Internal notes: customer called support hotline.',
      isInternal: true,
    });

    expect(postSpy).toHaveBeenCalledWith('/tickets/42/comments', {
      body: 'Internal notes: customer called support hotline.',
      isInternal: true,
    });
    expect(newComment.isInternal).toBe(true);
  });
});
