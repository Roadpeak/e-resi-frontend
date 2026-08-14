'use client';

import { useParams } from 'next/navigation';
import { PartnershipDetail } from '../../../../../components/agent/PartnershipDetail';

export default function AgentPartnershipPage() {
  const { id } = useParams<{ id: string }>();
  return <PartnershipDetail partnershipId={id} side="agent" />;
}
