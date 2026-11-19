import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import {
  Badge,
  Button,
  Modal,
  PriorityBadge,
  StatusBadge,
  Textarea,
} from '../components/ui';
import {
  streamSuggestReply,
  categorizeTicket,
  type AiCategorizeResult,
  type TicketComment,
  type TicketStatus,
} from '../features/tickets/api/tickets.api';
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
  } = useComments(ticketId, {
    // Avoid duplicate fetch on initial mount since GET /tickets/:id embeds comments
    enabled: Boolean(ticket && !ticket.comments),
  });

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
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // AI Suggest Reply State
  const [isSuggestingReply, setIsSuggestingReply] = useState(false);
  const [suggestedReply, setSuggestedReply] = useState<string | null>(null);
  const [aiSuggestError, setAiSuggestError] = useState<string | null>(null);

  // AI Triage (Categorize + Priority) State
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiCategorizeResult, setAiCategorizeResult] = useState<AiCategorizeResult | null>(null);
  const [aiCategorizeError, setAiCategorizeError] = useState<string | null>(null);

  const handleSuggestReply = async () => {
    if (!ticket) return;
    setIsSuggestingReply(true);
    setSuggestedReply('');
    setAiSuggestError(null);

    try {
      await streamSuggestReply(ticket.id, {
        onChunk: (chunk) => {
          setSuggestedReply((prev) => (prev ?? '') + chunk);
        },
        onDone: () => {
          setIsSuggestingReply(false);
        },
        onError: (err) => {
          setAiSuggestError(err.message || 'Failed to stream suggested reply');
          setIsSuggestingReply(false);
        },
      });
    } catch (err: any) {
      setAiSuggestError(err.message || 'AI service error');
      setIsSuggestingReply(false);
    }
  };

  const handleApplySuggestedReply = () => {
    if (suggestedReply) {
      setCommentBody((prev) => (prev ? `${prev}\n\n${suggestedReply}` : suggestedReply));
      setSuggestedReply(null);
    }
  };

  const handleAutoCategorize = async () => {
    if (!ticket) return;
    setIsCategorizing(true);
    setAiCategorizeError(null);
    try {
      const result = await categorizeTicket({ ticketId: ticket.id });
      setAiCategorizeResult(result);
    } catch (err: any) {
      setAiCategorizeError(err.message || 'Failed to analyze ticket');
    } finally {
      setIsCategorizing(false);
    }
  };

  if (Number.isNaN(ticketId) || ticketId <= 0) {
    return (
      <AppLayout>
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-900"
        >
          <h2 className="text-base font-bold">Invalid Ticket ID</h2>
          <p className="mt-1 text-sm text-rose-700">The ticket identifier in the URL is invalid.</p>
          <div className="mt-4">
            <Link
              to="/tickets"
              className="inline-flex items-center rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800"
            >
              Back to Tickets
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Loading state
  if (isTicketLoading) {
    return (
      <AppLayout>
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-xs"
        >
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading ticket details...</p>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (isTicketError || !ticket) {
    const isNotFound = ticketError instanceof ApiError && ticketError.status === 404;
    const isForbidden = ticketError instanceof ApiError && ticketError.status === 403;

    return (
      <AppLayout>
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-900 shadow-xs"
        >
          <h2 className="text-lg font-bold">
            {isNotFound
              ? 'Ticket Not Found'
              : isForbidden
                ? 'Access Denied'
                : 'Unable to Load Ticket'}
          </h2>
          <p className="mt-2 text-sm text-rose-700">
            {isNotFound
              ? `Ticket #${ticketId} does not exist or has been removed.`
              : isForbidden
                ? 'You do not have permission to view this ticket.'
                : ticketError instanceof Error
                  ? ticketError.message
                  : 'An unexpected error occurred while fetching the ticket.'}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {!isNotFound && !isForbidden ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => void refetchTicket()}
              >
                Retry
              </Button>
            ) : null}
            <Link
              to="/tickets"
              className="inline-flex items-center rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50"
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-[#2563EB]"
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
                  <Badge variant="neutral" size="sm">
                    {ticket.category}
                  </Badge>
                ) : null}
              </div>
              <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                {ticket.title}
              </h1>
            </div>

            {/* Agent / Admin Status Transition Control */}
            {isAgentOrAdmin ? (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="status-transition-select"
                    className="text-xs font-semibold text-slate-500 whitespace-nowrap"
                  >
                    Change Status
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoCategorize}
                    isLoading={isCategorizing}
                    loadingText="Analyzing..."
                  >
                    ✨ AI Triage
                  </Button>
                  {ticket.status !== 'closed' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCloseModalOpen(true)}
                    >
                      Close Ticket
                    </Button>
                  ) : null}
                </div>
                <select
                  id="status-transition-select"
                  aria-label="Change ticket status"
                  value={ticket.status}
                  disabled={updateTicketMutation.isPending}
                  onChange={(e) => void handleStatusChange(e.target.value as TicketStatus)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none disabled:opacity-50"
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

          {/* AI Triage Recommendation Card */}
          {aiCategorizeResult ? (
            <div
              role="region"
              aria-label="AI Categorization Suggestion"
              className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 text-xs shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-indigo-900">✨ AI Triage Recommendation</span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-800">
                    {Math.round(aiCategorizeResult.confidence * 100)}% confidence
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (AI suggestion — agent verified)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiCategorizeResult(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1"
                  aria-label="Dismiss AI suggestion"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Suggested Category:</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-indigo-100">
                    {aiCategorizeResult.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Suggested Priority:</span>
                  <PriorityBadge priority={aiCategorizeResult.priority} />
                </div>
              </div>
              <p className="mt-2 text-slate-700 italic border-t border-indigo-100/70 pt-1.5">
                "{aiCategorizeResult.reasoning}"
              </p>
            </div>
          ) : null}

          {aiCategorizeError ? (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-800"
            >
              AI Triage Error: {aiCategorizeError}
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
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refetchComments()}
                >
                  Retry loading comments
                </Button>
              </div>
            </div>
          ) : null}

          {/* Empty comments */}
          {!isCommentsLoading && comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
              No comments yet. Post the first response to begin the conversation.
            </div>
          ) : null}

          {/* Comment Thread List */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment: TicketComment) => {
                const isInternalNote = comment.isInternal;
                const authorIsAgent =
                  comment.author?.role === 'agent' || comment.author?.role === 'admin';

                return (
                  <article
                    key={comment.id}
                    className={`rounded-xl border p-4 shadow-xs transition ${
                      isInternalNote
                        ? 'border-amber-200 bg-amber-50/60'
                        : authorIsAgent
                          ? 'border-blue-100 bg-blue-50/30'
                          : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          {comment.author?.name ?? `User #${comment.authorId}`}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ({comment.author?.role ?? 'user'})
                        </span>
                        {isInternalNote ? (
                          <Badge variant="warning" size="sm">
                            Internal Note
                          </Badge>
                        ) : null}
                      </div>
                      <time
                        dateTime={comment.createdAt}
                        className="text-[11px] text-slate-400"
                      >
                        {formatDate(comment.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-800">
                      {comment.body}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : null}

          {/* Add Comment Form */}
          <form
            onSubmit={handleCommentSubmit}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">Add a Response</h3>
              {isAgentOrAdmin ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSuggestReply}
                  isLoading={isSuggestingReply}
                  loadingText="Drafting..."
                >
                  ✨ Suggest Reply with AI
                </Button>
              ) : null}
            </div>

            {/* AI Streamed Suggestion Draft Box */}
            {suggestedReply !== null || isSuggestingReply ? (
              <div
                role="region"
                aria-label="AI Generated Reply Draft"
                className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 border-b border-blue-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" aria-hidden="true">
                      🤖
                    </span>
                    <span className="text-xs font-semibold text-blue-950">
                      AI Suggested Reply (Draft Only)
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
                      gpt-4o-mini
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {suggestedReply && !isSuggestingReply ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        onClick={handleApplySuggestedReply}
                      >
                        Use Draft
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSuggestedReply(null);
                        setAiSuggestError(null);
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>

                <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                  {suggestedReply}
                  {isSuggestingReply ? (
                    <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-blue-600 align-middle" />
                  ) : null}
                </div>

                <p className="mt-2.5 text-[11px] text-slate-500">
                  ⚠️ This draft is generated by AI for agent review. It will not be sent to the
                  customer until you review and submit.
                </p>
              </div>
            ) : null}

            {aiSuggestError ? (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-800"
              >
                AI Suggestion Error: {aiSuggestError}
              </div>
            ) : null}

            {commentErrorMsg ? (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-800"
              >
                {commentErrorMsg}
              </div>
            ) : null}

            <div className="mt-3">
              <Textarea
                id="comment"
                rows={3}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Type your response or update here..."
                aria-label="Comment response text"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              {/* Agent internal note toggle */}
              {isAgentOrAdmin ? (
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Make internal note{' '}
                    <span className="text-slate-400">
                      (visible only to support agents and admins)
                    </span>
                  </span>
                </label>
              ) : (
                <div />
              )}

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={createCommentMutation.isPending}
                loadingText="Posting..."
                disabled={!commentBody.trim()}
              >
                Post Comment
              </Button>
            </div>
          </form>
        </section>

        {/* Close Ticket Confirmation Modal */}
        <Modal
          isOpen={isCloseModalOpen}
          onClose={() => setIsCloseModalOpen(false)}
          title="Close Ticket Confirmation"
          description={`Are you sure you want to close ticket ${ticket.reference}?`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCloseModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={updateTicketMutation.isPending}
                loadingText="Closing..."
                onClick={async () => {
                  await handleStatusChange('closed');
                  setIsCloseModalOpen(false);
                }}
              >
                Confirm Close
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">
            Closing this ticket indicates that all troubleshooting has concluded. The customer will see the ticket marked as closed.
          </p>
        </Modal>
      </div>
    </AppLayout>
  );
}
