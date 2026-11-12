import { AppLayout } from '../components/AppLayout';
import { TicketsOverview } from '../features/tickets/components/TicketsOverview';
import { useAuth } from '../lib/auth';

/**
 * Authenticated tickets landing page displaying the responsive AppLayout
 * and live ticket queue overview.
 */
export function TicketsPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#172B4D]">
              Support Tickets
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Welcome back{user?.name ? `, ${user.name}` : ''}. Review active requests in your workspace.
            </p>
          </div>
        </div>

        <TicketsOverview />
      </div>
    </AppLayout>
  );
}

