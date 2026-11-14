'use client';

import { Suspense } from 'react';
import { ReelsManager } from '../../../../components/reels/ReelsManager';

export default function ReelsDashboardPage() {
  return <Suspense fallback={null}><ReelsManager /></Suspense>;
}
