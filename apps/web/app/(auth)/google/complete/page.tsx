import type { Metadata } from 'next';
import { GoogleComplete } from '../../../../components/auth/GoogleComplete';

export const metadata: Metadata = {
  title: 'Signing you in',
  robots: { index: false, follow: false },
};

export default function GoogleCompletePage() {
  return <GoogleComplete />;
}
