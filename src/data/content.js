/**
 * content.js — All page copy, in one place.
 *
 * Edit here, run `npm run build`, redeploy. No component surgery required.
 * Facts (numbers, certifications, clients, contact) live in ./company.js so
 * they can never drift between the visible page and the JSON-LD.
 */

const company = require('./company');

const AREAS = company.serviceAreas.map((a) => a.name); // ['Mumbai','Navi Mumbai','Thane']
const AREAS_PROSE = 'Mumbai, Navi Mumbai and Thane';

module.exports = {
  /* ================================================================== *
   * META
   * ================================================================== */
  meta: {
    title: 'Corporate Catering Services in Mumbai | Magicomeal',
    // Kept under ~155 characters so Google does not truncate it in the SERP.
    description:
      'Magicomeal provides corporate catering, office meals and cafeteria management for workplaces across Mumbai, Navi Mumbai & Thane. Request a proposal.',
    ogTitle: 'Corporate Catering Services in Mumbai | Magicomeal',
    ogDescription:
      'Corporate catering, cafeteria management and daily office meals for workplaces and institutions across Mumbai, Navi Mumbai and Thane. 18,000+ meals served daily.',
    ogImage: '/assets/img/magicomeal-corporate-catering-mumbai-og.webp',
  },

  /* ================================================================== *
   * HEADER
   * ================================================================== */
  header: {
    logoAlt: 'Magicomeal — corporate catering company in Mumbai',
    callLabel: 'Call',
    cta: 'Get a Proposal',
  },

  /* ================================================================== *
   * HERO — three headline variants, one renders (set in config.js)
   * ================================================================== */
  hero: {
    eyebrow: `Corporate Catering · ${AREAS.join(' · ')}`,
    variants: {
      A: {
        h1: 'Corporate catering that keeps your team well fed',
        highlight: 'well fed',
      },
      B: {
        h1: '18,000+ meals served daily. Corporate catering you can rely on.',
        highlight: '18,000+ meals served daily.',
      },
      C: {
        h1: 'Your workplace deserves better catering',
        highlight: 'better catering',
      },
    },
    sub: `Reliable daily meals, cafeteria management and corporate catering for workplaces and institutions across ${AREAS_PROSE}.`,
    ctaPrimary: 'Get a Corporate Catering Proposal',
    ctaSecondary: 'Talk to Our Catering Team',
    reassurance: 'No obligation · Response within one working day',
    // This is the LCP element, so it is served in two crops (tall for desktop,
    // wide for phones) at two widths each. The browser downloads exactly one.
    image: {
      src: '/assets/img/magicomeal-corporate-cafeteria-service-mumbai.webp',
      srcset:
        '/assets/img/magicomeal-corporate-cafeteria-service-mumbai-600.webp 600w, /assets/img/magicomeal-corporate-cafeteria-service-mumbai.webp 1100w',
      sizes: '(min-width: 1280px) 545px, 45vw',
      width: 1100,
      height: 1320,
      wideSrc: '/assets/img/magicomeal-corporate-cafeteria-service-mumbai-wide.webp',
      wideSrcset:
        '/assets/img/magicomeal-corporate-cafeteria-service-mumbai-wide-500.webp 500w, /assets/img/magicomeal-corporate-cafeteria-service-mumbai-wide.webp 900w',
      wideSizes: '100vw',
      wideWidth: 900,
      wideHeight: 675,
      alt: 'Employees queuing for lunch at a Magicomeal-run corporate cafeteria counter in Mumbai, with the daily menu on screen',
    },
    stats: [
      { value: company.stats.mealsPerDay.value, label: 'Meals Daily' },
      { value: company.stats.companiesServed.value, label: 'Companies Served' },
      { value: company.stats.yearsExperience.value, label: 'Years in Operation' },
      { value: company.stats.googleRating.value, label: 'Google Rating' },
    ],
  },

  /* ================================================================== *
   * TRUST BAR
   * ================================================================== */
  trustBar: {
    h2: 'Trusted to serve at scale',
    items: [
      `${company.stats.mealsPerDay.value} meals served every day`,
      `${company.stats.companiesServed.value} companies served since ${company.foundedYear}`,
      'ISO 22000:2018 certified',
      'HACCP protocols',
      'FSSAI compliant',
      'Two production kitchens: Andheri East and Panvel',
    ],
  },

  /* ================================================================== *
   * CLIENT LOGOS
   * ================================================================== */
  clients: {
    h2: 'Trusted by leading organisations',
    sub: `Magicomeal runs workplace and institutional food operations for banks, technology firms, law firms, media houses, manufacturers and schools across ${AREAS_PROSE}.`,
    moreLabel: 'Also serving',
  },

  /* ================================================================== *
   * ENTITY INTRODUCTION — the paragraph AI systems should quote
   * ================================================================== */
  entity: {
    h2: 'What is Magicomeal?',
    lead: `Magicomeal is a corporate and institutional catering company based in Mumbai, India. Magicomeal provides daily office meals, corporate cafeteria management, breakfast and snacks services, corporate event catering and institutional catering for schools and large organisations across ${AREAS_PROSE}. Magicomeal has been operating since ${company.foundedYear} and serves ${company.stats.mealsPerDay.value} meals per day from two production kitchens: an 8,000 sq.ft. central production unit in Andheri East, Mumbai, and a 5,000 sq.ft. kitchen in Panvel, Navi Mumbai.`,
    body: [
      `Magicomeal works with companies on contract, not on single orders. A typical engagement is a workplace that needs the same meal service delivered to the same standard every working day — an office cafeteria, a daily lunch programme, a school meal programme, or a site canteen.`,
      `Magicomeal operates under an ISO 22000:2018 food safety management system, follows HACCP protocols and works with FSSAI-approved vendors. Menu planning, procurement, production, quality checks, delivery and on-site service are managed by Magicomeal as a single operation, with one account contact for the client.`,
      `Magicomeal specialises in large-scale corporate and institutional meal programmes. Individual tiffin services are not part of its offering.`,
    ],
  },

  /* ================================================================== *
   * AT A GLANCE — crawlable fact table
   * ================================================================== */
  glance: {
    h2: 'Magicomeal at a glance',
    // Company / Industry / Head office were removed at the client's request.
    // Those three facts still reach crawlers and LLMs via the entity paragraph
    // directly above this table and via the Organization JSON-LD, so dropping
    // the rows costs nothing in entity clarity.
    rows: [
      { k: 'Service areas', v: AREAS_PROSE },
      { k: 'Operating since', v: String(company.foundedYear) },
      { k: 'Meals served daily', v: company.stats.mealsPerDay.value },
      { k: 'Companies served', v: company.stats.companiesServed.value },
      {
        k: 'Production kitchens',
        v: company.kitchens.map((x) => `${x.city} (${x.areaLabel})`).join('; '),
      },
      { k: 'Food safety certification', v: 'ISO 22000:2018' },
      { k: 'Food safety protocols', v: 'HACCP' },
      { k: 'Licensing', v: 'FSSAI compliant' },
      {
        k: 'Core services',
        v: 'Corporate catering, corporate cafeteria management, daily office meals, corporate event catering, institutional catering',
      },
      { k: 'Serves', v: 'Offices, workplaces, corporate campuses, schools, institutions' },
    ],
  },

  /* ================================================================== *
   * SERVICES — one H2 block each (Phase 13)
   * ================================================================== */
  services: {
    h2: 'Corporate catering services',
    intro:
      'Five service lines, run by one team, under one contract. Most clients start with one and add others as the site grows.',
    items: [
      {
        id: 'corporate-catering',
        slug: 'corporate-catering',
        h3: 'Corporate catering',
        summary:
          'Magicomeal provides contract corporate catering for offices and workplaces in Mumbai, Navi Mumbai and Thane.',
        forWho: 'Offices of 50 to 1,000+ people that need a food partner rather than a food vendor.',
        body: [
          'Magicomeal takes on the full food operation for a workplace: menu planning, procurement, production in its own kitchens, quality checks, delivery and service at your site.',
          'Service is contracted and scheduled, so headcount, menu cycles and costs are agreed in advance rather than negotiated order by order.',
        ],
        points: [
          'Rotating menu cycles agreed with the client',
          'Vegetarian, vegan, Jain and other dietary requirements',
          'Dietician input available on request',
          'Single account contact for the site',
        ],
        image: {
          src: '/assets/img/magicomeal-corporate-catering-counter-service-mumbai.webp',
          alt: 'Magicomeal service staff plating meals at a corporate office catering counter in Mumbai',
          width: 1100,
          height: 825,
        },
      },
      {
        id: 'cafeteria-management',
        slug: 'corporate-cafeteria-management',
        h3: 'Corporate cafeteria management',
        summary:
          'Magicomeal manages corporate cafeterias and canteens end to end, including on-site staff and daily operations.',
        forWho: 'Facility, admin and workplace teams who currently manage a cafeteria themselves.',
        body: [
          'Magicomeal runs the cafeteria as an operation: menu management, food production, counter service, hygiene routines, stock and daily reporting.',
          'Trained service staff work on site in uniform. Cleaning, sanitation and temperature control follow documented schedules rather than ad-hoc effort.',
        ],
        points: [
          'Menu management and daily menu display',
          'Food production and counter service',
          'Documented hygiene and sanitation schedules',
          'On-site trained service team',
          'Day-to-day account management',
        ],
        image: {
          src: '/assets/img/magicomeal-cafeteria-management-kitchen-mumbai.webp',
          alt: 'Magicomeal kitchen team cooking the daily menu in bulk at a managed corporate cafeteria kitchen in Mumbai',
          width: 1100,
          height: 825,
        },
      },
      {
        id: 'office-meals',
        slug: 'daily-office-meals',
        h3: 'Daily office meals',
        summary:
          'Magicomeal provides daily breakfast, lunch and snacks for office teams, delivered to a fixed schedule.',
        forWho: 'Offices without a full cafeteria that still need a dependable daily meal service.',
        body: [
          'Meals are planned against a confirmed headcount and delivered at agreed times each working day. Packed meal boxes are available where a counter service is not practical.',
          'Menu cycles are set in advance so employees know what is coming and procurement stays predictable.',
        ],
        points: [
          'Breakfast, lunch, evening snacks',
          'Packed corporate meal boxes',
          'Headcount-based planning and forecasting',
          'Eco-friendly packaging available on request',
        ],
        image: {
          src: '/assets/img/magicomeal-office-breakfast-idli-chutney-mumbai.webp',
          alt: 'Magicomeal office breakfast of plain, spinach and carrot idli served with coconut and tomato chutney',
          width: 1100,
          height: 825,
        },
      },
      {
        id: 'event-catering',
        slug: 'corporate-event-catering',
        h3: 'Corporate event catering',
        summary:
          'Magicomeal caters corporate meetings, conferences, annual functions and workplace celebrations in Mumbai.',
        forWho: 'HR, admin and marketing teams running internal or client-facing events.',
        body: [
          'Magicomeal provides on-site catering for corporate events, including service staff and equipment for the setup.',
          'Menus are built around the event — a board lunch, a townhall, an annual day or a festival celebration — rather than pulled from a fixed package.',
        ],
        points: [
          'Meetings, conferences and townhalls',
          'Annual functions and festival celebrations',
          'On-site staff and equipment provided',
          'Event-specific customised menus',
        ],
        image: {
          src: '/assets/img/magicomeal-corporate-event-buffet-mumbai.webp',
          alt: 'Labelled buffet counter with tawa paratha, curries and tossed salad set up by Magicomeal for a corporate event in Mumbai',
          width: 1100,
          height: 825,
        },
      },
      {
        id: 'institutional-catering',
        slug: 'institutional-catering',
        h3: 'Institutional catering',
        summary:
          'Magicomeal runs daily meal programmes for schools, hostels and other institutions in Mumbai.',
        forWho: 'School administrators, hostel wardens and institutional facility heads.',
        body: [
          'Magicomeal operates school and hostel cafeterias on the same contract model used for corporate sites, with age-appropriate menus and the same food safety controls.',
          'Institutional clients include IIT Powai, JBCN International School, Podar School, Ecole Mondiale and Billabong High.',
        ],
        points: [
          'School and hostel cafeterias',
          'Daily meal programmes at scale',
          'Age-appropriate, nutrition-led menus',
          'Same ISO 22000 food safety system as corporate sites',
        ],
        image: {
          src: '/assets/img/magicomeal-school-catering-students-mumbai.webp',
          alt: 'School students eating a Magicomeal lunch from compartment trays in their school cafeteria in Mumbai',
          width: 1100,
          height: 825,
        },
      },
    ],
  },

  /* ================================================================== *
   * PAIN POINTS
   * ================================================================== */
  pains: {
    h2: "Corporate catering shouldn't become another problem for your team",
    sub: 'The five things that go wrong with workplace food, and how a contracted operation handles them.',
    items: [
      {
        title: 'Consistent quality',
        body: 'Most caterers are good in month one and drift by month four. Magicomeal cooks to standardised recipes in its own production kitchens, so the same dish tastes the same in week 1 and week 100.',
      },
      {
        title: 'Reliable operations',
        body: 'Meals arrive on a schedule, not on a promise. Production, dispatch and on-site service run to fixed timings agreed with your site, with a named account contact when something needs changing.',
      },
      {
        title: 'Food safety',
        body: 'Food safety is documented, not assumed. ISO 22000:2018, HACCP protocols, FSSAI-approved vendors, weekly pest control, and regular water and food lab tests.',
      },
      {
        title: 'Menu variety',
        body: 'Fixed menus kill cafeteria usage. Magicomeal runs rotating menu cycles with regional Indian options, and accommodates vegetarian, vegan, Jain and gluten-free requirements.',
      },
      {
        title: 'Vendor management',
        body: 'One contract instead of five. Breakfast, lunch, snacks, cafeteria staffing and event catering come from the same team, with one invoice and one point of escalation.',
      },
    ],
  },

  /* ================================================================== *
   * WHY MAGICOMEAL — complete programme
   * ================================================================== */
  why: {
    h2: 'One catering partner. Your complete workplace food programme.',
    sub: 'Add service lines as your site grows, without changing supplier.',
    items: [
      { title: 'Daily corporate meals', body: 'Breakfast, lunch and evening snacks on a fixed daily schedule.' },
      { title: 'Corporate cafeteria management', body: 'Full cafeteria operation with on-site trained staff.' },
      { title: 'Breakfast & snacks', body: 'Morning and evening service for offices and shift teams.' },
      { title: 'Corporate events', body: 'Meetings, townhalls, annual functions and celebrations.' },
      { title: 'Employee meal programmes', body: 'Subsidised or fully-funded meal plans, planned against headcount.' },
      { title: 'Institutional catering', body: 'School and hostel cafeterias with age-appropriate menus.' },
    ],
  },

  /* ================================================================== *
   * SCALE
   * ================================================================== */
  scale: {
    h2: 'Built for high-volume corporate catering',
    stats: [
      { value: company.stats.mealsPerDay.value, label: 'Meals served daily' },
      { value: company.stats.companiesServed.value, label: 'Companies served' },
      { value: company.stats.yearsExperience.value, label: 'Years in operation' },
      { value: `Since ${company.foundedYear}`, label: 'Operating in Mumbai' },
    ],
    body: 'From menu planning and procurement through production, quality control, delivery and on-site service, Magicomeal manages the catering operation as a single process. Volume is handled from two owned production kitchens totalling 13,000 sq.ft., which is what makes the same standard repeatable across 250+ companies.',
    image: {
      src: '/assets/img/magicomeal-catering-team-site-mumbai.webp',
      alt: 'The full Magicomeal service and management team on site at a corporate cafeteria in Mumbai',
      width: 1240,
      height: 827,
    },
  },

  /* ================================================================== *
   * KITCHENS
   * ================================================================== */
  kitchens: {
    h2: 'Two production kitchens of our own',
    sub: `Magicomeal cooks in kitchens it owns and runs — not in rented or shared space. ${company.kitchenTotalSqFt.toLocaleString(
      'en-IN'
    )} sq.ft. of production capacity across Mumbai and Navi Mumbai.`,
    items: company.kitchens,
    footnote:
      'Owning the kitchens is what makes the volume and the consistency possible: the same recipes, the same controls and the same team standards behind every site we serve.',
    image: {
      src: '/assets/img/magicomeal-central-kitchen-mumbai.webp',
      alt: 'Magicomeal central production kitchen in Andheri East, Mumbai, with stainless steel work stations and extraction hoods',
      width: 640,
      height: 640,
    },
  },

  /* ================================================================== *
   * FOOD SAFETY
   * ================================================================== */
  safety: {
    h2: 'Great food. Strong processes. Every day.',
    sub: 'Magicomeal operates under an ISO 22000:2018 food safety management system and follows HACCP protocols. These are the controls that run daily.',
    // A 2x2 grid of Magicomeal's own kitchen rather than one stock collage —
    // the segregated veg section, the hand-wash signage and the staff briefing
    // are the evidence a facilities manager is actually looking for.
    images: [
      {
        src: '/assets/img/magicomeal-central-kitchen-mumbai.webp',
        alt: 'Magicomeal central production kitchen in Mumbai with stainless steel work stations and extraction hoods',
      },
      {
        src: '/assets/img/magicomeal-veg-section-cooking-mumbai.webp',
        alt: 'Magicomeal chef in a hairnet cooking in the dedicated vegetarian section beneath hand-washing signage',
      },
      {
        src: '/assets/img/magicomeal-kitchen-production-chefs-mumbai.webp',
        alt: 'Magicomeal chefs in uniform and gloves cooking and plating on the production line',
      },
      {
        src: '/assets/img/magicomeal-staff-briefing-training-mumbai.webp',
        alt: 'Magicomeal site team in a daily briefing and food safety training session',
      },
    ],
    pillars: company.hygieneStandards,
    certLine: 'ISO 22000:2018 · HACCP protocols · FSSAI compliant · FSSAI-approved vendors',
  },

  /* ================================================================== *
   * MENU
   * ================================================================== */
  menu: {
    h2: 'Menus your team will actually eat',
    sub: 'Rotating menu cycles built with the client. Dietary requirements are planned in, not worked around.',
    // One lead photo plus two supporting frames — festival menus are a real
    // service line, so they earn their place next to the category list.
    images: [
      {
        src: '/assets/img/magicomeal-onam-sadya-corporate-dining-mumbai.webp',
        alt: 'Magicomeal staff serving an Onam sadya on banana leaves to employees in a corporate dining hall in Mumbai',
        width: 900,
        height: 900,
      },
      {
        src: '/assets/img/magicomeal-festival-menu-spread-mumbai.webp',
        alt: 'Magicomeal Onam festival menu laid out on a banana leaf with avial, sambar, rice, payasam and papad',
        width: 560,
        height: 420,
      },
      {
        src: '/assets/img/magicomeal-corporate-buffet-counter-mumbai.webp',
        alt: 'Employees serving themselves from a decorated Magicomeal festival buffet counter at their office',
        width: 560,
        height: 420,
      },
    ],
    categories: [
      'Indian meals',
      'Regional cuisine',
      'Breakfast',
      'Evening snacks',
      'Healthy options',
      'Jain options',
      'Vegan options',
      'Gluten-free options',
      'Packed meal boxes',
      'Corporate event menus',
      'Festival and special menus',
      'Dietician-designed menus on request',
    ],
  },

  /* ================================================================== *
   * PROOF (no fabricated testimonials — evidence instead)
   * ================================================================== */
  proof: {
    h2: 'The proof is in the contracts',
    sub: 'Magicomeal does not publish client testimonials. These are the verifiable facts instead.',
    note: 'Named client references are available on request during the proposal stage.',
    items: [
      {
        stat: company.stats.companiesServed.value,
        title: 'Companies served since 2010',
        body: 'Including ICICI Bank, SBI Life, Aditya Birla Group, Gartner, Lodha, NDTV, Trilegal and Tata Communications.',
      },
      {
        stat: company.stats.mealsPerDay.value,
        title: 'Meals served every day',
        body: 'Sustained daily volume across corporate, institutional and school sites in Mumbai.',
      },
      {
        stat: company.stats.googleRating.value,
        title: 'Google rating',
        body: 'Published rating on the Magicomeal Google Business Profile.',
      },
      {
        stat: 'ISO 22000',
        title: 'Certified food safety system',
        body: 'ISO 22000:2018, HACCP protocols and FSSAI compliance, audited rather than self-declared.',
      },
    ],
  },

  /* ================================================================== *
   * SERVICE AREAS
   * ================================================================== */
  areas: {
    h2: `Corporate catering across ${AREAS_PROSE}`,
    body: [
      `Magicomeal serves corporate offices, business parks, institutions and schools across ${AREAS_PROSE}. Production runs from two kitchens — Saki Naka, Andheri East for Mumbai, and Panvel for Navi Mumbai and the surrounding region — with delivery and on-site service teams dispatched to client sites.`,
      'Service areas include the major Mumbai business districts and the surrounding metropolitan region. If your office sits outside these areas, tell us the location in the form and we will confirm whether we can serve it.',
    ],
    list: AREAS,
  },

  /* ================================================================== *
   * HOW IT WORKS
   * ================================================================== */
  how: {
    h2: 'Getting started is simple',
    steps: [
      {
        n: '01',
        title: 'Tell us about your requirement',
        body: 'Share your location, approximate headcount and what you need served. One form, seven fields.',
      },
      {
        n: '02',
        title: 'We understand your workplace',
        body: 'Our catering team calls you to understand your site, timings, existing setup and dietary mix.',
      },
      {
        n: '03',
        title: 'Get your proposal',
        body: 'You receive a written proposal with a sample menu cycle, service model and pricing.',
      },
      {
        n: '04',
        title: 'Start serving',
        body: 'We mobilise the kitchen and on-site team, run a trial service, then move to the agreed daily schedule.',
      },
    ],
  },

  /* ================================================================== *
   * FORM
   * ================================================================== */
  form: {
    h2: "Let's plan your corporate catering",
    sub: 'Tell us a few details and our catering team will get back to you within one working day.',
    scopeNote:
      'Magicomeal serves large-scale corporate and institutional meal programmes. Individual tiffin services are not part of our offering.',
    submit: 'Get My Catering Proposal',
    submitting: 'Sending…',
    privacy: 'We use your details only to prepare and discuss your catering proposal.',
    fields: {
      name: { label: 'Your name', placeholder: 'Priya Sharma' },
      company: { label: 'Company name', placeholder: 'Acme Technologies Pvt Ltd' },
      email: { label: 'Work email', placeholder: 'priya@company.com' },
      phone: { label: 'Phone number', placeholder: '98765 43210' },
      location: { label: 'Office location', placeholder: 'e.g. BKC, Powai, Airoli, Thane West' },
      meals: { label: 'Approximate meals per day' },
      requirement: { label: 'What do you need?' },
      message: { label: 'Anything else? (optional)', placeholder: 'Timings, existing setup, dietary mix, start date…' },
    },
    mealOptions: ['50–99', '100–249', '250–499', '500–999', '1,000+', 'Not sure yet'],
    // NOTE: server.js keeps its own copy of this list for server-side
    // validation. Change both together or valid submissions get rejected.
    requirementOptions: ['Daily corporate meals', 'One-time catering'],
    success: {
      h3: "Thank you — we've received your requirement.",
      body: 'Our catering team will contact you shortly, usually within one working day.',
      callLabel: 'Call the catering team',
      whatsappLabel: 'WhatsApp the catering team',
      whatsappText:
        "Hi Magicomeal, I've just submitted a corporate catering enquiry on your website and would like to discuss it.",
    },
    errors: {
      generic: 'Something went wrong. Please call us on {phone} and we will take your details directly.',
      required: 'This field is required.',
      email: 'Enter a valid work email address.',
      phone: 'Enter a valid 10-digit Indian mobile number.',
      select: 'Please choose an option.',
    },
  },

  /* ================================================================== *
   * FAQ — answer-first, each answer standalone
   * ================================================================== */
  faq: {
    h2: 'Corporate catering in Mumbai: common questions',
    items: [
      {
        short: true,
        q: 'What does Magicomeal provide?',
        a: `Magicomeal provides corporate catering, corporate cafeteria management, daily office meals, corporate event catering and institutional catering. Magicomeal is a contract caterer for offices, workplaces, schools and institutions, and serves ${company.stats.mealsPerDay.value} meals per day from two production kitchens in Andheri East, Mumbai and Panvel, Navi Mumbai.`,
      },
      {
        q: 'Does Magicomeal provide corporate catering in Mumbai?',
        a: `Yes. Magicomeal provides corporate catering across Mumbai and has been operating in the city since ${company.foundedYear}. Corporate clients include ICICI Bank, SBI Life, Aditya Birla Group, Gartner, Lodha, NDTV and Trilegal. Magicomeal also serves Navi Mumbai and Thane.`,
      },
      {
        q: 'Does Magicomeal provide daily office meals?',
        a: 'Yes. Magicomeal provides daily breakfast, lunch and evening snacks for office teams on a fixed schedule. Meals are planned against a confirmed headcount, and packed corporate meal boxes are available where counter service is not practical.',
      },
      {
        q: 'Does Magicomeal manage corporate cafeterias?',
        a: 'Yes. Magicomeal manages corporate cafeterias and canteens end to end, covering menu management, food production, counter service, hygiene and sanitation schedules, stock and daily operations. Trained Magicomeal service staff work on site in uniform.',
      },
      {
        short: true,
        q: 'Which locations does Magicomeal serve?',
        a: `Magicomeal serves corporate and institutional clients across ${AREAS_PROSE}. Production runs from an 8,000 sq.ft. central production unit at Saki Naka, Andheri East, Mumbai 400072 and a 5,000 sq.ft. kitchen in Panvel, with delivery and on-site service teams sent to client sites.`,
      },
      {
        short: true,
        q: 'Can corporate menus be customised?',
        a: 'Yes. Menu cycles are built with the client rather than picked from a fixed list. Magicomeal accommodates vegetarian, vegan, Jain and gluten-free requirements, offers regional Indian cuisines, and can provide dietician input on menu design on request.',
      },
      {
        q: 'Does Magicomeal provide institutional and school catering?',
        a: 'Yes. Magicomeal runs daily meal programmes and cafeterias for schools, hostels and institutions. Institutional clients include IIT Powai, JBCN International School, Podar School, Ecole Mondiale and Billabong High.',
      },
      {
        q: 'What food safety standards does Magicomeal follow?',
        a: 'Magicomeal operates under an ISO 22000:2018 food safety management system, follows HACCP protocols and is FSSAI compliant, working with FSSAI-approved vendors. Daily controls include time and temperature control, prevention of cross contamination, cleaning and sanitation schedules, weekly pest control, and regular water and food lab testing.',
      },
      {
        short: true,
        q: 'What is the minimum order quantity for corporate catering?',
        a: 'Magicomeal does not publish a fixed minimum. The minimum order depends on the site, location and service model, and is confirmed during the proposal stage. Magicomeal focuses on large-scale corporate and institutional meal programmes and does not offer individual tiffin services.',
      },
      {
        short: true,
        q: 'How can a company request a corporate catering proposal?',
        a: `Complete the enquiry form on this page with your company name, office location, approximate meals per day and requirement, or call ${company.contact.phoneDisplay}. The Magicomeal catering team responds within one working day with a written proposal covering a sample menu cycle, service model and pricing.`,
      },
    ],
  },

  /* ================================================================== *
   * FINAL CTA
   * ================================================================== */
  finalCta: {
    h2: 'Ready to upgrade your workplace catering?',
    body: 'Tell us your location, team size and catering requirement. Our team will help you plan the right catering solution.',
    ctaPrimary: 'Get a Corporate Catering Proposal',
    ctaSecondary: 'Talk to Our Catering Team',
  },

  /* ================================================================== *
   * FOOTER
   * ================================================================== */
  footer: {
    descriptor: 'Corporate & Institutional Catering',
    areas: AREAS.join(' · '),
    links: [
      { label: 'Privacy Policy', href: 'https://magicomeal.com/privacy-policy/' },
      { label: 'Terms', href: 'https://magicomeal.com/terms/' },
      { label: 'Main website', href: 'https://magicomeal.com/' },
    ],
  },

  /* ================================================================== *
   * SHORT-PAGE BLOCKS
   *
   * Used by the lead-gen layout. They compress the long sections rather
   * than replacing their content: the service names, the scale numbers, the
   * kitchens and the certifications all still appear, just without five
   * full-width image rows between the visitor and the form.
   * ================================================================== */

  // Replaces: services + pains + why
  servicesCompact: {
    h2: 'One partner for your whole workplace food programme',
    // Kept deliberately factual and self-contained: this short paragraph is
    // what AI search engines quote when asked who Magicomeal is.
    intro: `Magicomeal is a corporate and institutional catering company in Mumbai. It runs daily meal services, cafeteria operations and event catering for offices, schools and institutions across ${AREAS_PROSE}, serving ${company.stats.mealsPerDay.value} meals a day.`,
    items: [
      {
        title: 'Daily corporate meals',
        body: 'Breakfast, lunch and evening snacks on a fixed schedule, planned against your headcount.',
      },
      {
        title: 'Corporate cafeteria management',
        body: 'We run the cafeteria end to end — menu, production, counter service, hygiene, on-site staff.',
      },
      {
        title: 'Corporate event catering',
        body: 'Meetings, townhalls, annual functions and festivals, with service staff and equipment on site.',
      },
      {
        title: 'Institutional catering',
        body: 'School and hostel cafeterias with age-appropriate menus and the same food safety controls.',
      },
      {
        title: 'Customised menus',
        body: 'Rotating menu cycles with regional Indian options. Vegetarian, vegan, Jain and gluten-free planned in.',
      },
      {
        title: 'One contract, one contact',
        body: 'Every service line from the same team, with one invoice and one named person to escalate to.',
      },
    ],
  },

  // Replaces: scale + kitchens + safety + proof
  proofStrip: {
    h2: 'Why workplaces stay with us',
    stats: [
      { value: company.stats.mealsPerDay.value, label: 'Meals served daily' },
      { value: company.stats.companiesServed.value, label: 'Companies served' },
      { value: company.stats.yearsExperience.value, label: 'Years in operation' },
      { value: company.stats.googleRating.value, label: 'Google rating' },
    ],
    points: [
      {
        title: 'Two kitchens of our own',
        body: `An ${company.kitchens[0].areaLabel} central production unit in ${company.kitchens[0].city} and a ${company.kitchens[1].areaLabel} kitchen in ${company.kitchens[1].city} — ${company.kitchenTotalSqFt.toLocaleString(
          'en-IN'
        )} sq.ft. in total, owned and run by us.`,
      },
      {
        title: 'Certified food safety',
        body: 'ISO 22000:2018 and HACCP protocols, FSSAI compliant, with time and temperature control, weekly pest control and regular water and food lab testing.',
      },
      {
        title: 'Consistency that holds',
        body: 'Standardised recipes cooked in our own kitchens, so the same dish tastes the same in week 1 and week 100 — the month-four drop-off simply does not happen.',
      },
    ],
    clientLine:
      'Trusted by ICICI Bank, SBI Life, Aditya Birla Group, Gartner, Lodha, NDTV, Trilegal and Tata Communications, and by IIT Powai, JBCN International School, Podar School and Ecole Mondiale.',
    image: {
      src: '/assets/img/magicomeal-corporate-catering-counter-service-mumbai.webp',
      alt: 'Magicomeal service staff plating meals at a corporate office catering counter in Mumbai',
      width: 1100,
      height: 825,
    },
  },

  /* ================================================================== *
   * GALLERY
   *
   * Real sites, real service, real diners. On a lead-gen page this does the
   * job testimonials would — Magicomeal publishes none, so photographs of
   * actual client sites are the honest substitute.
   * ================================================================== */
  gallery: {
    h2: 'Magicomeal on site',
    sub: 'Corporate cafeterias, school lunches, festival service and our own kitchens — photographed at live client sites across Mumbai.',
    items: [
      {
        src: '/assets/img/gallery/magicomeal-corporate-cafeteria-lunch-rush-mumbai.webp',
        alt: 'Lunch rush at a Magicomeal-run corporate cafeteria in Mumbai, with staff serving a full dining hall',
      },
      {
        src: '/assets/img/gallery/magicomeal-school-cafeteria-independence-day-mumbai.webp',
        alt: 'Magicomeal serving an Independence Day menu to students at a school cafeteria in Mumbai',
      },
      {
        src: '/assets/img/gallery/magicomeal-school-lunch-student-mumbai.webp',
        alt: 'A student giving a thumbs up over a Magicomeal school lunch tray',
      },
      {
        src: '/assets/img/gallery/magicomeal-parent-child-school-meal-mumbai.webp',
        alt: 'A parent and child sharing a Magicomeal school meal tray at a Mumbai school',
      },
      {
        src: '/assets/img/gallery/magicomeal-service-team-jbcn-school-mumbai.webp',
        alt: 'Magicomeal service team in uniform at JBCN International School on Independence Day',
      },
      {
        src: '/assets/img/gallery/magicomeal-festival-catering-team-mumbai.webp',
        alt: 'Magicomeal staff in festival dress behind a chafing dish counter at a corporate office',
      },
      {
        src: '/assets/img/gallery/magicomeal-onam-sadya-service-mumbai.webp',
        alt: 'Magicomeal serving an Onam sadya on banana leaves in a corporate dining hall',
      },
      {
        src: '/assets/img/gallery/magicomeal-outdoor-event-catering-mumbai.webp',
        alt: 'Magicomeal staff serving an outdoor event at a school in Mumbai',
      },
      {
        src: '/assets/img/gallery/magicomeal-event-canapes-mumbai.webp',
        alt: 'Spanish corn tart canapes labelled and plated by Magicomeal for a corporate event',
      },
      {
        src: '/assets/img/gallery/magicomeal-event-salad-buffet-mumbai.webp',
        alt: 'Magicomeal event buffet with vegetable crudites, som tum salad and paneer kadhai',
      },
      {
        src: '/assets/img/gallery/magicomeal-bulk-cooking-equipment-mumbai.webp',
        alt: 'Bulk cooking equipment including tilting pans and bratt pans in a Magicomeal production kitchen',
      },
      {
        src: '/assets/img/gallery/magicomeal-office-since-2010-mumbai.webp',
        alt: 'Magicomeal head office reception showing the Since 2010 logo and the company milestone wall',
      },
    ],
  },

  /* ================================================================== *
   * STICKY MOBILE CTA
   * ================================================================== */
  stickyCta: { call: 'Call', proposal: 'Get Proposal' },
};
