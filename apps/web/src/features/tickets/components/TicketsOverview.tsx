import type { TicketPriority, TicketStatus, TicketSummary } from '../api/tickets.api';
import { useTickets } from '../hooks/useTickets';

const STATUS_STYLES: Record<TicketStatus, { label: string; badgeClass: string }> = {
  open: {
    label: 'Open',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  waiting_on_customer: {
    label: 'Waiting on Customer',
    badgeClass: 'bg-violet-100 text-violet-800 border-violet-200',
  },
  resolved: {
    label: 'Resolved',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  closed: {
    label: 'Closed',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

const PRIORITY_STYLES: Record<TicketPriority, string> = {
  P1: 'bg-rose-100 text-rose-800 border-rose-200',
  P2: 'bg-orange-100 text-orange-800 border-orange-200',
  P3: 'bg-blue-50 text-blue-700 border-blue-200',
  P4: 'bg-slate-100 text-slate-600 border-slate-200',
};

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.badgeClass}`}
    >
      {style.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[priority]}`}
    >
      {priority}
    </span>
  );
}

function TicketMobileCard({ ticket }: { ticket: TicketSummary }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-teal-700">{ticket.reference}</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">{ticket.title}</h3>
        </div>
        <PriorityBadge priority={ticket.priority} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <StatusBadge status={ticket.status} />
        <span>Updated {formatDate(ticket.updatedAt)}</span>
      </div>
    </article>
  );
}

/**
 * Ticket queue overview backed by TanStack Query (`useTickets`) with loading,
 * error, empty, desktop table, and mobile card views.
 */
export function TicketsOverview() {
  const { data, isLoading, isError, error, refetch } = useTickets();
  const tickets = data?.tickets ?? [];

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs"
      >
        <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="mt-3 text-sm font-medium text-slate-600">Loading tickets...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-xs"
      >
        <h2 className="text-sm font-semibold">Unable to load tickets</h2>
        <p className="mt-1 text-sm text-rose-700">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 inline-flex items-center rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-base font-semibold text-slate-800">No tickets yet</h2>
        <p className="mt-1 text-sm text-slate-500">
          Your support queue is currently clear. New tickets will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Ticket queue">
      {/* Mobile card list */}
      <div className="grid gap-3 md:hidden">
        {tickets.map((ticket) => (
          <TicketMobileCard key={ticket.id} ticket={ticket} />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs md:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold tracking-wider text-slate-500 uppercase">
            <tr>
              <th scope="col" className="px-5 py-3.5">
                Reference
              </th>
              <th scope="col" className="px-5 py-3.5">
                Subject
              </th>
              <th scope="col" className="px-5 py-3.5">
                Status
              </th>
              <th scope="col" className="px-5 py-3.5">
                Priority
              </th>
              <th scope="col" className="px-5 py-3.5">
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="transition hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-teal-700">
                  {ticket.reference}
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-900">{ticket.title}</p>
                  {ticket.category ? (
                    <p className="mt-0.5 text-xs text-slate-500">{ticket.category}</p>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                  {formatDate(ticket.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

