/**
 * One set of footer links for both footers. Every column is a search hub:
 * crawlers reach the browse, area, guide and audience pages from any page
 * on the site through here, and the anchor text says what each page is.
 */
export const FOOTER_COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: 'Buy',
    links: [
      { label: 'Properties for sale', href: '/properties' },
      { label: 'Apartments for sale', href: '/apartments' },
      { label: 'Villas for sale', href: '/villas' },
      { label: 'Commercial property', href: '/commercial' },
      { label: 'Property map', href: '/map/locations' },
      { label: 'Developers', href: '/developers' },
    ],
  },
  {
    heading: 'Rent',
    links: [
      { label: 'Rentals in Nairobi', href: '/rent' },
      { label: 'Apartments to rent', href: '/rent/apartments' },
      { label: 'Villas to rent', href: '/rent/villas' },
      { label: 'Offices & shops to rent', href: '/rent/commercial' },
      { label: 'Find an agent', href: '/agents' },
    ],
  },
  {
    heading: 'Professionals',
    links: [
      { label: 'For agents', href: '/for-agents' },
      { label: 'For developers', href: '/for-developers' },
      { label: 'For investors', href: '/for-investors' },
      { label: 'List your agency', href: '/list-agency' },
      { label: 'List a development', href: '/list-development' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Area guides', href: '/neighbourhoods' },
      { label: 'Guides', href: '/guides' },
      { label: 'Buying off-plan in Kenya', href: '/guides/buying-off-plan-in-kenya' },
      { label: 'Renting in Nairobi', href: '/guides/renting-in-nairobi' },
      { label: 'Buying from abroad', href: '/guides/buying-property-in-kenya-from-abroad' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About e-resi', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];
