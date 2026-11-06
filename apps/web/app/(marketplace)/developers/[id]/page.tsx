import { Marcellus } from 'next/font/google';
import { DeveloperProfilePage } from '../../../../components/directory/DeveloperProfile';

// Optima-style display face: the developer page reads as the developer's own
// website, so it gets its own type rather than the marketplace's.
const marcellus = Marcellus({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-marcellus',
  display: 'swap',
});

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DeveloperDetailRoute({ params }: Props) {
  const { id } = await params;
  return (
    <div className={`${marcellus.variable} min-h-screen bg-white`}>
      <DeveloperProfilePage profileId={id} />
    </div>
  );
}
