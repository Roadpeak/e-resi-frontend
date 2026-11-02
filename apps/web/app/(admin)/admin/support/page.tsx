import { Suspense } from 'react';
import { AdminSupportInbox } from '../../../../components/support/AdminSupportInbox';

export const metadata = { title: 'Support' };

export default function AdminSupportPage() {
  return (
    <Suspense>
      <AdminSupportInbox />
    </Suspense>
  );
}
