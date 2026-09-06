'use client';

import { useParams } from 'next/navigation';
import { DealDetail } from '../../../../../components/deals/DealDetail';

export default function DeveloperDealPage() {
  const { id } = useParams<{ id: string }>();
  return <DealDetail id={id} side="developer" />;
}
