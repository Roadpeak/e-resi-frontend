import { DashboardSidebar } from '../../../components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '../../../components/dashboard/DashboardTopbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s — e-resi Dashboard' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-surface-950 overflow-hidden">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
