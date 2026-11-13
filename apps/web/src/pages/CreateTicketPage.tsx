import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useCreateTicket } from '../features/tickets/hooks/useTickets';
import {
  createTicketSchema,
  type CreateTicketFormValues,
} from '../features/tickets/schema/ticket-schema';
import { ApiError } from '../lib/api-client';

export function CreateTicketPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const createTicketMutation = useCreateTicket();

  const {
    register,
    handleSubmit,
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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
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
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-[#334155]"
            >
              Ticket Subject <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Brief summary of the issue (e.g. Payment gateway timeout on checkout)"
              aria-invalid={errors.title ? 'true' : 'false'}
              aria-describedby={errors.title ? 'title-error' : undefined}
              className="mt-1.5 block w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#334155] placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none"
              {...register('title')}
            />
            {errors.title ? (
              <p id="title-error" className="mt-1.5 text-xs font-medium text-rose-600">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          {/* Priority & Category Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-semibold text-[#334155]"
              >
                Priority <span className="text-rose-500">*</span>
              </label>
              <select
                id="priority"
                aria-invalid={errors.priority ? 'true' : 'false'}
                aria-describedby={errors.priority ? 'priority-error' : undefined}
                className="mt-1.5 block w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#334155] focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none"
                {...register('priority')}
              >
                <option value="P1">P1 - Critical (System down / Blocking)</option>
                <option value="P2">P2 - High (Severe disruption)</option>
                <option value="P3">P3 - Medium (Normal business impact)</option>
                <option value="P4">P4 - Low (General inquiry / Minor)</option>
              </select>
              {errors.priority ? (
                <p id="priority-error" className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.priority.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-[#334155]"
              >
                Category <span className="text-xs font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="category"
                type="text"
                placeholder="Billing, Technical, Security..."
                aria-invalid={errors.category ? 'true' : 'false'}
                aria-describedby={errors.category ? 'category-error' : undefined}
                className="mt-1.5 block w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#334155] placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none"
                {...register('category')}
              />
              {errors.category ? (
                <p id="category-error" className="mt-1.5 text-xs font-medium text-rose-600">
                  {errors.category.message}
                </p>
              ) : null}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-[#334155]"
            >
              Detailed Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              placeholder="Provide relevant details, steps to reproduce, error codes, and business impact..."
              aria-invalid={errors.description ? 'true' : 'false'}
              aria-describedby={errors.description ? 'description-error' : undefined}
              className="mt-1.5 block w-full rounded-lg border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-sm text-[#334155] placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:outline-none"
              {...register('description')}
            />
            {errors.description ? (
              <p id="description-error" className="mt-1.5 text-xs font-medium text-rose-600">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              to="/tickets"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Creating ticket...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
