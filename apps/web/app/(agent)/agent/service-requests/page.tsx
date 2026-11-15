import { ServiceRequestsPortalPage } from '../../../../components/services/ServiceRequestsPortalPage';

export const metadata = { title: 'Production requests' };

export default function Page() {
  return <ServiceRequestsPortalPage basePath="/agent/service-requests" />;
}
