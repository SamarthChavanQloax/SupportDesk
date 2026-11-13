import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import type { TicketPriority, TicketQueryParams, TicketStatus } from '../features/tickets/api/tickets.api';
import { TicketsList } from '../features/tickets/components/TicketsList';
import { useAuth } from '../lib/auth';

export function TicketsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract query parameters from URL so filters/pagination are bookmarkable and shareable
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const statusParam = (searchParams.get('status') as TicketStatus | null) ?? undefined;
  const priorityParam = (searchParams.get('priority') as TicketPriority | null) ?? undefined;
  const searchParam = searchParams.get('search') ?? undefined;

  const queryParams: TicketQueryParams = {
    page: Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam,
    limit: 10,
    status: statusParam || undefined,
    priority: priorityParam || undefined,
    search: searchParam || undefined,
  };

  const handleParamsChange = (
    updater: (prev: TicketQueryParams) => TicketQueryParams,
  ) => {
    const updated = updater(queryParams);
    const newParams = new URLSearchParams();

    if (updated.page && updated.page > 1) {
      newParams.set('page', String(updated.page));
    }
    if (updated.status) {
      newParams.set('status', updated.status);
    }
    if (updated.priority) {
      newParams.set('priority', updated.priority);
    }
    if (updated.search && updated.search.trim()) {
      newParams.set('search', updated.search.trim());
    }

    setSearchParams(newParams);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
              Support Tickets
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Welcome back{user?.name ? `, ${user.name}` : ''}. Review and manage customer support requests.
            </p>
          </div>
        </div>

        <TicketsList
          queryParams={queryParams}
          onParamsChange={handleParamsChange}
        />
      </div>
    </AppLayout>
  );
}
