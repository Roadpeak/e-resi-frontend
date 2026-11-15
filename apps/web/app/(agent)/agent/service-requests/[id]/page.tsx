import { ServiceRequestsPortalPage } from '../../../../../components/services/ServiceRequestsPortalPage';

export const metadata = { title: 'Production request' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ServiceRequestsPortalPage basePath="/agent/service-requests" id={id} />;
}
