import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, PriorityBadge, StatusBadge } from '../Badge';

describe('Badge Component', () => {
  it('renders generic badge with default styling', () => {
    render(<Badge>General Badge</Badge>);
    const badge = screen.getByText('General Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-slate-100');
  });

  it('renders correctly for all supported ticket statuses', () => {
    const statuses = [
      { status: 'open' as const, label: 'Open', colorClass: 'bg-sky-50' },
      { status: 'in_progress' as const, label: 'In Progress', colorClass: 'bg-amber-50' },
      {
        status: 'waiting_on_customer' as const,
        label: 'Waiting on Customer',
        colorClass: 'bg-violet-50',
      },
      { status: 'resolved' as const, label: 'Resolved', colorClass: 'bg-emerald-50' },
      { status: 'closed' as const, label: 'Closed', colorClass: 'bg-slate-100' },
    ];

    for (const { status, label, colorClass } of statuses) {
      const { unmount } = render(<StatusBadge status={status} />);
      const el = screen.getByText(label);
      expect(el).toBeInTheDocument();
      expect(el.closest('span')).toHaveClass(colorClass);
      unmount();
    }
  });

  it('renders correctly for all supported ticket priorities', () => {
    const priorities = [
      { priority: 'P1' as const, label: 'P1 - Critical', colorClass: 'bg-rose-50' },
      { priority: 'P2' as const, label: 'P2 - High', colorClass: 'bg-orange-50' },
      { priority: 'P3' as const, label: 'P3 - Medium', colorClass: 'bg-blue-50' },
      { priority: 'P4' as const, label: 'P4 - Low', colorClass: 'bg-slate-50' },
    ];

    for (const { priority, label, colorClass } of priorities) {
      const { unmount } = render(<PriorityBadge priority={priority} />);
      const el = screen.getByText(label);
      expect(el).toBeInTheDocument();
      expect(el.closest('span')).toHaveClass(colorClass);
      unmount();
    }
  });

  it('renders with dot indicator and custom sizes', () => {
    render(<Badge variant="success" dot size="sm">Active</Badge>);
    const badge = screen.getByText('Active');
    expect(badge).toHaveClass('text-[11px]');
  });
});
