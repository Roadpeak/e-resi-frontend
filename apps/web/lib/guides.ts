/**
 * Long-form guides — the informational pages people search before they are
 * ready to browse ("how to buy off-plan in Kenya"). Each one ends by pointing
 * at the browse pages that answer the next question.
 *
 * Kept as plain data so the index, the article page, the sitemap and the
 * footer all read from one list. General information only, never legal or
 * financial advice; each guide says so.
 */

export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  /** Search-result description, ~155 characters. */
  description: string;
  /** One line for the index card. */
  summary: string;
  updated: string; // ISO date
  intro: string[];
  sections: GuideSection[];
  faqs?: [string, string][];
  next: { label: string; href: string }[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'buying-off-plan-in-kenya',
    title: 'Buying Off-Plan Property in Kenya: A Step-by-Step Guide',
    description:
      'How to buy an off-plan apartment or home in Kenya: checking the developer and approvals, the sale agreement, payment plans, stamp duty and handover.',
    summary: 'Checking the developer, the approvals, the sale agreement and the payment plan before you commit.',
    updated: '2026-11-09',
    intro: [
      'Buying off-plan means agreeing to buy a home before it is finished — often before construction has started. In return you usually pay less than the finished price and spread payments over the build.',
      'The trade-off is risk: you are paying for something you cannot yet walk through. This guide covers the checks that reduce that risk, in the order you would normally do them.',
    ],
    sections: [
      {
        heading: '1. Check the developer',
        paragraphs: [
          'The developer’s track record is the best predictor of whether your home is delivered on time and as described.',
        ],
        list: [
          'Visit projects they have already completed and, if you can, talk to people living there.',
          'Confirm the company is registered and who its directors are.',
          'Look for delays or disputes on earlier projects.',
          'Prefer developers whose identity and documents have been verified by the platform listing them.',
        ],
      },
      {
        heading: '2. Check the land and the approvals',
        paragraphs: [
          'Ask for the title number of the land and have an official search done at the Ministry of Lands (through Ardhisasa where available) to confirm who owns it and whether it is charged to a bank.',
        ],
        list: [
          'County approval of the building plans.',
          'NEMA environmental impact licence for the project.',
          'National Construction Authority (NCA) registration of the project and contractor.',
          'Whether units will be issued sectional titles under the Sectional Properties Act, 2020.',
        ],
      },
      {
        heading: '3. Understand the unit you are buying',
        paragraphs: [
          'Off-plan buyers decide from plans, renders and tours, so make sure you know exactly which unit you are getting: its floor, size, orientation and finishes.',
          'Immersive tours, floor plans per unit type and a clear list of what is included (kitchen fittings, wardrobes, parking, storage) all help you compare like with like.',
        ],
      },
      {
        heading: '4. Read the sale agreement with your own advocate',
        paragraphs: [
          'The sale agreement sets out what happens if anything goes wrong, so have an advocate who acts for you — not the developer — review it before you pay more than a booking fee.',
        ],
        list: [
          'The completion date, and what happens if it is missed.',
          'Refund terms if the project is cancelled or delayed beyond a set date.',
          'The specification of finishes, and whether it can change.',
          'Service charge, and who manages the building after handover.',
          'Who pays legal fees and how the title will be transferred.',
        ],
      },
      {
        heading: '5. Agree a payment plan you can keep',
        paragraphs: [
          'Most developers take a deposit followed by instalments, often linked to construction milestones, with the balance on completion. Some offer discounts for paying more up front.',
          'Pay only into the bank account named in the sale agreement — never cash, and never to an individual. Keep every receipt and statement.',
        ],
      },
      {
        heading: '6. Budget for the costs beyond the price',
        list: [
          'Stamp duty on the transfer — 4% of the value in urban areas and 2% in rural areas.',
          'Legal fees for your advocate.',
          'Valuation and registration fees, and mortgage costs if you borrow.',
          'Service charge deposits and utility connections at handover.',
        ],
      },
      {
        heading: '7. Follow the build and take handover carefully',
        paragraphs: [
          'Ask for construction updates as the building goes up. At handover, inspect the unit with a checklist and record any defects in writing before you accept the keys; most agreements include a defects period for the developer to fix them.',
        ],
      },
    ],
    faqs: [
      ['Is buying off-plan cheaper?', 'Usually. Developers often price early units below the expected finished value to fund construction, but the saving comes with the risk of delays.'],
      ['How much deposit is typical?', 'It varies by developer. Deposits followed by instalments over the build are common; the exact split is set in the sale agreement.'],
      ['Do I need a lawyer?', 'You should have your own advocate review the sale agreement and handle the transfer. The developer’s lawyer acts for the developer.'],
    ],
    next: [
      { label: 'Browse off-plan developments', href: '/properties' },
      { label: 'Apartments for sale', href: '/apartments' },
      { label: 'Verified developers', href: '/developers' },
    ],
  },
  {
    slug: 'renting-in-nairobi',
    title: 'Renting in Nairobi: How to Find and Secure a Home',
    description:
      'A practical guide to renting a house or apartment in Nairobi: choosing an area, viewings, deposits, the tenancy agreement and avoiding rental scams.',
    summary: 'Choosing an area, viewing safely, deposits, and what to check in a tenancy agreement.',
    updated: '2026-11-09',
    intro: [
      'Nairobi’s rental market moves quickly, and good homes in popular areas are often let within days. Knowing what to check before you pay makes the search faster and safer.',
    ],
    sections: [
      {
        heading: 'Choose the area first',
        paragraphs: [
          'Your commute, schools and budget decide the area more than any single listing does. Shortlist two or three areas, then compare homes within them.',
        ],
        list: [
          'Travel time to work or school at rush hour, not at midday.',
          'Water supply — ask whether there is a borehole or storage tank.',
          'Backup power, security and parking.',
          'Shops, hospitals and schools within easy reach.',
        ],
      },
      {
        heading: 'View before you pay anything',
        paragraphs: [
          'Never pay a deposit or “viewing fee” for a home you have not seen, or to someone who cannot show you inside. Photos and video tours help you shortlist; the viewing confirms the home is real and available.',
        ],
        list: [
          'Check water pressure, power points, windows and locks.',
          'Look for damp, leaks and cracks.',
          'Ask who manages the building and how repairs are handled.',
          'Meet the landlord or the agent managing the property.',
        ],
      },
      {
        heading: 'Know what you will pay up front',
        paragraphs: [
          'Most landlords ask for the first month’s rent plus a refundable deposit, commonly one or two months’ rent. Some also ask for water or electricity deposits.',
          'Confirm in writing what the deposit covers and when it is returned, and pay through traceable channels such as M-Pesa to a named business or a bank transfer — and keep the receipts.',
        ],
      },
      {
        heading: 'Read the tenancy agreement',
        list: [
          'The rent, when it is due, and how and when it can rise.',
          'The length of the lease and the notice period to leave.',
          'Service charge, water and garbage collection — included or extra.',
          'Who pays for which repairs.',
          'Rules on pets, guests and alterations.',
        ],
      },
      {
        heading: 'Move in with a record',
        paragraphs: [
          'On the day you move in, walk through the home and photograph its condition. Share the photos with the landlord or agent. It is the simplest way to protect your deposit when you leave.',
        ],
      },
    ],
    faqs: [
      ['How much deposit do landlords in Nairobi ask for?', 'Commonly one or two months’ rent as a refundable deposit, plus the first month’s rent, and sometimes utility deposits.'],
      ['How do I avoid rental scams?', 'Never pay before viewing, deal with the landlord or an identifiable agent, and pay through traceable channels to a named account.'],
      ['Should I use an agent?', 'An agent can save time and handle viewings, especially if you are new to the city. Check that they manage the property and agree any fee before you start.'],
    ],
    next: [
      { label: 'Rentals in Nairobi', href: '/rent' },
      { label: 'Apartments to rent', href: '/rent/apartments' },
      { label: 'Area guides', href: '/neighbourhoods' },
    ],
  },
  {
    slug: 'buying-property-in-kenya-from-abroad',
    title: 'Buying Property in Kenya from Abroad: A Guide for the Diaspora',
    description:
      'How Kenyans abroad can buy property at home safely: remote viewings, verifying the developer and title, power of attorney, paying from overseas and the KRA PIN.',
    summary: 'Viewing remotely, verifying from a distance, power of attorney and paying safely from overseas.',
    updated: '2026-11-09',
    intro: [
      'Buying at home from another country is common, and so are the stories of money lost to relatives, middlemen or projects that never finished. The safeguards are the same as buying locally — they just need to be done deliberately, because you cannot drop by the site.',
    ],
    sections: [
      {
        heading: 'See the property without travelling',
        paragraphs: [
          'Use cinematic films, 3D walkthroughs and VR tours to shortlist, then book a live guided tour on a video call so someone walks you through the actual unit or site in real time and answers your questions.',
          'For off-plan projects, ask for regular construction updates with dates, and compare them with the payment milestones in your agreement.',
        ],
      },
      {
        heading: 'Verify independently',
        paragraphs: [
          'Do not rely on the seller or a relative alone to confirm the facts.',
        ],
        list: [
          'Have your own advocate run an official land search and check the approvals.',
          'Check the developer’s completed projects and company details.',
          'Confirm the account you will pay into belongs to the developer or the advocate’s client account.',
        ],
      },
      {
        heading: 'Appoint someone you can rely on',
        paragraphs: [
          'If you cannot be in Kenya to sign, you can appoint someone through a power of attorney. It should be specific to the transaction, prepared by an advocate, and registered so that it is recognised by the Ministry of Lands. Choose the person carefully: a power of attorney lets them act in your name.',
        ],
      },
      {
        heading: 'Pay safely from overseas',
        list: [
          'Pay by bank transfer to the account named in your sale agreement — never to personal accounts or through intermediaries.',
          'Confirm account details by phone with the developer or advocate before each large payment; scammers imitate payment-change emails.',
          'Keep the transfer records; they are your proof of payment and source of funds.',
        ],
      },
      {
        heading: 'Paperwork you will need',
        list: [
          'A valid Kenyan ID or passport.',
          'A KRA PIN — needed to pay stamp duty and register the transfer.',
          'Your signed sale agreement and payment records.',
        ],
      },
    ],
    faqs: [
      ['Can I buy property in Kenya while living abroad?', 'Yes. Many buyers complete the purchase remotely using an advocate, a registered power of attorney where needed, and bank transfers to the account in the sale agreement.'],
      ['Do I need a KRA PIN to buy property?', 'Yes. A KRA PIN is required to pay stamp duty and register the transfer.'],
      ['How can I view a property from abroad?', 'Shortlist with video, 3D and VR tours, then book a live guided tour on a video call to see the actual unit in real time.'],
    ],
    next: [
      { label: 'Developments with 3D and VR tours', href: '/properties' },
      { label: 'Guide to buying off-plan', href: '/guides/buying-off-plan-in-kenya' },
      { label: 'For investors', href: '/for-investors' },
    ],
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);
