'use client';

import { useParams } from 'next/navigation';
import { DealDetail } from '../../../../../components/deals/DealDetail';

export default function AgentDealPage() {
  const { id } = useParams<{ id: string }>();
  return <DealDetail id={id} side="agent" />;
}
