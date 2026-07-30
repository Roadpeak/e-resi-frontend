import { NavbarLight } from '../../../components/layout/NavbarLight';
import { RentPage } from '../../../components/rent/RentPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rent in Nairobi — e-resi',
  description: 'Browse furnished and unfurnished apartments, villas and offices for rent in Nairobi with cinematic and 3D tours.',
};

export default function Rent() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #e8e6f0 0%, #f5f3ee 40%, #f0ece4 70%, #f5e8d8 100%)' }}>
      <NavbarLight />
      <RentPage />
    </div>
  );
}
