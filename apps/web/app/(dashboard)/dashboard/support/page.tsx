import { Suspense } from 'react';
import { SupportInbox } from '../../../../components/support/SupportInbox';

export const metadata = { title: 'Contact e-resi' };

export default function SupportPage() {
  return (
    <Suspense>
      <SupportInbox />
    </Suspense>
  );
}
