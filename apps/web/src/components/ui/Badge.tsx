import type { HTMLAttributes, ReactNode } from 'react';
import type { TicketPriority, TicketStatus } from '../../features/tickets/api/tickets.api';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  dotColor?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  children?: ReactNode;
}

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

const genericVariantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-800 border-rose-200',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
  outline: 'bg-transparent text-slate-600 border-slate-300',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  dotColor,
  status,
  priority,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  // If status prop is supplied, use status styling
  if (status) {
    const config = STATUS_CONFIG[status] ?? {
      label: status,
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      dotClass: 'bg-slate-400',
    };
    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${config.badgeClass} ${sizeClass} ${className}`}
        {...rest}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColor || config.dotClass}`}
          aria-hidden="true"
        />
        {children || config.label}
      </span>
    );
  }

  // If priority prop is supplied, use priority styling
  if (priority) {
    const config = PRIORITY_CONFIG[priority] ?? {
      label: priority,
      badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
    };
    const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

    return (
      <span
        className={`inline-flex items-center rounded-md border font-medium ${config.badgeClass} ${sizeClass} ${className}`}
        {...rest}
      >
        {children || config.label}
      </span>
    );
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';
  const variantClass = genericVariantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${variantClass} ${sizeClass} ${className}`}
      {...rest}
    >
      {dot ? (
        <span
          className={`h-1.5 w-1.5 rounded-full ${dotColor || 'bg-current'}`}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}

// Backward compatibility helper components matching previous API
export function StatusBadge({
  status,
  size = 'md',
}: {
  status: TicketStatus;
  size?: 'sm' | 'md';
}) {
  return <Badge status={status} size={size} />;
}

export function PriorityBadge({
  priority,
  size = 'md',
}: {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}) {
  return <Badge priority={priority} size={size} />;
}
