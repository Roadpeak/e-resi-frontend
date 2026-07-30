import type { DashboardStats } from '../types';

export const mockDashboardStats: DashboardStats = {
  totalProperties: 4,
  totalUnits: 433,
  availableUnits: 211,
  totalInquiries: 186,
  newInquiries: 14,
  totalBookings: 73,
  pageViews: 12847,
  leads: 38,
};

export const mockInquiries = [
  { id: 'i1', name: 'James Kariuki', email: 'james@example.com', phone: '+254 712 345 678', property: 'The Pearl Residences', unit: 'Penthouse PH1', message: 'I am very interested in the penthouse. Can we schedule a viewing this weekend?', date: '2026-07-02T10:30:00Z', status: 'new' as const },
  { id: 'i2', name: 'Amina Hassan', email: 'amina@example.com', phone: '+254 722 456 789', property: 'Riverside Villas', unit: 'Villa 1', message: 'Please send me the full brochure and pricing schedule.', date: '2026-07-01T14:15:00Z', status: 'read' as const },
  { id: 'i3', name: 'David Odhiambo', email: 'david@example.com', phone: '+254 733 567 890', property: 'Azure Kileleshwa', unit: 'Apt 5B', message: 'Is this unit still available? I\'d like to discuss financing options.', date: '2026-06-30T09:00:00Z', status: 'replied' as const },
  { id: 'i4', name: 'Grace Wanjiku', email: 'grace@example.com', phone: '+254 700 678 901', property: 'The Pearl Residences', unit: 'Unit 3C', message: 'Interested in a virtual tour. When is the earliest slot?', date: '2026-06-29T16:45:00Z', status: 'new' as const },
  { id: 'i5', name: 'Peter Mwangi', email: 'peter@example.com', phone: '+254 711 789 012', property: 'Greenpark Commercial Hub', unit: 'Floor 10', message: 'We are a law firm looking for a full floor. What\'s the lease structure?', date: '2026-06-28T11:20:00Z', status: 'replied' as const },
];

export const mockBookings = [
  { id: 'b1', name: 'James Kariuki', property: 'The Pearl Residences', unit: 'Penthouse PH1', type: 'virtual' as const, date: '2026-07-05', time: '10:00', status: 'confirmed' as const },
  { id: 'b2', name: 'Amina Hassan', property: 'Riverside Villas', unit: 'Villa 1', type: 'physical' as const, date: '2026-07-06', time: '14:00', status: 'pending' as const },
  { id: 'b3', name: 'Sarah Ndung\'u', property: 'Azure Kileleshwa', unit: 'Studio 2A', type: 'virtual' as const, date: '2026-07-07', time: '11:30', status: 'confirmed' as const },
  { id: 'b4', name: 'Tom Otieno', property: 'The Pearl Residences', unit: 'Unit 2B', type: 'physical' as const, date: '2026-07-08', time: '09:00', status: 'cancelled' as const },
];

export const mockAnalytics = {
  pageViewsOverTime: [
    { date: 'Jun 27', views: 890 },
    { date: 'Jun 28', views: 1240 },
    { date: 'Jun 29', views: 980 },
    { date: 'Jun 30', views: 1560 },
    { date: 'Jul 1', views: 2100 },
    { date: 'Jul 2', views: 1870 },
    { date: 'Jul 3', views: 2207 },
  ],
  topProperties: [
    { name: 'The Pearl Residences', views: 5840, inquiries: 92, leads: 18 },
    { name: 'Riverside Villas', views: 3210, inquiries: 54, leads: 11 },
    { name: 'Azure Kileleshwa', views: 2490, inquiries: 28, leads: 6 },
    { name: 'Greenpark Commercial Hub', views: 1307, inquiries: 12, leads: 3 },
  ],
  trafficSources: [
    { source: 'Direct', percent: 38 },
    { source: 'Search', percent: 29 },
    { source: 'Social', percent: 18 },
    { source: 'Referral', percent: 15 },
  ],
};
