import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Ticket, TicketPriority, TicketQueryParams, TicketStatus } from '../api/tickets.api';
import { useTickets } from '../hooks/useTickets';
import {
  Button,
  PriorityBadge,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui';

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

  useEffect(() => {
    setSearchInput(queryParams.search ?? '');
  }, [queryParams.search]);

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

          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
            >
              Reset
            </Button>
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
          <div className="mt-4">
            <Button
              variant="danger"
              size="sm"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
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
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            {hasActiveFilters ? 'No tickets match your filters' : 'No tickets in this workspace'}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {hasActiveFilters
              ? 'Try clearing your status, priority or search filters to find what you are looking for.'
              : 'You have no support tickets yet. Create your first ticket to request assistance.'}
          </p>
          {hasActiveFilters ? (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
              >
                Clear all filters
              </Button>
            </div>
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
          {/* Mobile cards (360px viewport) */}
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

          {/* Desktop & Tablet Table (768px & 1280px viewports) */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Customer / Assignee</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket: Ticket) => (
                  <TableRow
                    key={ticket.id}
                    isInteractive
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <TableCell className="whitespace-nowrap font-mono text-xs font-semibold text-teal-700">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="hover:underline focus:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ticket.reference}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate font-medium text-slate-900">{ticket.title}</p>
                      {ticket.category ? (
                        <p className="mt-0.5 text-xs text-slate-500">{ticket.category}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={ticket.status} size="sm" />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority} size="sm" />
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <p className="font-medium text-slate-800">
                        {ticket.customer?.name || `Customer #${ticket.customerId}`}
                      </p>
                      <p className="text-slate-400">
                        {ticket.assignee
                          ? `Assigned: ${ticket.assignee.name}`
                          : 'Unassigned'}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-slate-500">
                      {formatDate(ticket.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-semibold text-slate-800">
                {tickets.length > 0 ? (currentPage - 1) * 10 + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(currentPage * 10, totalCount)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{totalCount}</span> tickets
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onParamsChange((prev) => ({
                    ...prev,
                    page: Math.max(1, currentPage - 1),
                  }))
                }
                disabled={currentPage <= 1 || isFetching}
                aria-label="Previous page"
              >
                &larr; Previous
              </Button>

              <span className="text-xs font-medium text-slate-600 px-1">
                Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onParamsChange((prev) => ({
                    ...prev,
                    page: currentPage + 1,
                  }))
                }
                disabled={currentPage >= totalPages || totalPages === 0 || isFetching}
                aria-label="Next page"
              >
                Next &rarr;
              </Button>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
