import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import type { TicketComment, TicketStatus } from '../features/tickets/api/tickets.api';
import { PriorityBadge, StatusBadge } from '../features/tickets/components/StatusBadge';
import {
  useComments,
  useCreateComment,
  useTicket,
  useUpdateTicket,
} from '../features/tickets/hooks/useTickets';
import { ApiError } from '../lib/api-client';
import { useAuth } from '../lib/auth';

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function TicketDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const ticketId = parseInt(idParam ?? '', 10);

  const { user } = useAuth();
  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'admin';

  const {
    data: ticket,
    isLoading: isTicketLoading,
    isError: isTicketError,
    error: ticketError,
    refetch: refetchTicket,
  } = useTicket(ticketId);

  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    isError: isCommentsError,
    error: commentsError,
    refetch: refetchComments,
  } = useComments(ticketId);

  // Fallback to comments embedded in ticket if separate comments request hasn't completed
  const comments = commentsData ?? ticket?.comments ?? [];

  const updateTicketMutation = useUpdateTicket();
  const createCommentMutation = useCreateComment();

  // New comment state
  const [commentBody, setCommentBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commentErrorMsg, setCommentErrorMsg] = useState<string | null>(null);

  // Status transition state
  const [statusErrorMsg, setStatusErrorMsg] = useState<string | null>(null);

  if (Number.isNaN(ticketId) || ticketId <= 0) {
    return (
      <AppLayout>
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h2 className="text-base font-semibold">Invalid Ticket ID</h2>
          <p className="mt-1 text-sm">Please select a valid ticket from the queue.</p>
          <Link
            to="/tickets"
            className="mt-4 inline-flex items-center rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white"
          >
            Back to Tickets
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (isTicketLoading) {
    return (
      <AppLayout>
        <div role="status" aria-live="polite" className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading ticket details...</p>
        </div>
      </AppLayout>
    );
  }

  if (isTicketError || !ticket) {
    const isNotFound = ticketError instanceof ApiError && ticketError.status === 404;
    return (
      <AppLayout>
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900">
          <h2 className="text-lg font-semibold">
            {isNotFound ? 'Ticket Not Found' : 'Unable to load ticket'}
          </h2>
          <p className="mt-2 text-sm text-rose-700">
            {ticketError instanceof Error
              ? ticketError.message
              : 'The requested ticket could not be found or you do not have permission to view it.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => void refetchTicket()}
              className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800"
            >
              Retry
            </button>
            <Link
              to="/tickets"
              className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50"
            >
              Back to Tickets
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setStatusErrorMsg(null);
    try {
      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        data: { status: newStatus },
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setStatusErrorMsg(err.message);
      } else if (err instanceof Error) {
        setStatusErrorMsg(err.message);
      } else {
        setStatusErrorMsg('Failed to update status');
      }
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) {
      setCommentErrorMsg('Comment body cannot be empty');
      return;
    }

    setCommentErrorMsg(null);
    try {
      await createCommentMutation.mutateAsync({
        ticketId: ticket.id,
        data: {
          body: commentBody.trim(),
          isInternal: isAgentOrAdmin ? isInternal : false,
        },
      });
      setCommentBody('');
      setIsInternal(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setCommentErrorMsg(err.message);
      } else if (err instanceof Error) {
        setCommentErrorMsg(err.message);
      } else {
        setCommentErrorMsg('Failed to add comment');
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <span aria-hidden="true">&larr;</span> Back to ticket queue
          </Link>
          <span className="font-mono text-xs font-bold text-teal-700">
            {ticket.reference}
          </span>
        </div>

        {/* Ticket Header & Status Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-teal-700">
                  {ticket.reference}
                </span>
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
                {ticket.category ? (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {ticket.category}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                {ticket.title}
              </h1>
            </div>

            {/* Agent / Admin Status Transition Control */}
            {isAgentOrAdmin ? (
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <label
                  htmlFor="status-transition-select"
                  className="text-xs font-semibold text-slate-500"
                >
                  Change Status
                </label>
                <select
                  id="status-transition-select"
                  value={ticket.status}
                  onChange={(e) => void handleStatusChange(e.target.value as TicketStatus)}
                  disabled={updateTicketMutation.isPending}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs focus:border-blue-600 focus:outline-none disabled:opacity-60"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_on_customer">Waiting on Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                {updateTicketMutation.isPending ? (
                  <span className="text-[11px] text-blue-600 font-medium">Updating...</span>
                ) : null}
              </div>
            ) : null}
          </div>

          {statusErrorMsg ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-800"
            >
              {statusErrorMsg}
            </div>
          ) : null}

          {/* Description */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h2 className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Description
            </h2>
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
              {ticket.description}
            </p>
          </div>

          {/* Ticket Metadata Bar */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5 text-xs sm:grid-cols-4">
            <div>
              <p className="font-semibold text-slate-500">Customer</p>
              <p className="mt-0.5 font-medium text-slate-900">
                {ticket.customer?.name ?? `Customer #${ticket.customerId}`}
              </p>
              {ticket.customer?.email ? (
                <p className="text-slate-400 truncate">{ticket.customer.email}</p>
              ) : null}
            </div>
            <div>
              <p className="font-semibold text-slate-500">Assignee</p>
              <p className="mt-0.5 font-medium text-slate-900">
                {ticket.assignee ? ticket.assignee.name : 'Unassigned'}
              </p>
              {ticket.assignee?.email ? (
                <p className="text-slate-400 truncate">{ticket.assignee.email}</p>
              ) : null}
            </div>
            <div>
              <p className="font-semibold text-slate-500">Created</p>
              <p className="mt-0.5 text-slate-800">{formatDate(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-500">Last Updated</p>
              <p className="mt-0.5 text-slate-800">{formatDate(ticket.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Comment Thread Section */}
        <section aria-label="Comment thread" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Activity & Comments ({comments.length})
            </h2>
          </div>

          {/* Comments Loading State */}
          {isCommentsLoading && comments.length === 0 ? (
            <div
              role="status"
              className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs"
            >
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="mt-2 text-xs font-medium text-slate-500">Loading comments...</p>
            </div>
          ) : null}

          {/* Comments Error State */}
          {isCommentsError && comments.length === 0 ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-xs"
            >
              <p className="font-semibold">
                {commentsError instanceof Error
                  ? commentsError.message
                  : 'Unable to load comments.'}
              </p>
              <button
                type="button"
                onClick={() => void refetchComments()}
                className="mt-2 font-semibold text-rose-900 underline"
              >
                Retry loading comments
              </button>
            </div>
          ) : null}

          {/* Empty comments */}
          {!isCommentsLoading && comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-700">No comments yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Be the first to leave a response or update on this ticket.
              </p>
            </div>
          ) : null}

          {/* Chronological comment thread */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment: TicketComment) => {
                const isInternalNote = comment.isInternal;
                return (
                  <article
                    key={comment.id}
                    className={`rounded-xl border p-4 shadow-xs transition ${
                      isInternalNote
                        ? 'border-amber-200 bg-amber-50/70'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                          {comment.author?.name ? comment.author.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {comment.author?.name ?? `User #${comment.authorId}`}
                          </p>
                          <p className="text-[11px] text-slate-500">{formatDate(comment.createdAt)}</p>
                        </div>
                      </div>

                      {isInternalNote ? (
                        <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-900 uppercase">
                          Internal Note
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                      {comment.body}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : null}

          {/* Add Comment Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900">Leave a reply</h3>

            {commentErrorMsg ? (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-800"
              >
                {commentErrorMsg}
              </div>
            ) : null}

            <form onSubmit={handleCommentSubmit} className="mt-3 space-y-3">
              <div>
                <label htmlFor="comment-body" className="sr-only">
                  Add comment
                </label>
                <textarea
                  id="comment-body"
                  rows={3}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Type your response or update here..."
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
                />
              </div>

              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                {/* Agent/Admin internal note toggle */}
                {isAgentOrAdmin ? (
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Make internal note (visible only to support agents and admins)</span>
                  </label>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  disabled={createCommentMutation.isPending || !commentBody.trim()}
                  className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createCommentMutation.isPending ? 'Posting comment...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
