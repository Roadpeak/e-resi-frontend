import { DashboardTopnav } from '../../../components/dashboard/DashboardTopnav';
import { DashboardIconRail } from '../../../components/dashboard/DashboardIconRail';
import { RequireAuth } from '../../../components/auth/RequireAuth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s — e-resi Dashboard' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={['DEVELOPER', 'ADMIN']}>
      <div className="flex min-h-screen flex-col bg-white font-google text-[#202124]">
        <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
          <DashboardTopnav />
        </div>
        <div className="flex flex-1">
          <DashboardIconRail />
          <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
