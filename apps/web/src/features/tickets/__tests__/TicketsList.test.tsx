import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Ticket } from '../api/tickets.api';
import { TicketsList } from '../components/TicketsList';
import * as useTicketsHook from '../hooks/useTickets';

vi.mock('../hooks/useTickets', () => ({
  useTickets: vi.fn(),
}));

const mockUseTickets = vi.mocked(useTicketsHook.useTickets);

const sampleTickets: Ticket[] = [
  {
    id: 1,
    reference: 'TCK-2026-0001',
    title: 'Payment gateway timeout',
    description: 'Fails during 3DS verification',
    status: 'open',
    priority: 'P1',
    category: 'Billing',
    customerId: 10,
    assigneeId: null,
    createdAt: '2026-11-13T09:00:00.000Z',
    updatedAt: '2026-11-13T09:30:00.000Z',
    customer: { id: 10, name: 'Alice Customer', email: 'alice@client.com' },
    assignee: null,
  },
  {
    id: 2,
    reference: 'TCK-2026-0002',
    title: 'Cannot export CSV report',
    description: 'Button disabled in Chrome',
    status: 'in_progress',
    priority: 'P3',
    category: 'Reporting',
    customerId: 11,
    assigneeId: 2,
    createdAt: '2026-11-13T09:15:00.000Z',
    updatedAt: '2026-11-13T10:00:00.000Z',
    customer: { id: 11, name: 'Bob User', email: 'bob@client.com' },
    assignee: { id: 2, name: 'Sarah Agent', email: 'sarah@supportdesk.io' },
  },
];

describe('TicketsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when isLoading is true', () => {
    mockUseTickets.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <MemoryRouter>
        <TicketsList queryParams={{ page: 1, limit: 10 }} onParamsChange={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading support queue...')).toBeInTheDocument();
  });

  it('renders error state with retry button when isError is true', () => {
    const mockRefetch = vi.fn();
    mockUseTickets.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network timeout'),
      refetch: mockRefetch,
      isFetching: false,
    } as any);

    render(
      <MemoryRouter>
        <TicketsList queryParams={{ page: 1, limit: 10 }} onParamsChange={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Network timeout')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when queue has zero tickets', () => {
    mockUseTickets.mockReturnValue({
      data: { tickets: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <MemoryRouter>
        <TicketsList queryParams={{ page: 1, limit: 10 }} onParamsChange={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('No tickets in this workspace')).toBeInTheDocument();
  });

  it('renders tickets list with badges, customer info, and handles pagination controls', () => {
    const onParamsChange = vi.fn();

    mockUseTickets.mockReturnValue({
      data: {
        tickets: sampleTickets,
        meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <MemoryRouter>
        <TicketsList queryParams={{ page: 2, limit: 10 }} onParamsChange={onParamsChange} />
      </MemoryRouter>,
    );

    // Verify ticket references and titles are rendered
    expect(screen.getAllByText('TCK-2026-0001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Payment gateway timeout').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('TCK-2026-0002').length).toBeGreaterThanOrEqual(1);

    // Verify pagination controls: Page 2 of 3
    expect(
      screen.getByText((_, el) => el?.textContent?.replace(/\s+/g, ' ').trim() === 'Page 2 of 3'),
    ).toBeInTheDocument();
    const prevBtn = screen.getByRole('button', { name: /previous page/i });
    const nextBtn = screen.getByRole('button', { name: /next page/i });

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(prevBtn);
    expect(onParamsChange).toHaveBeenCalledWith(expect.any(Function));

    const updater = onParamsChange.mock.calls[0][0];
    expect(updater({ page: 2, limit: 10 })).toEqual({ page: 1, limit: 10 });
  });

  it('triggers onParamsChange when status or priority filter is selected', () => {
    const onParamsChange = vi.fn();

    mockUseTickets.mockReturnValue({
      data: {
        tickets: sampleTickets,
        meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <MemoryRouter>
        <TicketsList queryParams={{ page: 1, limit: 10 }} onParamsChange={onParamsChange} />
      </MemoryRouter>,
    );

    const statusSelect = screen.getByLabelText(/filter by status/i);
    fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

    expect(onParamsChange).toHaveBeenCalled();
    const statusUpdater = onParamsChange.mock.calls[0][0];
    expect(statusUpdater({ page: 1, limit: 10 })).toEqual({
      page: 1,
      limit: 10,
      status: 'in_progress',
    });
  });

  it('resets page to 1 when search filter changes', () => {
    const onParamsChange = vi.fn();

    mockUseTickets.mockReturnValue({
      data: {
        tickets: sampleTickets,
        meta: { page: 3, limit: 10, total: 30, totalPages: 3 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <MemoryRouter>
        <TicketsList queryParams={{ page: 3, limit: 10 }} onParamsChange={onParamsChange} />
      </MemoryRouter>,
    );

    const searchInput = screen.getByLabelText(/search tickets/i);
    fireEvent.change(searchInput, { target: { value: 'timeout' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));

    expect(onParamsChange).toHaveBeenCalled();
    const updater = onParamsChange.mock.calls[0][0];
    expect(updater({ page: 3, limit: 10 })).toEqual({
      page: 1,
      limit: 10,
      search: 'timeout',
    });
  });

  it('handles totalPages = 0 and keeps pagination buttons disabled', () => {
    mockUseTickets.mockReturnValue({
      data: {
        tickets: sampleTickets,
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    render(
      <MemoryRouter>
        <TicketsList queryParams={{ page: 1, limit: 10 }} onParamsChange={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText((_, el) => el?.textContent?.replace(/\s+/g, ' ').trim() === 'Page 1 of 1'),
    ).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: /previous page/i });
    const nextBtn = screen.getByRole('button', { name: /next page/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeDisabled();
  });
});
