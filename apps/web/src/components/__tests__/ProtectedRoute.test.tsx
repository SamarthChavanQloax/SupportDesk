import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProtectedRoute, PublicOnlyRoute } from '../ProtectedRoute';

const mockUseAuth = vi.fn();

vi.mock('../../lib/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute & PublicOnlyRoute', () => {
  it('redirects unauthenticated users from /tickets to /login', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={['/tickets']}>
        <Routes>
          <Route path="/login" element={<div>Login Screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/tickets" element={<div>Protected Tickets</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected Tickets')).not.toBeInTheDocument();
  });

  it('renders protected content and redirects authenticated users away from /login', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<div>Login Screen</div>} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/tickets" element={<div>Protected Tickets</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Tickets')).toBeInTheDocument();
    expect(screen.queryByText('Login Screen')).not.toBeInTheDocument();
  });
});
