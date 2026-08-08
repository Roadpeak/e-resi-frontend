import { PropertiesNavbar } from '../../../../components/marketplace/PropertiesNavbar';
import { DeveloperProfilePage } from '../../../../components/directory/DeveloperProfile';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DeveloperDetailRoute({ params }: Props) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-[#f0f0f2]">
      <PropertiesNavbar />
      <DeveloperProfilePage profileId={id} />
    </div>
  );
}
