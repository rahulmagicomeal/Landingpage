/**
 * config.js — Deployment & experiment configuration.
 *
 * This is the ONLY file you need to touch to:
 *   - point the page at a different domain / URL
 *   - switch the hero headline variant for an A/B test
 *   - wire up (or swap) analytics + Google Ads conversion tracking
 *   - change where the lead form posts to
 *
 * Nothing here is copy. Copy lives in ./content.js, facts live in ./company.js.
 */

module.exports = {
  /* ------------------------------------------------------------------ *
   * 1. Where this page lives
   * ------------------------------------------------------------------ */
  site: {
    origin: 'https://magicomeal.com',
    // Path this landing page will be published at. Used for canonical + sitemap.
    path: '/corporate-catering-mumbai/',
    // Set to false once you are happy to let Google index this page.
    // Google Ads traffic does NOT require indexing — many advertisers keep
    // dedicated LPs noindex so they don't compete with the main site.
    // We recommend `false` here: this page is built to rank AND convert.
    noindex: false,
  },

  /* ------------------------------------------------------------------ *
   * 2. Analytics & conversion tracking
   *
   * The IDs below were read directly from the live magicomeal.com pages on
   * 28 Sep 2026. They are the real, currently-installed containers.
   *
   * >>> ACTION REQUIRED <<<
   * `adsConversionLabel` is the ONLY value we could not read from the public
   * site — conversion labels are only visible inside the Google Ads UI.
   * Get it from: Google Ads → Goals → Conversions → (your lead action) →
   * "Tag setup" → "Use Google Tag Manager" → copy the Conversion Label.
   * Until it is filled in, the page fires GA4 + dataLayer events correctly
   * but will NOT report a Google Ads conversion.
   * ------------------------------------------------------------------ */
  tracking: {
    gtmId: 'GTM-3XPQZ56W', // verified live on magicomeal.com
    ga4Id: 'G-TBTYERXS59', // verified live on magicomeal.com
    adsConversionId: 'AW-935324887', // verified live on magicomeal.com
    adsConversionLabel: '', // <-- PASTE YOUR CONVERSION LABEL HERE
    // Loads gtag.js directly. Set to false if you prefer to fire everything
    // through the existing GTM container instead (events still push to dataLayer).
    loadGtagDirectly: true,
    // LinkedIn Insight partner ID is present on magicomeal.com but the numeric
    // partner ID is set inside GTM, so it is inherited automatically via GTM.
  },

  /* ------------------------------------------------------------------ *
   * 3. Lead form
   * ------------------------------------------------------------------ */
  form: {
    // POST target. The bundled server.js implements this endpoint with
    // server-side validation + JSONL storage. Swap for your CRM / webhook
    // / WordPress endpoint when you deploy.
    endpoint: '/api/lead',
    // Minimum meals/day Magicomeal will quote for. Magicomeal's published
    // position is that minimums vary by requirement, so we do not gate the
    // form — we qualify with the volume dropdown instead.
    enforceMinimum: false,
  },

  /* ------------------------------------------------------------------ *
   * 4. A/B testing
   *
   * Change `heroVariant` to 'A', 'B' or 'C' and rebuild. Only one renders
   * at a time — no client-side flicker, no layout shift, no extra JS.
   * The active variant is pushed to the dataLayer as `hero_variant` so you
   * can segment conversions in GA4 / Looker Studio.
   * ------------------------------------------------------------------ */
  // NOTE: with `heroMedia` active the hero carries no headline, so this only
  // takes effect if you switch back to the `heroForm` layout.
  heroVariant: 'A',

  /* ------------------------------------------------------------------ *
   * 5. Page length
   *
   * This is a paid-traffic lead-gen page, so the default is the SHORT
   * layout: the form sits in the hero, and the long explainer sections are
   * compressed into two compact blocks. That takes the page from ~20,000px
   * of scroll down to roughly a third of that, and moves the form from
   * section 16 to section 1.
   *
   * Nothing was deleted. Every long section still exists in content.js and
   * template.js — add its name back to this list to bring it back, in
   * whatever order you list it. That makes page length an A/B test rather
   * than a rewrite.
   *
   * Available: heroMedia | heroForm | hero | leadForm | trustBar | logos
   *            | partners | services3 | features3 | entityGlance
   *            | services | servicesCompact | pains | why | scale | kitchens
   *            | proofStrip | safety | menu | proof | areas | how | gallery
   *            | faq
   *            | finalCta
   *
   * Notes:
   *   - Exactly one section must carry the lead form: `heroMedia` (photo
   *     carousel behind copy + form), `heroForm` (plain hero + form), or
   *     `leadForm` (form in its own section lower down). build.js refuses
   *     any other combination, because two forms means duplicate ids.
   *   - `servicesCompact` replaces `services` + `pains` + `why`.
   *   - `proofStrip` replaces `scale` + `kitchens` + `safety` + `proof`.
   * ------------------------------------------------------------------ */
  sections: [
    'heroMedia',    // hero: photo carousel + lead form
    'services3',    // sheet 1: cafeteria management / events / institutional
    'partners',     // sheet 2: "Our Partners", auto-rotating logo strip
    // 'features3' is OFF: those three propositions now sit in the hero's left
    // column (content.heroFeatures). Re-enable only if you move them back out
    // of the hero — otherwise the page says the same thing twice.
    'proofStrip',
    'how',
    'gallery',
    'faq',
    'finalCta',
  ],

  // Short page shows only the FAQs flagged `short: true` in content.js.
  // Set to false to show all of them. The JSON-LD FAQPage follows this, so
  // the structured data never claims a question the page does not show.
  shortFaq: true,
  ctaVariant: 'A',
};
