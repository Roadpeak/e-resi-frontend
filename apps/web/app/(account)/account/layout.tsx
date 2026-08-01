import { AccountSidebar } from '../../../components/account/AccountSidebar';
import { AccountTopbar } from '../../../components/account/AccountTopbar';
import { RequireAuth } from '../../../components/auth/RequireAuth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'My Account', template: '%s — e-resi' },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
    <div className="flex min-h-screen bg-gray-50">
      <AccountSidebar />
      <div className="flex flex-1 flex-col">
        <AccountTopbar />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
    </RequireAuth>
  );
}
