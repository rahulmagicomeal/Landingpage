# Magicomeal — Corporate Catering Landing Page

A dedicated Google Ads landing page for Magicomeal corporate catering
(Mumbai, Navi Mumbai, Thane). Static HTML, no framework, no runtime
dependencies.

```bash
npm install        # once — pulls sharp, used only by the image step
npm start          # build + serve at http://localhost:3000
npm run build      # regenerate public/index.html only
npm run images     # re-process source-images/ into public/assets/img/
```

---

## Where to change things

| You want to change… | Edit this |
|---|---|
| Any number, client, certification, phone, address | `src/data/company.js` |
| Any headline, paragraph, FAQ, form label | `src/data/content.js` |
| Tracking IDs, form endpoint, canonical URL, A/B variant | `src/data/config.js` |
| Photos on the page | drop files in `source-images/`, map them in `scripts/optimize-images.js`, run `npm run images` |
| Layout / styling | `public/assets/css/styles.css` |
| Page structure | `src/template.js` |
| Structured data | `src/schema.js` |

Then run `npm run build`. `public/` is the deployable output.

---

## Before you spend money on this page

**1. Paste the Google Ads conversion label.**
`src/data/config.js` → `tracking.adsConversionLabel`.
Google Ads → Goals → Conversions → your lead action → Tag setup →
"Use Google Tag Manager" → copy the Conversion Label.

Everything else is already wired to the containers that are live on
magicomeal.com today (read from the site on 28 Sep 2026):
GTM `GTM-3XPQZ56W`, GA4 `G-TBTYERXS59`, Google Ads `AW-935324887`.
Until the label is set, GA4 and the dataLayer receive every event but Google
Ads records no conversion. `npm run build` prints a warning while it is empty.

**2. Point the form somewhere permanent.**
`config.form.endpoint` defaults to `/api/lead`, implemented in `server.js`
(server-side validation → `data/leads.jsonl`, plus optional
`LEAD_WEBHOOK_URL` forwarding). Swap it for your CRM endpoint if you are
deploying the page as static files.

**3. Confirm three facts** (see "Unverified" below).

**4. Enable gzip or brotli** on whatever serves `public/`. The HTML is 79 KB
uncompressed and compresses to roughly a fifth of that.

---

## Photography

Every photo on the page is Magicomeal's own, supplied by you — client
cafeterias in service, the central kitchen, the production line, the team, a
school lunch, festival menus. None of it is stock.

The originals live in `source-images/`. `npm run images` crops and re-encodes
them into `public/assets/img/` via `scripts/optimize-images.js`, which is the
single place that decides output filename, size, crop ratio and quality. That
step took the 14 originals from **4.7 MB to about 1.2 MB** without a visible
quality drop. Crops use sharp's `attention` strategy, which biases toward faces
and detail rather than the geometric centre — it matters on the group shots.

Two things worth knowing if you swap photos later:

- **The hero is the LCP element**, so it ships in two crops (5:6 for desktop,
  4:3 for phones) at two widths each. `<picture>` + `srcset` means the browser
  downloads exactly one — 63 KB on a typical desktop instead of 187 KB. If you
  replace it, regenerate all four variants.
- **The 5:6 desktop crop is deliberate.** At 4:3 the image column came out
  ~200 px shorter than the copy beside it and floated in dead space.

Filenames are descriptive (`magicomeal-school-catering-students-mumbai.webp`,
not `IMG_1234.jpg`) and every image has alt text written for a human, which is
also what makes them eligible for image search.

---

## Data provenance

Every number on this page was read off magicomeal.com on 28 Sep 2026.
`src/data/company.js` records the source next to each value.

**Published:** 15,000+ meals cooked daily · 250+ companies served ·
operating since 2010 (16+ years) · 4.6 Google rating · ISO 22000:2018 ·
HACCP · FSSAI · the client logos and names · the eight hygiene controls ·
phone, email and Andheri East address.

**Deliberately NOT published — could not be verified:**

- **"8,000 sq.ft. central kitchen"** — appears nowhere on magicomeal.com.
  Send us the figure and it goes into the scale section.
- **"100+ sites served"** — not on the site. "250+ companies served" is
  published, verifiable and a stronger claim, so the page uses that instead.
- **"250+ team members"** — the live counter reads *"Companies Served Till
  Date: 250+"*. It is not team size. Re-labelling it would have been a
  fabricated statistic. If the team really is 250+, confirm it and it can be
  added as a separate stat.
