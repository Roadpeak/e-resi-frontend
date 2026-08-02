import { AdminNav } from '../../../components/admin/AdminNav';
import { RequireAuth } from '../../../components/auth/RequireAuth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — e-resi Admin' },
  // The console must never be indexed.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth roles={['ADMIN']}>
      <div className="min-h-screen bg-[#f8f9fa] font-google">
        <AdminNav />
        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </RequireAuth>
  );
}
