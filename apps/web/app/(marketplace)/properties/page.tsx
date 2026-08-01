import { NavbarLight } from '../../../components/layout/NavbarLight';
import { PropertiesPage } from '../../../components/marketplace/PropertiesPage';

export const metadata = {
  title: 'Browse Properties',
  description: "Discover Kenya's finest developments with immersive 3D tours, virtual reality, and cinematic walkthroughs.",
};

export default function Properties() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarLight />
      <PropertiesPage />
    </div>
  );
}
