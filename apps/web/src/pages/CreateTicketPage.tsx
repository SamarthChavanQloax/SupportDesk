import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Button, Input, PriorityBadge, Select, Textarea } from '../components/ui';
import { useCreateTicket } from '../features/tickets/hooks/useTickets';
import {
  categorizeTicket,
  type AiCategorizeResult,
} from '../features/tickets/api/tickets.api';
import { useAuth } from '../lib/auth';
import {
  createTicketSchema,
  type CreateTicketFormValues,
} from '../features/tickets/schema/ticket-schema';
import { ApiError } from '../lib/api-client';

export function CreateTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'admin';

  const [serverError, setServerError] = useState<string | null>(null);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [aiCategorizeResult, setAiCategorizeResult] = useState<AiCategorizeResult | null>(null);
  const [aiCategorizeNotice, setAiCategorizeNotice] = useState<string | null>(null);

  const createTicketMutation = useCreateTicket();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'P3',
      category: '',
    },
  });

  const titleValue = watch('title');
  const descriptionValue = watch('description');

  const handleAutoCategorize = async () => {
    setAiCategorizeNotice(null);
    if (!titleValue || titleValue.trim().length < 3) {
      setAiCategorizeNotice('Please enter a ticket subject (min 3 chars) first for AI analysis.');
      return;
    }
    if (!descriptionValue || descriptionValue.trim().length < 5) {
      setAiCategorizeNotice(
        'Please enter a detailed description (min 5 chars) first for AI analysis.'
      );
      return;
    }

    setIsCategorizing(true);
    try {
      const result = await categorizeTicket({
        title: titleValue.trim(),
        description: descriptionValue.trim(),
      });
      setAiCategorizeResult(result);
    } catch (err: any) {
      setAiCategorizeNotice(err.message || 'AI categorization unavailable.');
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (aiCategorizeResult) {
      setValue('category', aiCategorizeResult.category, { shouldValidate: true });
      setValue('priority', aiCategorizeResult.priority, { shouldValidate: true });
      setAiCategorizeResult(null);
    }
  };

  const onSubmit = async (values: CreateTicketFormValues) => {
    setServerError(null);
    try {
      const created = await createTicketMutation.mutateAsync({
        title: values.title.trim(),
        description: values.description.trim(),
        priority: values.priority,
        category: values.category?.trim() ? values.category.trim() : undefined,
      });

      // Navigate to the newly created ticket detail
      navigate(`/tickets/${created.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);

        // Map field-level validation details from API 400 responses
        if (Array.isArray(err.details)) {
          for (const item of err.details) {
            if (
              item.field &&
              ['title', 'description', 'priority', 'category'].includes(item.field)
            ) {
              setError(item.field as keyof CreateTicketFormValues, {
                message: item.message,
              });
            }
          }
        } else if (err.details && typeof err.details === 'object') {
          for (const [key, msg] of Object.entries(err.details)) {
            if (
              ['title', 'description', 'priority', 'category'].includes(key) &&
              typeof msg === 'string'
            ) {
              setError(key as keyof CreateTicketFormValues, { message: msg });
            }
          }
        }
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Unable to create ticket. Please check your connection and try again.');
      }
    }
  };

  const isPending = isSubmitting || createTicketMutation.isPending;

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to="/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-[#2563EB]"
          >
            <span aria-hidden="true">&larr;</span> Back to ticket queue
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#172B4D]">
            Create Support Ticket
          </h1>
          <p className="mt-1 text-sm text-[#64748B]">
            Describe your request or issue. Our support team will review and respond promptly.
          </p>
        </div>

        {/* Server error alert banner */}
        {serverError ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {serverError}
          </div>
        ) : null}

        {/* Create ticket form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs sm:p-8"
        >
          {/* Subject / Title */}
          <Input
            label="Ticket Subject"
            required
            placeholder="Brief summary of the issue (e.g. Payment gateway timeout on checkout)"
            error={errors.title?.message}
            {...register('title')}
          />

          {/* AI Auto-Categorize Section (Agents / Admins) */}
          {isAgentOrAdmin ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-indigo-950">✨ AI Ticket Triage</span>
                  <p className="text-[11px] text-slate-500">
                    Analyze subject and description to suggest Category and Priority
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoCategorize}
                  isLoading={isCategorizing}
                  loadingText="Classifying..."
                >
                  Auto-Classify with AI
                </Button>
              </div>

              {aiCategorizeNotice ? (
                <p className="mt-2 text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                  {aiCategorizeNotice}
                </p>
              ) : null}

              {aiCategorizeResult ? (
                <div className="mt-3 rounded-lg border border-indigo-200 bg-white p-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-900">
                      Recommendation ({Math.round(aiCategorizeResult.confidence * 100)}% confidence)
                    </span>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleApplyAiSuggestion}
                    >
                      Apply Suggestions
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Category: </span>
                      <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {aiCategorizeResult.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Priority: </span>
                      <PriorityBadge priority={aiCategorizeResult.priority} />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-600 italic">
                    "{aiCategorizeResult.reasoning}"
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Priority & Category Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select
              label="Priority"
              required
              error={errors.priority?.message}
              {...register('priority')}
            >
              <option value="P1">P1 - Critical (System down / Blocking)</option>
              <option value="P2">P2 - High (Severe disruption)</option>
              <option value="P3">P3 - Medium (Normal business impact)</option>
              <option value="P4">P4 - Low (General inquiry / Minor)</option>
            </Select>

            <Input
              label="Category"
              placeholder="Billing, Technical, Security..."
              helperText="Optional classification for routing"
              error={errors.category?.message}
              {...register('category')}
            />
          </div>

          {/* Detailed Description */}
          <Textarea
            label="Detailed Description"
            required
            rows={5}
            placeholder="Provide all relevant details, steps to reproduce, error messages or environment details..."
            helperText="Minimum 5 characters. Be specific so support agents can help quickly."
            error={errors.description?.message}
            {...register('description')}
          />

          {/* Actions Bar */}
          <div className="flex flex-col-reverse items-center justify-end gap-3 pt-3 sm:flex-row">
            <Link
              to="/tickets"
              className="inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#2563EB] sm:w-auto"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isPending}
              loadingText="Creating ticket..."
              className="w-full sm:w-auto"
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
