/**
 * schema.js — JSON-LD structured data.
 *
 * Rules applied here:
 *   - Every property is backed by content that is visible on the page.
 *   - @id relationships tie the graph together (Organization ↔ WebSite ↔
 *     WebPage ↔ Service ↔ FAQPage).
 *   - No aggregateRating. Google disallows self-serving first-party ratings
 *     in rich results, and we have no reviewCount to support one.
 *   - No fabricated awards, press, or founding claims beyond "since 2010".
 */

const company = require('./data/company');
const content = require('./data/content');

module.exports = function buildSchema(config) {
  const base = config.site.origin;
  const pageUrl = base + config.site.path;

  const ORG = `${base}/#organization`;
  const SITE = `${base}/#website`;
  const PAGE = `${pageUrl}#webpage`;

  const areaServed = company.serviceAreas.map((a) => ({
    '@type': 'City',
    name: a.name,
    containedInPlace: { '@type': 'AdministrativeArea', name: 'Maharashtra, India' },
  }));

  const organization = {
    '@type': ['Organization', 'FoodEstablishment'],
    '@id': ORG,
    name: company.name,
    alternateName: 'Magic O Meal',
    url: base,
    slogan: company.tagline,
    description: content.entity.lead,
    foundingDate: String(company.foundedYear),
    logo: {
      '@type': 'ImageObject',
      '@id': `${base}/#logo`,
      url: `${base}/assets/img/magicomeal-logo-badge.png`,
      contentUrl: `${base}/assets/img/magicomeal-logo-badge.png`,
      caption: company.name,
    },
    image: { '@id': `${base}/#logo` },
    telephone: company.contact.phone,
    email: company.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.contact.address.street,
      addressLocality: company.contact.address.locality,
      addressRegion: company.contact.address.region,
      postalCode: company.contact.address.postalCode,
      addressCountry: company.contact.address.country,
    },
    areaServed,
    sameAs: company.social,
    knowsAbout: [
      'Corporate catering',
      'Corporate cafeteria management',
      'Daily office meals',
      'Institutional catering',
      'Corporate event catering',
      'Food safety management',
    ],
    hasCredential: company.certifications.map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'certification',
      name: c.full,
    })),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        '@id': `${base}/#sales`,
        contactType: 'sales',
        telephone: company.contact.phone,
        email: company.contact.email,
        areaServed: 'IN',
        availableLanguage: ['en', 'hi', 'mr'],
      },
    ],
  };

  const website = {
    '@type': 'WebSite',
    '@id': SITE,
    url: base,
    name: company.name,
    publisher: { '@id': ORG },
    inLanguage: 'en-IN',
  };

  const webpage = {
    '@type': 'WebPage',
    '@id': PAGE,
    url: pageUrl,
    name: content.meta.title,
    description: content.meta.description,
    isPartOf: { '@id': SITE },
    about: { '@id': ORG },
    primaryImageOfPage: { '@type': 'ImageObject', url: base + content.meta.ogImage },
    inLanguage: 'en-IN',
    breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Corporate Catering Services in Mumbai', item: pageUrl },
    ],
  };

  // One Service entity per visible service section, each anchored to its
  // own on-page id so the schema and the content cannot drift apart.
  const services = content.services.items.map((s) => ({
    '@type': 'Service',
    '@id': `${pageUrl}#${s.slug}`,
    name: s.h3,
    description: s.summary,
    serviceType: s.h3,
    category: 'Corporate and institutional catering',
    provider: { '@id': ORG },
    areaServed,
    audience: { '@type': 'BusinessAudience', name: s.forWho },
    url: `${pageUrl}#${s.id}`,
  }));

  const offerCatalog = {
    '@type': 'OfferCatalog',
    '@id': `${pageUrl}#catalog`,
    name: 'Magicomeal corporate catering services',
    itemListElement: content.services.items.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: { '@id': `${pageUrl}#${s.slug}` },
    })),
  };

  // Google requires FAQ structured data to match what the page actually
  // shows. The short layout renders only the `short: true` questions, so the
  // schema has to follow the same filter — otherwise we would be marking up
  // answers a visitor can never see, which is a manual-action risk.
  const visibleFaqs = config.shortFaq ? content.faq.items.filter((f) => f.short) : content.faq.items;

  const faqPage = {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    isPartOf: { '@id': PAGE },
    mainEntity: visibleFaqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const graph = [organization, website, webpage, breadcrumb, ...services, offerCatalog];
  // Only claim an FAQPage if the page renders one.
  if (config.sections.includes('faq') && visibleFaqs.length) graph.push(faqPage);

  return { '@context': 'https://schema.org', '@graph': graph };
};
