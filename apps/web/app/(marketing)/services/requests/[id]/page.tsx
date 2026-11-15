import { ServiceRequestsRedirect } from '../../../../../components/services/ServiceRequestsRedirect';

/** Forwards emailed and notified links into the user's own portal, keeping the query string. */
export default async function ServiceRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ServiceRequestsRedirect id={id} />;
}
