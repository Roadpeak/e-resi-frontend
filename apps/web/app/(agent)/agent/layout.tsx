import type { Metadata } from 'next';
import { DashboardTopnav } from '../../../components/dashboard/DashboardTopnav';
import { AgentIconRail } from '../../../components/agent/AgentIconRail';
import { RequireAuth } from '../../../components/auth/RequireAuth';

export const metadata: Metadata = {
  title: { default: 'Agent', template: '%s — e-resi Agent' },
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    // ADMIN included so support can open an agent's workspace when helping
    // with a verification or billing problem.
    <RequireAuth roles={['AGENT', 'ADMIN']}>
      <div className="flex min-h-screen flex-col bg-white font-google text-[#202124]">
        <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
          <DashboardTopnav />
        </div>
        <div className="flex flex-1">
          <AgentIconRail />
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
