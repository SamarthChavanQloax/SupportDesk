import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Ticket, TicketPriority, TicketQueryParams, TicketStatus } from '../api/tickets.api';
import { useTickets } from '../hooks/useTickets';
import { PriorityBadge, StatusBadge } from './StatusBadge';

interface TicketsListProps {
  queryParams: TicketQueryParams;
  onParamsChange: (updater: (prev: TicketQueryParams) => TicketQueryParams) => void;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function TicketsList({ queryParams, onParamsChange }: TicketsListProps) {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(queryParams.search ?? '');

  const { data, isLoading, isError, error, refetch, isFetching } = useTickets(queryParams);

  const tickets = data?.tickets ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };
  const currentPage = meta.page ?? queryParams.page ?? 1;
  const totalPages = meta.totalPages ?? 1;
  const totalCount = meta.total ?? tickets.length;

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    onParamsChange((prev) => ({
      ...prev,
      search: searchInput.trim() ? searchInput.trim() : undefined,
      page: 1, // Reset to first page on search change
    }));
  };

  const handleStatusFilterChange = (status: string) => {
    onParamsChange((prev) => ({
      ...prev,
      status: status ? (status as TicketStatus) : undefined,
      page: 1,
    }));
  };

  const handlePriorityFilterChange = (priority: string) => {
    onParamsChange((prev) => ({
      ...prev,
      priority: priority ? (priority as TicketPriority) : undefined,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    onParamsChange(() => ({
      page: 1,
      limit: 10,
    }));
  };

  const hasActiveFilters = Boolean(
    queryParams.status || queryParams.priority || queryParams.search,
  );

  return (
    <div className="space-y-4">
      {/* Top action header: Filters bar + New Ticket button */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-1 flex-wrap items-center gap-2.5"
        >
          {/* Search by title / reference */}
          <div className="relative min-w-[200px] flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search reference, subject..."
              aria-label="Search tickets"
              className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
            />
          </div>

          {/* Status filter */}
          <select
            value={queryParams.status ?? ''}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            aria-label="Filter by status"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_on_customer">Waiting on Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Priority filter */}
          <select
            value={queryParams.priority ?? ''}
            onChange={(e) => handlePriorityFilterChange(e.target.value)}
            aria-label="Filter by priority"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - High</option>
            <option value="P3">P3 - Medium</option>
            <option value="P4">P4 - Low</option>
          </select>

          <button
            type="submit"
            className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Search
          </button>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Reset
            </button>
          ) : null}
        </form>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            <span aria-hidden="true">+</span>
            <span>New Ticket</span>
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs"
        >
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading support queue...</p>
        </div>
      ) : null}

      {/* Error state */}
      {isError ? (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900 shadow-xs"
        >
          <h2 className="text-sm font-semibold">Unable to load tickets</h2>
          <p className="mt-1 text-sm text-rose-700">
            {error instanceof Error ? error.message : 'An unexpected error occurred while loading tickets.'}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 inline-flex items-center rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
          >
            Retry
          </button>
        </div>
      ) : null}

      {/* Empty state */}
      {!isLoading && !isError && tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="mt-3 text-base font-semibold text-slate-800">
            {hasActiveFilters ? 'No tickets match your filters' : 'No tickets in this workspace'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {hasActiveFilters
              ? 'Try adjusting or clearing your status, priority, or search query.'
              : 'Create your first customer support ticket to get started.'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear filters
            </button>
          ) : (
            <Link
              to="/tickets/new"
              className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Create Ticket
            </Link>
          )}
        </div>
      ) : null}

      {/* Populated queue: Mobile cards + Desktop table */}
      {!isLoading && !isError && tickets.length > 0 ? (
        <section aria-label="Support tickets list" className="space-y-4">
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {tickets.map((ticket: Ticket) => (
              <article
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-blue-400 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-semibold tracking-wide text-teal-700">
                      {ticket.reference}
                    </span>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900">{ticket.title}</h3>
                  </div>
                  <PriorityBadge priority={ticket.priority} size="sm" />
                </div>
                {ticket.description ? (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                    {ticket.description}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <StatusBadge status={ticket.status} size="sm" />
                  <span>Updated {formatDate(ticket.updatedAt)}</span>
                </div>
              </article>
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
                    Customer / Assignee
                  </th>
                  <th scope="col" className="px-5 py-3.5">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {tickets.map((ticket: Ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="cursor-pointer transition hover:bg-slate-50/80"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold text-teal-700">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="hover:underline focus:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ticket.reference}
                      </Link>
                    </td>
                    <td className="max-w-xs px-5 py-4">
                      <p className="truncate font-medium text-slate-900">{ticket.title}</p>
                      {ticket.category ? (
                        <p className="mt-0.5 text-xs text-slate-500">{ticket.category}</p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <StatusBadge status={ticket.status} size="sm" />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <PriorityBadge priority={ticket.priority} size="sm" />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-600">
                      <p className="font-medium text-slate-800">
                        {ticket.customer?.name ?? `Customer #${ticket.customerId}`}
                      </p>
                      <p className="text-slate-400">
                        {ticket.assignee ? `Assigned to ${ticket.assignee.name}` : 'Unassigned'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                      {formatDate(ticket.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Server-backed Pagination Footer */}
          <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-xs sm:flex-row">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{tickets.length}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalCount}</span> tickets
              {isFetching ? <span className="ml-2 text-blue-600 font-medium">(Updating...)</span> : null}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">
                Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalPages === 0 ? 1 : totalPages}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onParamsChange((prev) => ({
                      ...prev,
                      page: Math.max(1, currentPage - 1),
                    }))
                  }
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onParamsChange((prev) => ({
                      ...prev,
                      page: currentPage + 1,
                    }))
                  }
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
