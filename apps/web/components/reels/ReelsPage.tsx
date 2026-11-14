'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReelsViewer } from './ReelsViewer';

function Inner() {
  const sp = useSearchParams();
  const deal = sp.get('deal');
  const params = {
    deal: deal === 'RENT' || deal === 'SALE' ? deal : undefined,
    start: sp.get('start') ?? undefined,
    agentId: sp.get('agent') ?? undefined,
  } as const;
  return <ReelsViewer params={params} backHref={params.deal === 'RENT' ? '/rent' : params.agentId ? `/agents/${params.agentId}` : '/properties'} />;
}

export function ReelsPage() {
  return <Suspense fallback={<div className="fixed inset-0 bg-black" />}><Inner /></Suspense>;
}
