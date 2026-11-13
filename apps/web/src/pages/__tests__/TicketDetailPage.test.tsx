import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useTicketsHook from '../../features/tickets/hooks/useTickets';
import { ApiError } from '../../lib/api-client';
import * as authModule from '../../lib/auth';
import { TicketDetailPage } from '../TicketDetailPage';

vi.mock('../../lib/auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../features/tickets/hooks/useTickets', () => ({
  useTicket: vi.fn(),
  useComments: vi.fn(),
  useUpdateTicket: vi.fn(),
  useCreateComment: vi.fn(),
}));

const mockUseAuth = vi.mocked(authModule.useAuth);
const mockUseTicket = vi.mocked(useTicketsHook.useTicket);
const mockUseComments = vi.mocked(useTicketsHook.useComments);
const mockUseUpdateTicket = vi.mocked(useTicketsHook.useUpdateTicket);
const mockUseCreateComment = vi.mocked(useTicketsHook.useCreateComment);

const mockTicketData = {
  id: 42,
  reference: 'TCK-2026-0042',
  title: 'Cannot access billing portal',
  description: 'Getting 403 on billing page',
  status: 'open' as const,
  priority: 'P2' as const,
  category: 'Billing',
  customerId: 10,
  assigneeId: 2,
  createdAt: '2026-11-13T09:00:00.000Z',
  updatedAt: '2026-11-13T09:30:00.000Z',
  customer: { id: 10, name: 'Alice Customer', email: 'alice@client.com' },
  assignee: { id: 2, name: 'Bob Agent', email: 'bob@supportdesk.io' },
};

const mockCommentsData = [
  {
    id: 1,
    body: 'Investigating customer access logs.',
    isInternal: true,
    ticketId: 42,
    authorId: 2,
    createdAt: '2026-11-13T09:15:00.000Z',
    author: { id: 2, name: 'Bob Agent', email: 'bob@supportdesk.io' },
  },
  {
    id: 2,
    body: 'We have resolved the permissions on your account.',
    isInternal: false,
    ticketId: 42,
    authorId: 2,
    createdAt: '2026-11-13T09:25:00.000Z',
    author: { id: 2, name: 'Bob Agent', email: 'bob@supportdesk.io' },
  },
];

describe('TicketDetailPage', () => {
  const mockUpdateMutateAsync = vi.fn();
  const mockCreateCommentMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseUpdateTicket.mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as any);

    mockUseCreateComment.mockReturnValue({
      mutateAsync: mockCreateCommentMutateAsync,
      isPending: false,
    } as any);
  });

  function renderPage(initialRoute = '/tickets/42') {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/tickets" element={<div>Ticket Queue Landing</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders loading state when ticket is being fetched', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 10, name: 'Alice Customer', email: 'alice@client.com', role: 'customer' },
      isAuthenticated: true,
      logout: vi.fn(),
    } as any);

    mockUseTicket.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockUseComments.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderPage();
    expect(screen.getByText('Loading ticket details...')).toBeInTheDocument();
  });

  it('renders 404 alert when ticket does not exist', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 10, name: 'Alice Customer', email: 'alice@client.com', role: 'customer' },
      isAuthenticated: true,
      logout: vi.fn(),
    } as any);

    mockUseTicket.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new ApiError(404, 'NOT_FOUND', 'Ticket with ID 42 does not exist'),
      refetch: vi.fn(),
    } as any);

    mockUseComments.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderPage();
    expect(screen.getByText('Ticket Not Found')).toBeInTheDocument();
  });

  it('renders ticket details, comments, and internal note badges for agent', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, name: 'Bob Agent', email: 'bob@supportdesk.io', role: 'agent' },
      isAuthenticated: true,
      logout: vi.fn(),
    } as any);

    mockUseTicket.mockReturnValue({
      data: mockTicketData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockUseComments.mockReturnValue({
      data: mockCommentsData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderPage();

    // Verify ticket header
    expect(screen.getByText('Cannot access billing portal')).toBeInTheDocument();
    expect(screen.getByText('Getting 403 on billing page')).toBeInTheDocument();

    // Verify agent status transition control is present
    expect(screen.getByLabelText(/change status/i)).toBeInTheDocument();

    // Verify internal note badge is present for agent
    expect(screen.getByText('Internal Note')).toBeInTheDocument();
    expect(screen.getByText('Investigating customer access logs.')).toBeInTheDocument();

    // Verify internal note checkbox is present in add comment form for agent
    expect(
      screen.getByLabelText(/make internal note/i),
    ).toBeInTheDocument();
  });

  it('does not display agent controls or internal note checkbox for customer role', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 10, name: 'Alice Customer', email: 'alice@client.com', role: 'customer' },
      isAuthenticated: true,
      logout: vi.fn(),
    } as any);

    mockUseTicket.mockReturnValue({
      data: mockTicketData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    // Backend strips internal comments for customer
    mockUseComments.mockReturnValue({
      data: [mockCommentsData[1]],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderPage();

    // Customer must NOT see status transition dropdown
    expect(screen.queryByLabelText(/change status/i)).not.toBeInTheDocument();

    // Customer must NOT see internal note toggle
    expect(screen.queryByLabelText(/make internal note/i)).not.toBeInTheDocument();
  });

  it('agent changes ticket status calling updateTicket mutation', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, name: 'Bob Agent', email: 'bob@supportdesk.io', role: 'agent' },
      isAuthenticated: true,
      logout: vi.fn(),
    } as any);

    mockUseTicket.mockReturnValue({
      data: mockTicketData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockUseComments.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderPage();

    const statusSelect = screen.getByLabelText(/change status/i);
    fireEvent.change(statusSelect, { target: { value: 'in_progress' } });

    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        id: 42,
        data: { status: 'in_progress' },
      });
    });
  });

  it('posts a comment through createComment mutation and clears comment input', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, name: 'Bob Agent', email: 'bob@supportdesk.io', role: 'agent' },
      isAuthenticated: true,
      logout: vi.fn(),
    } as any);

    mockUseTicket.mockReturnValue({
      data: mockTicketData,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    mockUseComments.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    renderPage();

    const textarea = screen.getByPlaceholderText(/type your response or update here/i);
    fireEvent.change(textarea, { target: { value: 'Working on patch.' } });

    const postBtn = screen.getByRole('button', { name: /post comment/i });
    fireEvent.click(postBtn);

    await waitFor(() => {
      expect(mockCreateCommentMutateAsync).toHaveBeenCalledWith({
        ticketId: 42,
        data: {
          body: 'Working on patch.',
          isInternal: false,
        },
      });
    });

    expect(textarea).toHaveValue('');
  });
});