- **Client testimonials** — none are published anywhere on magicomeal.com.
  Rather than invent quotes, the "Proof" section uses verifiable facts and
  offers named references at proposal stage. Send approved quotes with name,
  designation and company and they drop straight into `content.proof`.

**Needs your confirmation:**

- **Navi Mumbai and Thane.** These came from the brief; magicomeal.com only
  ever says Mumbai. They currently appear in the H1 area, the service-area
  section, the FAQ and the `areaServed` schema. If Magicomeal does not
  actually serve them, remove them from `company.serviceAreas` and rebuild —
  everything else updates automatically.
- **ISO version.** The homepage says ISO 22000:**2018**; the old corporate
  catering page says ISO 22000:**2005**. The page uses 2018. Worth fixing the
  old page too.
- **WhatsApp.** The page links `wa.me/919320022422` (same number as the
  phone line). Confirm WhatsApp is actually monitored on it.

---

## A/B testing

`config.heroVariant` accepts `'A'`, `'B'` or `'C'`:

- **A** (default) — "Corporate catering that keeps your team well fed"
- **B** — "15,000+ meals served daily. Corporate catering you can rely on."
- **C** — "Your workplace deserves better catering"

Only one renders — no client-side flicker, no layout shift. The active
variant is attached to every analytics event as `hero_variant`, so you can
segment conversions in GA4 without extra setup.

---

## Analytics events

Fired to `dataLayer` and to `gtag` together:

`page_view_lp` · `form_view` · `form_start` · `form_submit` ·
`form_success` · `form_error` · `proposal_request` · `hero_cta_click` ·
`cta_click` · `phone_click` · `whatsapp_click` · `email_click`

CTA events carry `cta_location` (`hero_primary`, `sticky`, `footer`,
`service_cafeteria-management`, …) so you can see which section earns the
click. `form_success` also carries `meals_per_day` and `requirement` — that
is what lets you optimise for *qualified* leads rather than raw submissions.

`gclid` and all five `utm_*` parameters are captured from the URL and stored
with the lead, so the CRM can tie a closed deal back to the ad.

---

## What was tested

Verified in a real browser against the running page:

- Viewports 375 / 390 / 414 / 768 / 1366 / 1440 / 1920 — no horizontal
  scroll at any width; sticky mobile CTA appears below 900px only.
- Zero console errors. CLS 0. DOMContentLoaded 136 ms. ~228 KB on the desktop
  critical path, and the only third-party hosts are Google's own tag servers.
  Everything below the fold is lazy-loaded.
- WCAG AA contrast across all 352 text elements — 0 failures.
- All 30 images load, all have alt text and explicit width/height, and every
  declared aspect ratio matches the file's real one (so nothing shifts on load).
- One `h1`, logical `h2`/`h3` hierarchy, every form field labelled.
- Form: empty submit, bad email, bad phone, valid submit, duplicate submit,
  honeypot, and the server rejecting a forged payload.
- JSON-LD parses; 11 nodes; no empty or undefined properties.

### One deliberate design decision

The brand green `#4eb952` gives only **2.5:1** against white text — well
below the 4.5:1 minimum. Filled surfaces that carry white text (primary
buttons, the final CTA band, the step numbers) therefore use the brand
guide's own Dark Green `#2e7d32` at **5.13:1**. `#4eb952` is still the hero
colour everywhere it sits on light ground: icons, borders, tints, the
highlighted words in the H1.

---

## Deploying

`public/` is a complete static site — drop it on any host.

- **As a WordPress page on magicomeal.com** (recommended, keeps the domain
  authority): publish at `/corporate-catering-mumbai/`, upload
  `public/assets/`, and point `config.form.endpoint` at a WP REST or
  Contact Form 7 endpoint.
- **Standalone (Netlify / Vercel / S3):** change `config.site.origin`, then
  rebuild so the canonical, OG tags and schema all follow.
- **With the bundled Node server:** `npm start`, optionally with
  `LEAD_WEBHOOK_URL` set.

If you deploy this page at a URL other than
`/corporate-catering-mumbai/`, update `config.site.path` and rebuild —
otherwise the canonical tag will point at the wrong URL.

The existing `/corporate-catering-services-mumbai/` page should be
301-redirected here once this one is live, so the two do not compete for the
same query.
