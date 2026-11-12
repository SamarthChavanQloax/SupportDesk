import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../lib/api-client';
import { LoginPage } from '../LoginPage';

const mockLogin = vi.fn();

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    login: mockLogin,
    logout: vi.fn(),
  }),
}));

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tickets" element={<div>Tickets Destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  afterEach(() => {
    mockLogin.mockReset();
  });

  it('shows validation errors for empty and malformed email inputs', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Email address is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();

    fireEvent.input(screen.getByLabelText(/email address/i), {
      target: { value: 'not-an-email' },
    });
    fireEvent.input(screen.getByLabelText(/password/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows loading state while submitting and navigates to /tickets on success', async () => {
    let resolveLogin!: (value: { id: number; name: string; email: string; role: 'agent' }) => void;
    mockLogin.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );

    renderLoginPage();

    fireEvent.input(screen.getByLabelText(/email address/i), {
      target: { value: 'Agent@SupportDesk.io' },
    });
    fireEvent.input(screen.getByLabelText(/password/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'agent@supportdesk.io',
      password: 'Password123!',
    });

    resolveLogin({
      id: 1,
      name: 'Agent One',
      email: 'agent@supportdesk.io',
      role: 'agent',
    });

    expect(await screen.findByText('Tickets Destination')).toBeInTheDocument();
  });

  it('displays an accessible alert when login fails with invalid credentials', async () => {
    mockLogin.mockRejectedValue(
      new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'),
    );

    renderLoginPage();

    fireEvent.input(screen.getByLabelText(/email address/i), {
      target: { value: 'agent@supportdesk.io' },
    });
    fireEvent.input(screen.getByLabelText(/password/i), {
      target: { value: 'wrong-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid email or password');
  });
});
