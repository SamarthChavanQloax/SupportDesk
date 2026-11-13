import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as useTicketsHook from '../../features/tickets/hooks/useTickets';
import { ApiError } from '../../lib/api-client';
import { CreateTicketPage } from '../CreateTicketPage';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({
    user: { id: 10, name: 'Alice Customer', email: 'alice@client.com', role: 'customer' },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}));

vi.mock('../../features/tickets/hooks/useTickets', () => ({
  useCreateTicket: vi.fn(),
}));

const mockUseCreateTicket = vi.mocked(useTicketsHook.useCreateTicket);

describe('CreateTicketPage', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCreateTicket.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/tickets/new']}>
        <Routes>
          <Route path="/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/:id" element={<div>Ticket Detail Destination</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('validates required fields using the shared Zod schema (title < 3, description < 5)', async () => {
    renderPage();

    // Click submit with empty form
    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    expect(await screen.findByText('Title must be at least 3 characters long')).toBeInTheDocument();
    expect(screen.getByText('Description must be at least 5 characters long')).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();

    // Enter title with 2 characters (too short)
    fireEvent.input(screen.getByLabelText(/ticket subject/i), { target: { value: 'Hi' } });
    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    expect(await screen.findByText('Title must be at least 3 characters long')).toBeInTheDocument();
  });

  it('submits valid data and navigates to the newly created ticket', async () => {
    mockMutateAsync.mockResolvedValue({
      id: 123,
      reference: 'TCK-2026-0123',
      title: 'Payment gateway error',
      description: '500 internal server error received from payment gateway on checkout.',
      status: 'open',
      priority: 'P2',
      category: 'Billing',
    });

    renderPage();

    fireEvent.input(screen.getByLabelText(/ticket subject/i), {
      target: { value: 'Payment gateway error' },
    });
    fireEvent.change(screen.getByLabelText(/priority/i), {
      target: { value: 'P2' },
    });
    fireEvent.input(screen.getByLabelText(/category/i), {
      target: { value: 'Billing' },
    });
    fireEvent.input(screen.getByLabelText(/detailed description/i), {
      target: { value: '500 internal server error received from payment gateway on checkout.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        title: 'Payment gateway error',
        description: '500 internal server error received from payment gateway on checkout.',
        priority: 'P2',
        category: 'Billing',
      });
    });

    expect(await screen.findByText('Ticket Detail Destination')).toBeInTheDocument();
  });

  it('displays an error alert when the server rejects the submission', async () => {
    mockMutateAsync.mockRejectedValue(
      new ApiError(400, 'BAD_REQUEST', 'Customer account is suspended'),
    );

    renderPage();

    fireEvent.input(screen.getByLabelText(/ticket subject/i), {
      target: { value: 'Valid Title Here' },
    });
    fireEvent.input(screen.getByLabelText(/detailed description/i), {
      target: { value: 'Valid description that has more than 5 characters.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Customer account is suspended');
  });

  it('maps server-side 400 validation error details directly to field errors', async () => {
    mockMutateAsync.mockRejectedValue(
      new ApiError(400, 'VALIDATION_ERROR', 'Validation failed', [
        { field: 'title', message: 'Subject contains prohibited characters' },
        { field: 'description', message: 'Description contains sensitive patterns' },
      ]),
    );

    renderPage();

    fireEvent.input(screen.getByLabelText(/ticket subject/i), {
      target: { value: 'Valid Title Here' },
    });
    fireEvent.input(screen.getByLabelText(/detailed description/i), {
      target: { value: 'Valid description with sufficient length.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit ticket/i }));

    expect(
      await screen.findByText('Subject contains prohibited characters'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Description contains sensitive patterns'),
    ).toBeInTheDocument();
  });

  it('prevents double submission when submit button is clicked while request is pending', async () => {
    let resolveMutation!: (value: any) => void;
    mockMutateAsync.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMutation = resolve;
        }),
    );

    renderPage();

    fireEvent.input(screen.getByLabelText(/ticket subject/i), {
      target: { value: 'Valid Title Here' },
    });
    fireEvent.input(screen.getByLabelText(/detailed description/i), {
      target: { value: 'Valid description with sufficient length.' },
    });

    const submitBtn = screen.getByRole('button', { name: /submit ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating ticket/i })).toBeDisabled();
    });

    // Attempt second click while pending
    fireEvent.click(screen.getByRole('button', { name: /creating ticket/i }));

    expect(mockMutateAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveMutation({
        id: 99,
        reference: 'TCK-2026-0099',
        title: 'Valid Title Here',
        description: 'Valid description with sufficient length.',
        status: 'open',
        priority: 'P3',
      });
    });

    expect(await screen.findByText('Ticket Detail Destination')).toBeInTheDocument();
  });
});

