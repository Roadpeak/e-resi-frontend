import { NavbarLight } from '../../../components/layout/NavbarLight';
import { PropertiesPage } from '../../../components/marketplace/PropertiesPage';

export const metadata = {
  title: 'Browse Properties',
  description: "Discover Kenya's finest developments with immersive 3D tours, virtual reality, and cinematic walkthroughs.",
};

export default function Properties() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #e8e6f0 0%, #f5f3ee 40%, #f0ece4 70%, #f5e8d8 100%)' }}
    >
      <NavbarLight />
      <PropertiesPage />
    </div>
  );
}
