import { AccountNav } from '../../../components/account/AccountNav';
import { RequireAuth } from '../../../components/auth/RequireAuth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'My Account', template: '%s — e-resi' },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <div className="min-h-screen bg-white font-google">
        <AccountNav />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </RequireAuth>
  );
}
