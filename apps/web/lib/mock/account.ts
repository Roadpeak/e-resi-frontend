export const mockBuyer = {
  id: 'u1',
  name: 'Jane Kariuki',
  email: 'jane.kariuki@gmail.com',
  phone: '+254 712 345 678',
  avatarInitials: 'JK',
  joinedDate: '2025-09-14',
  verifiedEmail: true,
  verifiedPhone: false,
};

export const mockSavedProperties = ['the-pearl-residences', 'riverside-villas'];

export const mockMyViewings = [
  {
    id: 'v1',
    property: 'The Pearl Residences',
    slug: 'the-pearl-residences',
    unit: 'Penthouse PH1',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80',
    type: 'virtual' as const,
    date: '2026-07-05',
    time: '10:00',
    status: 'confirmed' as const,
    developer: 'Pristine Developments',
  },
  {
    id: 'v2',
    property: 'Riverside Villas',
    slug: 'riverside-villas',
    unit: 'Villa 1',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80',
    type: 'physical' as const,
    date: '2026-07-12',
    time: '14:00',
    status: 'pending' as const,
    developer: 'Heritage Estates',
  },
  {
    id: 'v3',
    property: 'Azure Kileleshwa',
    slug: 'azure-kileleshwa',
    unit: 'Studio 2A',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80',
    type: 'virtual' as const,
    date: '2026-06-20',
    time: '11:30',
    status: 'completed' as const,
    developer: 'Azure Living',
  },
];

export const mockMyInquiries = [
  {
    id: 'qi1',
    property: 'The Pearl Residences',
    slug: 'the-pearl-residences',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80',
    unit: 'Penthouse PH1',
    message: 'I am very interested in the penthouse. Can we schedule a viewing this weekend?',
    date: '2026-07-02T10:30:00Z',
    status: 'replied' as const,
    reply: 'Thank you for your interest. Our team has confirmed availability for a viewing on 5th July at 10am. Please check your bookings.',
  },
  {
    id: 'qi2',
    property: 'Riverside Villas',
    slug: 'riverside-villas',
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&q=80',
    unit: 'Villa 1',
    message: 'Please send me the full pricing schedule and available villa options.',
    date: '2026-06-28T14:15:00Z',
    status: 'pending' as const,
    reply: null,
  },
];

export const mockMyReservations = [
  {
    id: 'r1',
    property: 'The Pearl Residences',
    slug: 'the-pearl-residences',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80',
    unit: 'Unit 3C',
    floor: 12,
    bedrooms: 2,
    sqm: 102,
    price: 24_500_000,
    currency: 'KES',
    reservationDate: '2026-06-15',
    expiryDate: '2026-08-15',
    status: 'active' as const,
    progress: 35,
    nextStep: 'Sign Sale Agreement',
  },
];
