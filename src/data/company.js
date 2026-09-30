/**
 * company.js — VERIFIED Magicomeal facts. Single source of truth.
 *
 * ── SOURCING RULE ────────────────────────────────────────────────────────
 * Every value in this file carries a `source` note. Nothing is published on
 * the landing page unless it was read off magicomeal.com on 28 Sep 2026 or
 * supplied directly in the client brief. If you add a value here, add its
 * source too. If you cannot source it, do not add it.
 *
 * Deliberately NOT included (could not be verified — see README):
 *   - "8,000 sq.ft. central kitchen"  → no mention anywhere on magicomeal.com
 *   - "100+ sites served"             → no mention anywhere on magicomeal.com
 *   - "250+ team members"             → the live counter reads
 *                                       "Companies Served Till Date: 250+",
 *                                       NOT team size. Do not re-label it.
 *   - client testimonials             → none published on magicomeal.com
 */

const FOUNDED_YEAR = 2010; // source: magicomeal.com/blog/corporate-catering-mumbai/ — "Since 2010, Magicomeal Caterers have been consistently delivering quality catering services in Mumbai."

module.exports = {
  name: 'Magicomeal',
  tagline: 'We Serve Happiness', // source: logo + brand style guide
  description:
    'Corporate and institutional catering company serving offices, workplaces, schools and institutions in Mumbai.',

  foundedYear: FOUNDED_YEAR,
  // Derived, so it never goes stale. 2010 → 16 years in 2026.
  yearsExperience: new Date().getFullYear() - FOUNDED_YEAR,

  /* --- Headline statistics (all read from the live magicomeal.com counters) --- */
  stats: {
    mealsPerDay: {
      value: '15,000+',
      label: 'Meals Cooked Daily',
      source: 'magicomeal.com homepage counter — "Meals Cooked Per Day: 15,000+"',
    },
    companiesServed: {
      value: '250+',
      label: 'Companies Served',
      source: 'magicomeal.com homepage counter — "Companies Served Till Date: 250+"',
    },
    yearsExperience: {
      value: `${new Date().getFullYear() - FOUNDED_YEAR}+`,
      label: 'Years in Operation',
      source: 'magicomeal.com — "Since 2010"',
    },
    googleRating: {
      value: '4.6',
      label: 'Google Rating',
      source: 'magicomeal.com homepage counter — "Google Rating: 4.6"',
      // Displayed as plain text only. Intentionally NOT emitted as schema.org
      // aggregateRating: Google requires a reviewCount and disallows
      // self-serving first-party ratings in rich results.
      inSchema: false,
    },
  },

  /* --- Certifications --- */
  certifications: [
    {
      short: 'ISO 22000:2018',
      full: 'ISO 22000:2018 Food Safety Management System',
      source: 'magicomeal.com homepage',
    },
    {
      short: 'HACCP',
      full: 'HACCP food safety protocols',
      source: 'magicomeal.com homepage',
    },
    {
      short: 'FSSAI',
      full: 'FSSAI compliant kitchen and approved vendors',
      source: 'magicomeal.com homepage + corporate catering page',
    },
  ],

  /* --- Contact (verified on magicomeal.com/contact-us/) --- */
  contact: {
    phone: '+919320022422',
    phoneDisplay: '+91 93200 22422',
    whatsapp: '919320022422', // same line; confirm WhatsApp is active before launch
    email: 'sales@magicomeal.com',
    address: {
      street: '44D, Ahuja Silk Mills Compound, Safed Pool, Saki Naka, Behind Hotel Seven Olives',
      locality: 'Andheri East',
      region: 'Maharashtra',
      city: 'Mumbai',
      postalCode: '400072',
      country: 'IN',
      countryName: 'India',
    },
    hours: 'Mon–Sat, 9:00 am – 7:00 pm', // office hours for the sales desk
  },

  social: [
    'https://in.linkedin.com/company/magic-o-meal',
    'https://www.facebook.com/magicomeal',
    'https://www.instagram.com/magicomeal',
  ],

  /* --- Service geography (per client brief; Mumbai confirmed on site) --- */
  serviceAreas: [
    { name: 'Mumbai', note: 'Confirmed on magicomeal.com' },
    { name: 'Navi Mumbai', note: 'Per client brief — confirm before launch' },
    { name: 'Thane', note: 'Per client brief — confirm before launch' },
  ],

  /* --- Verified client logos (image files downloaded from magicomeal.com) --- */
  clientLogos: [
    { name: 'ICICI Bank', file: 'client-icici-bank.jpg' },
    { name: 'ICICI Prudential Life Insurance', file: 'client-icici-prudential.jpg' },
    { name: 'SBI Life', file: 'client-sbi-life.jpg' },
    { name: 'Aditya Birla Group', file: 'client-aditya-birla-group.jpg' },
    { name: 'Gartner', file: 'client-gartner.jpg' },
    { name: 'Lodha', file: 'client-lodha.jpg' },
    { name: 'NDTV', file: 'client-ndtv.jpg' },
    { name: 'Trilegal', file: 'client-trilegal.jpg' },
    { name: 'Nuvama', file: 'client-nuvama.jpg' },
    { name: 'Hettich', file: 'client-hettich.jpg' },
    { name: 'Blenheim Chalcot', file: 'client-blenheim-chalcot.jpg' },
    { name: 'CCIL', file: 'client-ccil.jpg' },
    { name: 'Axxela', file: 'client-axxela.jpg' },
    { name: 'SHM', file: 'client-shm.jpg' },
  ],

  /* --- Additional named clients listed on magicomeal.com/clients/ --- */
  otherClients: {
    corporate: [
      'Tata Communications',
      'Tata Power',
      'Tata Projects',
      'ITC',
      'L&T',
      'Vedanta',
      'Hindustan Zinc',
      'Piramal',
      'Axis Bank',
      'Kotak Mahindra Bank',
      'Bank of Baroda',
      'Canon',
      'Zomato',
      'Times of India',
      'Radio Mirchi',
      "Nature's Basket",
      'Intertek',
      'Sealed Air',
      'upGrad',
    ],
    institutions: [
      'IIT Powai',
      'JBCN International School',
      'Podar School',
      'Ecole Mondiale',
      'Orchids International School',
      'Billabong High',
      'Fazlani International School',
      'Youthville',
    ],
  },

  /* --- Food safety practices, verbatim from magicomeal.com --- */
  hygieneStandards: [
    'Prevention of cross contamination',
    'Proper storage and transportation',
    'Cleaning and sanitation schedules',
    'Staff training and awareness',
    'Regular water and food lab tests',
    'Weekly pest control',
    'Personal hygiene monitoring',
    'Time and temperature control',
  ],
};
