import { PageShell } from '../../../../../components/marketing/PageShell';
import { ServiceRequestTracker } from '../../../../../components/services/ServiceRequestTracker';

export default async function ServiceRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageShell eyebrow="Production request" title="Track your request" lede="Your quote, invoice and production progress, all in one place.">
      <ServiceRequestTracker id={id} />
    </PageShell>
  );
}
