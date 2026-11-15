import { PageShell } from '../../../../components/marketing/PageShell';
import { ServiceRequestList } from '../../../../components/services/ServiceRequestList';

export default function ServiceRequestsPage() {
  return (
    <PageShell eyebrow="Production services" title="Your production requests" lede="Quotes, invoices and progress for every job you’ve asked us to produce.">
      <ServiceRequestList />
    </PageShell>
  );
}
