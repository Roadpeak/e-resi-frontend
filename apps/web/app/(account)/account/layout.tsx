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
        {/* Full-bleed canvas: the account area uses the whole viewport with a
            responsive gutter, matching the nav above. Pages must not re-cap
            themselves — alignment comes from grids, not nested max-widths. */}
        <main className="w-full px-4 py-8 sm:px-6 lg:px-10 2xl:px-16">{children}</main>
      </div>
    </RequireAuth>
  );
}
