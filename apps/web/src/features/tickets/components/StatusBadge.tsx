import type { TicketPriority, TicketStatus } from '../api/tickets.api';

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; badgeClass: string; dotClass: string }
> = {
  open: {
    label: 'Open',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  waiting_on_customer: {
    label: 'Waiting on Customer',
    badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
    dotClass: 'bg-violet-500',
  },
  resolved: {
    label: 'Resolved',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  closed: {
    label: 'Closed',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
};

export const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; badgeClass: string }
> = {
  P1: { label: 'P1 - Critical', badgeClass: 'bg-rose-50 text-rose-800 border-rose-200' },
  P2: { label: 'P2 - High', badgeClass: 'bg-orange-50 text-orange-800 border-orange-200' },
  P3: { label: 'P3 - Medium', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  P4: { label: 'P4 - Low', badgeClass: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export function StatusBadge({
  status,
  size = 'md',
}: {
  status: TicketStatus;
  size?: 'sm' | 'md';
}) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${config.badgeClass} ${sizeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}

export function PriorityBadge({
  priority,
  size = 'md',
}: {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}) {
  const config = PRIORITY_CONFIG[priority] ?? {
    label: priority,
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${config.badgeClass} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
}
