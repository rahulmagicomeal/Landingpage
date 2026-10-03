/**
 * template.js — renders the full landing page HTML.
 *
 * Everything the visitor (and every crawler / LLM) needs is emitted as plain
 * HTML at build time. No client-side rendering, no hydration, no content
 * hidden behind JavaScript. The only JS on the page handles form submission,
 * analytics events and the FAQ toggles — all progressive enhancement.
 */

const company = require('./data/company');
const content = require('./data/content');
const buildSchema = require('./schema');

/* ---------------------------------------------------------------- helpers */
const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const ICON = {
  check:
    '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  checkCircle:
    '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M6 10.3l2.6 2.6L14 7.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  phone:
    '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M17.5 14.2v2.1a1.4 1.4 0 01-1.53 1.4 13.9 13.9 0 01-6.06-2.16 13.7 13.7 0 01-4.2-4.2A13.9 13.9 0 013.55 5.2 1.4 1.4 0 014.94 3.7h2.1a1.4 1.4 0 011.4 1.2c.09.67.25 1.33.48 1.96a1.4 1.4 0 01-.32 1.48l-.89.89a11.2 11.2 0 004.2 4.2l.89-.89a1.4 1.4 0 011.48-.32c.63.23 1.29.39 1.96.48a1.4 1.4 0 011.2 1.42z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  whatsapp:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.94L2.1 22l5.35-1.4a9.8 9.8 0 004.59 1.17h.01c5.43 0 9.84-4.4 9.84-9.84 0-2.63-1.02-5.1-2.88-6.96A9.77 9.77 0 0012.04 2zm0 17.97h-.01a8.2 8.2 0 01-4.17-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.15 8.15 0 01-1.25-4.36c0-4.52 3.68-8.19 8.2-8.19a8.14 8.14 0 015.79 2.4 8.12 8.12 0 012.4 5.8c0 4.51-3.68 8.19-8.19 8.19zm4.49-6.13c-.25-.12-1.46-.72-1.68-.8-.23-.09-.39-.13-.56.12-.16.25-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.04-.39-1.98-1.23-.73-.65-1.23-1.46-1.37-1.7-.15-.25-.02-.38.1-.5.11-.12.25-.29.37-.44.13-.15.17-.25.25-.41.09-.17.05-.31-.01-.44-.07-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42l-.48-.01a.92.92 0 00-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.6.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.15-1.18-.06-.1-.23-.16-.48-.28z"/></svg>',
  mail:
    '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.2" y="4.2" width="15.6" height="11.6" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M2.8 5.4L10 10.6l7.2-5.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pin:
    '<svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 18s6-5.2 6-9.4A6 6 0 004 8.6C4 12.8 10 18 10 18z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="10" cy="8.5" r="2.2" stroke="currentColor" stroke-width="1.7"/></svg>',
  arrow:
    '<svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11m0 0l-4.2-4.2M15 10l-4.2 4.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  shield:
    '<svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M11 2.6l7 2.6v5.1c0 4.3-2.9 8.3-7 9.4-4.1-1.1-7-5.1-7-9.4V5.2l7-2.6z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8 11.2l2.1 2.1L14.4 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  bowl:
    '<svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M3 10h16a8 8 0 01-8 8 8 8 0 01-8-8z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8 7c0-1.4.9-2.2 1.6-2.7.7-.5.9-1 .9-1.6M13 7.2c0-1.1.7-1.7 1.2-2.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  clock:
    '<svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="8.2" stroke="currentColor" stroke-width="1.7"/><path d="M11 6.4V11l3 1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  users:
    '<svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true"><circle cx="8.6" cy="7.6" r="3.2" stroke="currentColor" stroke-width="1.7"/><path d="M2.8 18.4c0-3.2 2.6-5.2 5.8-5.2s5.8 2 5.8 5.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M15 5.2a3 3 0 010 5.6M16.6 13.6c1.7.7 2.9 2.2 2.9 4.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  cal:
    '<svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true"><rect x="3.2" y="4.6" width="15.6" height="14.2" rx="2.4" stroke="currentColor" stroke-width="1.7"/><path d="M3.2 9h15.6M7.4 2.8v3.4M14.6 2.8v3.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  handshake:
    '<svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M2.6 12.2l3.6-4.6 3.5.9 1.9-1.4 2.2 1.5 3.6-.9 2 4.5-2.9 4-3.3-2.6-1.6 1.3-2.2-1.7-2.4 2z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  star:
    '<svg width="20" height="20" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M11 2.8l2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.75L5.8 18.85l1-5.8-4.2-4.1 5.8-.85L11 2.8z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  chevron:
    '<svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M7.5 4l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  tick:
    '<svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><path d="M6 15.6l6 6L24 8.4" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const WHY_ICONS = [ICON.bowl, ICON.users, ICON.clock, ICON.cal, ICON.handshake, ICON.star];
const PAIN_ICONS = [ICON.star, ICON.clock, ICON.shield, ICON.bowl, ICON.handshake];

/* ---------------------------------------------------------------- render */
module.exports = function render(config, assets) {
  var v = assets || { css: '', js: '' };
  const c = content;
  const co = company;
  const pageUrl = config.site.origin + config.site.path;
  const hero = c.hero.variants[config.heroVariant] || c.hero.variants.A;
  const telHref = `tel:${co.contact.phone}`;
  const waHref = `https://wa.me/${co.contact.whatsapp}?text=${encodeURIComponent(
    c.form.success.whatsappText
  )}`;

  /* Highlight the key phrase inside the H1 without a second DOM element. */
  const h1Html = hero.highlight
    ? esc(hero.h1).replace(esc(hero.highlight), `<span class="hl">${esc(hero.highlight)}</span>`)
    : esc(hero.h1);

  const schema = JSON.stringify(buildSchema(config)).replace(/</g, '\\u003c');

  const runtimeConfig = JSON.stringify({
    endpoint: config.form.endpoint,
    ga4Id: config.tracking.ga4Id,
    adsConversionId: config.tracking.adsConversionId,
    adsConversionLabel: config.tracking.adsConversionLabel,
    heroVariant: config.heroVariant,
    phone: co.contact.phone,
    phoneDisplay: co.contact.phoneDisplay,
  });

  /* ---------- analytics head snippets ---------- */
  const gtm = config.tracking.gtmId
    ? `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${config.tracking.gtmId}');</script>`
    : '';

  const gtagIds = [config.tracking.ga4Id, config.tracking.adsConversionId].filter(Boolean);
  const gtag =
    config.tracking.loadGtagDirectly && gtagIds.length
      ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${gtagIds[0]}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${gtagIds
          .map((id) => `gtag('config','${id}');`)
          .join('')}</script>`
      : '';

  /* Which sections render, and in what order — see config.sections. */
  const has = (n) => config.sections.includes(n);

  /* The lead form lives in exactly one place per build: inside the hero on
     the short page, or in its own section on the long one. Rendering it
     twice would duplicate the element ids main.js binds to. */
  const FORM_CARD = `    <div class="formcard">
      <div class="form-alert" id="form-alert" role="alert" aria-live="assertive"></div>

      <form id="lead" novalidate>
        <div class="formgrid">
          <div class="field">
            <label for="f-firstName">${esc(c.form.fields.firstName.label)} <span class="req" aria-hidden="true">*</span></label>
            <input id="f-firstName" name="firstName" type="text" autocomplete="given-name" required
                   placeholder="${esc(c.form.fields.firstName.placeholder)}" aria-describedby="e-firstName">
            <p class="err" id="e-firstName"></p>
          </div>
          <div class="field">
            <label for="f-lastName">${esc(c.form.fields.lastName.label)} <span class="req" aria-hidden="true">*</span></label>
            <input id="f-lastName" name="lastName" type="text" autocomplete="family-name" required
                   placeholder="${esc(c.form.fields.lastName.placeholder)}" aria-describedby="e-lastName">
            <p class="err" id="e-lastName"></p>
          </div>
          <div class="field">
            <label for="f-company">${esc(c.form.fields.company.label)} <span class="req" aria-hidden="true">*</span></label>
            <input id="f-company" name="company" type="text" autocomplete="organization" required
                   placeholder="${esc(c.form.fields.company.placeholder)}" aria-describedby="e-company">
            <p class="err" id="e-company"></p>
          </div>
          <div class="field">
            <label for="f-email">${esc(c.form.fields.email.label)} <span class="req" aria-hidden="true">*</span></label>
            <input id="f-email" name="email" type="email" inputmode="email" autocomplete="email" required
                   placeholder="${esc(c.form.fields.email.placeholder)}" aria-describedby="e-email">
            <p class="err" id="e-email"></p>
          </div>
          <div class="field">
            <label for="f-phone">${esc(c.form.fields.phone.label)} <span class="req" aria-hidden="true">*</span></label>
            <input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" required
                   placeholder="${esc(c.form.fields.phone.placeholder)}" aria-describedby="e-phone">
            <p class="err" id="e-phone"></p>
          </div>
          <div class="field">
            <label for="f-location">${esc(c.form.fields.location.label)} <span class="req" aria-hidden="true">*</span></label>
            <input id="f-location" name="location" type="text" required
                   placeholder="${esc(c.form.fields.location.placeholder)}" aria-describedby="e-location">
            <p class="err" id="e-location"></p>
          </div>
          <div class="field">
            <label for="f-meals">${esc(c.form.fields.meals.label)} <span class="req" aria-hidden="true">*</span></label>
            <select id="f-meals" name="meals" required aria-describedby="e-meals">
              <option value="">Select a range</option>
              ${c.form.mealOptions.map((o) => `<option>${esc(o)}</option>`).join('\n              ')}
            </select>
            <p class="err" id="e-meals"></p>
          </div>
          <div class="field field--full">
            <label for="f-requirement">${esc(c.form.fields.requirement.label)} <span class="req" aria-hidden="true">*</span></label>
            <select id="f-requirement" name="requirement" required aria-describedby="e-requirement">
              <option value="">Select a requirement</option>
              ${c.form.requirementOptions.map((o) => `<option>${esc(o)}</option>`).join('\n              ')}
            </select>
            <p class="err" id="e-requirement"></p>
          </div>
        </div>

        <details class="optional">
          <summary>${esc(c.form.optional.summary)}</summary>
          <p class="optional__hint">${esc(c.form.optional.hint)}</p>
          <div class="formgrid">
            <div class="field">
              <label for="f-employees">${esc(c.form.fields.employees.label)}</label>
              <select id="f-employees" name="employees">
                <option value="">Select a range</option>
                ${c.form.employeeOptions.map((o) => `<option>${esc(o)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label for="f-cuisine">${esc(c.form.fields.cuisine.label)}</label>
              <select id="f-cuisine" name="cuisine">
                <option value="">Select an option</option>
                ${c.form.cuisineOptions.map((o) => `<option>${esc(o)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label for="f-dietary">${esc(c.form.fields.dietary.label)}</label>
              <select id="f-dietary" name="dietary">
                <option value="">Select an option</option>
                ${c.form.dietaryOptions.map((o) => `<option>${esc(o)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label for="f-rotation">${esc(c.form.fields.rotation.label)}</label>
              <select id="f-rotation" name="rotation">
                <option value="">Select an option</option>
                ${c.form.rotationOptions.map((o) => `<option>${esc(o)}</option>`).join('')}
              </select>
            </div>
            <div class="field field--full">
              <label for="f-message">${esc(c.form.fields.message.label)}</label>
              <textarea id="f-message" name="message" rows="3" placeholder="${esc(c.form.fields.message.placeholder)}"></textarea>
            </div>
          </div>
        </details>

        <div class="hp" aria-hidden="true">
          <label for="f-website">Do not fill this in</label>
          <input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>

        <div class="form-foot">
          <button class="btn btn--primary btn--lg btn--block" type="submit" id="submit-btn">
            <span class="spinner" aria-hidden="true"></span>
            <span class="label">${esc(c.form.submit)}</span>
          </button>
          <p class="form-privacy">${esc(c.form.privacy)}</p>
        </div>
      </form>

      <div class="success" id="form-success" role="status" aria-live="polite">
        <div class="success__tick">${ICON.tick}</div>
        <h3>${esc(c.form.success.h3)}</h3>
        <p>${esc(c.form.success.body)}</p>
        <div class="success__actions">
          <a class="btn btn--primary" href="${telHref}" data-event="phone_click" data-loc="thankyou">${ICON.phone}${esc(c.form.success.callLabel)}</a>
          <a class="btn btn--ghost" href="${waHref}" target="_blank" rel="noopener" data-event="whatsapp_click" data-loc="thankyou">${ICON.whatsapp}${esc(c.form.success.whatsappLabel)}</a>
        </div>
      </div>`;

  const faqItems = config.shortFaq ? c.faq.items.filter((f) => f.short) : c.faq.items;

  return `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(c.meta.title)}</title>
<meta name="description" content="${esc(c.meta.description)}">
<link rel="canonical" href="${esc(pageUrl)}">
${config.site.noindex ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">'}
<meta name="theme-color" content="#4eb952">
<meta name="geo.region" content="IN-MH">
<meta name="geo.placename" content="Mumbai">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Magicomeal">
<meta property="og:locale" content="en_IN">
<meta property="og:url" content="${esc(pageUrl)}">
<meta property="og:title" content="${esc(c.meta.ogTitle)}">
<meta property="og:description" content="${esc(c.meta.ogDescription)}">
<meta property="og:image" content="${esc(config.site.origin + c.meta.ogImage)}">
<meta property="og:image:width" content="2000">
<meta property="og:image:height" content="1125">
<meta property="og:image:alt" content="Corporate cafeteria buffet counter managed by Magicomeal in Mumbai">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(c.meta.ogTitle)}">
<meta name="twitter:description" content="${esc(c.meta.ogDescription)}">
<meta name="twitter:image" content="${esc(config.site.origin + c.meta.ogImage)}">

<link rel="icon" href="/assets/img/magicomeal-logo-badge-192.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/magicomeal-logo-badge-192.png">
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/poppins-700.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/poppins-400.woff2" crossorigin>
<link rel="preload" as="image" href="${esc(c.hero.image.wideSrc)}" imagesrcset="${esc(
    c.hero.image.wideSrcset
  )}" imagesizes="${esc(c.hero.image.wideSizes)}" media="(max-width: 899px)" fetchpriority="high">
<link rel="preload" as="image" href="${esc(c.hero.image.src)}" imagesrcset="${esc(
    c.hero.image.srcset
  )}" imagesizes="${esc(c.hero.image.sizes)}" media="(min-width: 900px)" fetchpriority="high">
<link rel="stylesheet" href="/assets/css/styles.css${v.css ? '?v=' + v.css : ''}">

<script type="application/ld+json">${schema}</script>
${gtm}
${gtag}
</head>
<body>
${config.tracking.gtmId ? `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${config.tracking.gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>` : ''}
<a class="skip" href="#lead-form">Skip to the enquiry form</a>

<!-- ============================ HEADER ============================ -->
<header class="site-header">
  <div class="wrap site-header__inner">
    <a class="site-header__logo" href="#top" aria-label="Magicomeal home">
      <img src="/assets/img/magicomeal-logo-badge-192.png" alt="${esc(c.header.logoAlt)}" width="48" height="48">
      <span class="site-header__desc"><b>Corporate Catering</b><span>${esc(
        co.serviceAreas.map((a) => a.name).join(' · ')
      )}</span></span>
    </a>
    <div class="site-header__actions">
      <a class="header-phone" href="${telHref}" data-event="phone_click" data-loc="header">
        ${ICON.phone}<span>${esc(co.contact.phoneDisplay)}</span>
      </a>
      <a class="btn btn--primary" href="#lead-form" data-event="cta_click" data-loc="header">${esc(c.header.cta)}</a>
    </div>
  </div>
</header>

<main id="top">

${has('heroForm') ? `<!-- ======================= HERO + FORM (short page) ============== -->
<section class="hero hero--form">
  <div class="wrap">
    <div class="hero__grid hero__grid--form">
      <div class="hero__copy">
        <p class="eyebrow">${esc(c.hero.eyebrow)}</p>
        <h1>${h1Html}</h1>
        <p class="hero__sub">${esc(c.hero.sub)}</p>
        <ul class="hero-stats">
          ${c.hero.stats
            .map((s) => `<li><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`)
            .join('\n          ')}
        </ul>
        <ul class="hero-assure">
          <li>${ICON.shield}<span><b>ISO 22000:2018</b> · HACCP · FSSAI compliant</span></li>
          <li>${ICON.checkCircle}<span>${esc(c.hero.reassurance)}</span></li>
        </ul>
        <a class="btn btn--ghost hero__call" href="${telHref}" data-event="phone_click" data-loc="hero_secondary">${ICON.phone}${esc(co.contact.phoneDisplay)}</a>
      </div>

      <div class="hero__form" id="lead-form">
        <div class="hero__form-head">
          <h2 id="form-h">${esc(c.form.h2)}</h2>
          <p>${esc(c.form.sub)}</p>
        </div>
        ${FORM_CARD}
        <p class="hero__form-note">${esc(c.form.scopeNote)}</p>
      </div>
    </div>
  </div>
</section>` : ''}

${has('hero') ? `<!-- ============================ HERO ============================== -->
<section class="hero">
  <div class="wrap">
    <div class="hero__grid">
      <div>
        <p class="eyebrow">${esc(c.hero.eyebrow)}</p>
        <h1>${h1Html}</h1>
        <p class="hero__sub">${esc(c.hero.sub)}</p>
        <div class="hero__cta">
          <a class="btn btn--primary btn--lg" href="#lead-form" data-event="hero_cta_click" data-loc="hero_primary">${esc(c.hero.ctaPrimary)}</a>
          <a class="btn btn--ghost btn--lg" href="${telHref}" data-event="phone_click" data-loc="hero_secondary">${ICON.phone}${esc(c.hero.ctaSecondary)}</a>
        </div>
        <p class="hero__reassure">${ICON.checkCircle}${esc(c.hero.reassurance)}</p>
        <ul class="hero-stats">
          ${c.hero.stats
            .map((s) => `<li><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`)
            .join('\n          ')}
        </ul>
      </div>
      <div class="hero__media">
        <picture>
          <source media="(min-width: 900px)" srcset="${esc(c.hero.image.srcset)}" sizes="${esc(
            c.hero.image.sizes
          )}" width="${c.hero.image.width}" height="${c.hero.image.height}">
          <img src="${esc(c.hero.image.wideSrc)}" srcset="${esc(c.hero.image.wideSrcset)}" sizes="${esc(
            c.hero.image.wideSizes
          )}" alt="${esc(c.hero.image.alt)}"
               width="${c.hero.image.wideWidth}" height="${c.hero.image.wideHeight}"
               fetchpriority="high" decoding="async">
        </picture>
        <div class="hero__badge">
          <span class="dot">${ICON.shield}</span>
          <span><strong>ISO 22000:2018</strong><span>HACCP protocols · FSSAI compliant</span></span>
        </div>
      </div>
    </div>
  </div>
</section>` : ''}

${has('trustBar') ? `<!-- ============================ TRUST BAR ========================= -->
<section class="trustbar" aria-labelledby="trust-h">
  <div class="wrap">
    <h2 id="trust-h">${esc(c.trustBar.h2)}</h2>
    <ul>
      ${c.trustBar.items.map((i) => `<li>${ICON.check}${esc(i)}</li>`).join('\n      ')}
    </ul>
  </div>
</section>` : ''}

${has('logos') ? `<!-- ============================ CLIENT LOGOS ====================== -->
<section class="section" aria-labelledby="clients-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="clients-h">${esc(c.clients.h2)}</h2>
      <p>${esc(c.clients.sub)}</p>
    </div>
    <ul class="logo-grid">
      ${co.clientLogos
        .map(
          (l) =>
            `<li><img src="/assets/img/clients/${l.file}" alt="${esc(l.name)} — Magicomeal corporate catering client" width="531" height="313" loading="lazy" decoding="async"></li>`
        )
        .join('\n      ')}
    </ul>
    <p class="client-more"><strong>${esc(c.clients.moreLabel)}:</strong> ${esc(
      co.otherClients.corporate.join(', ')
    )}. <strong>Institutions:</strong> ${esc(co.otherClients.institutions.join(', '))}.</p>
  </div>
</section>` : ''}

${has('entityGlance') ? `<!-- ============================ ENTITY + GLANCE =================== -->
<section class="section section--tint" aria-labelledby="entity-h">
  <div class="wrap entity__grid">
    <div>
      <h2 id="entity-h">${esc(c.entity.h2)}</h2>
      <p class="entity__lead">${esc(c.entity.lead)}</p>
      ${c.entity.body.map((p) => `<p class="lead">${esc(p)}</p>`).join('\n      ')}
    </div>
    <div class="glance">
      <h2>${esc(c.glance.h2)}</h2>
      <dl>
        ${c.glance.rows
          .map((r) => `<div><dt>${esc(r.k)}</dt><dd>${esc(r.v)}</dd></div>`)
          .join('\n        ')}
      </dl>
    </div>
  </div>
</section>` : ''}

${has('servicesCompact') ? `<!-- ================= SERVICES (compact, short page) ============== -->
<section class="section" id="services" aria-labelledby="svccompact-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="svccompact-h">${esc(c.servicesCompact.h2)}</h2>
      <p>${esc(c.servicesCompact.intro)}</p>
    </div>
    <div class="cards cards--tight">
      ${c.servicesCompact.items
        .map(
          (it, i) => `<article class="card">
        <span class="card__icon">${WHY_ICONS[i % WHY_ICONS.length]}</span>
        <h3>${esc(it.title)}</h3>
        <p>${esc(it.body)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>` : ''}

${has('services') ? `<!-- ============================ SERVICES ========================== -->
<section class="section" id="services" aria-labelledby="services-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="services-h">${esc(c.services.h2)}</h2>
      <p>${esc(c.services.intro)}</p>
    </div>
    ${c.services.items
      .map(
        (s, i) => `<article class="service${i % 2 ? ' service--flip' : ''}" id="${s.id}">
      <div class="service__media">
        <img src="${esc(s.image.src)}" alt="${esc(s.image.alt)}" width="${s.image.width}" height="${s.image.height}" loading="lazy" decoding="async">
      </div>
      <div>
        <h3>${esc(s.h3)}</h3>
        <p class="service__summary">${esc(s.summary)}</p>
        <p class="service__for">${ICON.users}${esc(s.forWho)}</p>
        ${s.body.map((p) => `<p>${esc(p)}</p>`).join('\n        ')}
        <ul class="service__points">
          ${s.points.map((p) => `<li>${ICON.check}<span>${esc(p)}</span></li>`).join('\n          ')}
        </ul>
        <a class="textlink" href="#lead-form" data-event="cta_click" data-loc="service_${s.id}">Get a proposal for ${esc(
          s.h3.toLowerCase()
        )} ${ICON.arrow}</a>
      </div>
    </article>`
      )
      .join('\n    ')}
  </div>
</section>` : ''}

${has('pains') ? `<!-- ============================ PAIN POINTS ======================= -->
<section class="section section--tint" aria-labelledby="pains-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="pains-h">${esc(c.pains.h2)}</h2>
      <p>${esc(c.pains.sub)}</p>
    </div>
    <div class="cards">
      ${c.pains.items
        .map(
          (p, i) => `<article class="card">
        <span class="card__icon">${PAIN_ICONS[i % PAIN_ICONS.length]}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.body)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>` : ''}

${has('why') ? `<!-- ============================ WHY MAGICOMEAL ==================== -->
<section class="section" aria-labelledby="why-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="why-h">${esc(c.why.h2)}</h2>
      <p>${esc(c.why.sub)}</p>
    </div>
    <div class="cards">
      ${c.why.items
        .map(
          (w, i) => `<article class="card">
        <span class="card__icon">${WHY_ICONS[i % WHY_ICONS.length]}</span>
        <h3>${esc(w.title)}</h3>
        <p>${esc(w.body)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>` : ''}

${has('proofStrip') ? `<!-- ================= PROOF STRIP (short page) ==================== -->
<section class="section section--tint" aria-labelledby="proofstrip-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="proofstrip-h">${esc(c.proofStrip.h2)}</h2>
    </div>
    <ul class="hero-stats proofstrip__stats">
      ${c.proofStrip.stats
        .map((s) => `<li><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`)
        .join('\n      ')}
    </ul>
    <div class="proofstrip">
      <ul class="proofstrip__points">
        ${c.proofStrip.points
          .map(
            (pt) => `<li>
          ${ICON.check}
          <div><h3>${esc(pt.title)}</h3><p>${esc(pt.body)}</p></div>
        </li>`
          )
          .join('\n        ')}
      </ul>
      <div class="proofstrip__media">
        <img src="${esc(c.proofStrip.image.src)}" alt="${esc(c.proofStrip.image.alt)}" width="${
          c.proofStrip.image.width
        }" height="${c.proofStrip.image.height}" loading="lazy" decoding="async">
      </div>
    </div>
    <p class="proofstrip__clients">${esc(c.proofStrip.clientLine)}</p>
  </div>
</section>` : ''}

${has('scale') ? `<!-- ============================ SCALE ============================= -->
<section class="section scale" aria-labelledby="scale-h">
  <div class="wrap scale__grid">
    <div>
      <h2 id="scale-h">${esc(c.scale.h2)}</h2>
      <ul class="scale__stats">
        ${c.scale.stats
          .map((s) => `<li><b>${esc(s.value)}</b><span>${esc(s.label)}</span></li>`)
          .join('\n        ')}
      </ul>
      <p>${esc(c.scale.body)}</p>
    </div>
    <div class="scale__media">
      <img src="${esc(c.scale.image.src)}" alt="${esc(c.scale.image.alt)}" width="${c.scale.image.width}" height="${c.scale.image.height}" loading="lazy" decoding="async">
    </div>
  </div>
</section>` : ''}

${has('kitchens') ? `<!-- ============================ KITCHENS ========================== -->
<section class="section section--tint" id="kitchens" aria-labelledby="kitchens-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="kitchens-h">${esc(c.kitchens.h2)}</h2>
      <p>${esc(c.kitchens.sub)}</p>
    </div>
    <div class="kitchens">
      <ul class="kitchens__list">
        ${c.kitchens.items
          .map(
            (k) => `<li class="kitchen${k.primary ? ' kitchen--primary' : ''}">
          <span class="kitchen__role">${esc(k.role)}</span>
          <b class="kitchen__area">${esc(k.areaLabel)}</b>
          <h3 class="kitchen__city">${ICON.pin}${esc(k.city)}</h3>
          <p>${esc(k.body)}</p>
        </li>`
          )
          .join('\n        ')}
      </ul>
      <div class="kitchens__media">
        <img src="${esc(c.kitchens.image.src)}" alt="${esc(c.kitchens.image.alt)}" width="${
          c.kitchens.image.width
        }" height="${c.kitchens.image.height}" loading="lazy" decoding="async">
      </div>
    </div>
    <p class="kitchens__foot">${esc(c.kitchens.footnote)}</p>
  </div>
</section>` : ''}

${has('safety') ? `<!-- ============================ FOOD SAFETY ======================= -->
<section class="section" aria-labelledby="safety-h">
  <div class="wrap safety__grid">
    <div class="safety__media">
      ${c.safety.images
        .map(
          (im) =>
            `<img src="${esc(im.src)}" alt="${esc(im.alt)}" width="640" height="640" loading="lazy" decoding="async">`
        )
        .join('\n      ')}
    </div>
    <div>
      <h2 id="safety-h">${esc(c.safety.h2)}</h2>
      <p>${esc(c.safety.sub)}</p>
      <ul class="pillars">
        ${c.safety.pillars.map((p) => `<li>${ICON.check}<span>${esc(p)}</span></li>`).join('\n        ')}
      </ul>
      <p class="cert-line">${esc(c.safety.certLine)}</p>
    </div>
  </div>
</section>` : ''}

${has('menu') ? `<!-- ============================ MENU ============================== -->
<section class="section section--tint" aria-labelledby="menu-h">
  <div class="wrap menu__grid">
    <div>
      <h2 id="menu-h">${esc(c.menu.h2)}</h2>
      <p class="lead">${esc(c.menu.sub)}</p>
      <ul class="chips">
        ${c.menu.categories.map((m) => `<li>${esc(m)}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="menu__media">
      ${c.menu.images
        .map(
          (im, i) =>
            `<img class="${i === 0 ? 'menu__lead' : ''}" src="${esc(im.src)}" alt="${esc(
              im.alt
            )}" width="${im.width}" height="${im.height}" loading="lazy" decoding="async">`
        )
        .join('\n      ')}
    </div>
  </div>
</section>` : ''}

${has('proof') ? `<!-- ============================ PROOF ============================= -->
<section class="section" aria-labelledby="proof-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="proof-h">${esc(c.proof.h2)}</h2>
      <p>${esc(c.proof.sub)}</p>
    </div>
    <div class="proof-grid">
      ${c.proof.items
        .map(
          (p) => `<article class="proof-card">
        <b>${esc(p.stat)}</b>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.body)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>
    <p class="proof-note">${esc(c.proof.note)}</p>
  </div>
</section>` : ''}

${has('areas') ? `<!-- ============================ SERVICE AREAS ===================== -->
<section class="section section--green" aria-labelledby="areas-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="areas-h">${esc(c.areas.h2)}</h2>
    </div>
    ${c.areas.body.map((p) => `<p class="lead" style="max-width:62em">${esc(p)}</p>`).join('\n    ')}
    <ul class="area-pills">
      ${c.areas.list.map((a) => `<li>${ICON.pin}${esc(a)}</li>`).join('\n      ')}
    </ul>
  </div>
</section>` : ''}

${has('how') ? `<!-- ============================ HOW IT WORKS ====================== -->
<section class="section" aria-labelledby="how-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="how-h">${esc(c.how.h2)}</h2>
    </div>
    <ol class="steps">
      ${c.how.steps
        .map(
          (s) => `<li class="step">
        <b>${esc(s.n)}</b>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.body)}</p>
      </li>`
        )
        .join('\n      ')}
    </ol>
  </div>
</section>` : ''}

${has('leadForm') ? `<!-- ============================ LEAD FORM ========================= -->
<section class="section formsec" id="lead-form" aria-labelledby="form-h">
  <div class="wrap formsec__grid">
    <div class="formsec__aside">
      <h2 id="form-h">${esc(c.form.h2)}</h2>
      <p>${esc(c.form.sub)}</p>
      <div class="formsec__contacts">
        <a href="${telHref}" data-event="phone_click" data-loc="form_aside">${ICON.phone}${esc(co.contact.phoneDisplay)}</a>
        <a href="${waHref}" target="_blank" rel="noopener" data-event="whatsapp_click" data-loc="form_aside">${ICON.whatsapp}WhatsApp our catering team</a>
        <a href="mailto:${esc(co.contact.email)}" data-event="email_click" data-loc="form_aside">${ICON.mail}${esc(co.contact.email)}</a>
      </div>
      <p class="mini">${esc(c.form.scopeNote)}</p>
    </div>

${FORM_CARD}
    </div>
  </div>
</section>` : ''}

${has('gallery') ? `<!-- ============================ GALLERY ========================== -->
<section class="section" id="gallery" aria-labelledby="gallery-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="gallery-h">${esc(c.gallery.h2)}</h2>
      <p>${esc(c.gallery.sub)}</p>
    </div>
    <div class="carousel" data-carousel>
      <ul class="carousel__track" tabindex="0" role="group" aria-label="Magicomeal photographs — scroll or swipe for more">
        ${c.gallery.items
          .map(
            (g, i) => `<li><img src="${esc(g.src)}" alt="${esc(
              g.alt
            )}" width="600" height="600" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async"></li>`
          )
          .join('')}
      </ul>
      <button class="carousel__btn carousel__btn--prev" type="button" data-car-prev aria-label="Previous photographs">${ICON.chevron}</button>
      <button class="carousel__btn carousel__btn--next" type="button" data-car-next aria-label="More photographs">${ICON.chevron}</button>
    </div>
  </div>
</section>` : ''}

${has('faq') ? `<!-- ============================ FAQ =============================== -->
<section class="section" aria-labelledby="faq-h">
  <div class="wrap">
    <div class="section-head">
      <h2 id="faq-h">${esc(c.faq.h2)}</h2>
    </div>
    <div class="faq">
      ${faqItems
        .map(
          (f, i) => `<details${i === 0 ? ' open' : ''}>
        <summary>${esc(f.q)}</summary>
        <div class="answer"><p>${esc(f.a)}</p></div>
      </details>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>` : ''}

${has('finalCta') ? `<!-- ============================ FINAL CTA ========================= -->
<section class="section finalcta" aria-labelledby="final-h">
  <div class="wrap">
    <h2 id="final-h">${esc(c.finalCta.h2)}</h2>
    <p>${esc(c.finalCta.body)}</p>
    <div class="finalcta__cta">
      <a class="btn btn--white btn--lg" href="#lead-form" data-event="cta_click" data-loc="final_primary">${esc(c.finalCta.ctaPrimary)}</a>
      <a class="btn btn--on-dark btn--lg" href="${telHref}" data-event="phone_click" data-loc="final_secondary">${ICON.phone}${esc(c.finalCta.ctaSecondary)}</a>
    </div>
  </div>
</section>

</main>` : ''}

<!-- ============================ FOOTER ============================ -->
<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__grid">
      <div>
        <img src="/assets/img/magicomeal-logo-white.png" alt="Magicomeal" width="106" height="40" loading="lazy">
        <p>${esc(c.footer.descriptor)}<br>${esc(c.footer.areas)}</p>
      </div>
      <div>
        <strong>Contact</strong>
        <address>
          <a href="${telHref}" data-event="phone_click" data-loc="footer">${esc(co.contact.phoneDisplay)}</a><br>
          <a href="mailto:${esc(co.contact.email)}" data-event="email_click" data-loc="footer">${esc(co.contact.email)}</a><br>
          ${esc(co.contact.hours)}
        </address>
      </div>
      <div>
        <strong>Registered office</strong>
        <address>${esc(co.contact.address.street)},<br>${esc(co.contact.address.locality)}, ${esc(
          co.contact.address.city
        )},<br>${esc(co.contact.address.region)} ${esc(co.contact.address.postalCode)}, ${esc(
          co.contact.address.countryName
        )}</address>
        <div class="site-footer__links">
          ${c.footer.links
            .map((l) => `<a href="${esc(l.href)}" rel="noopener">${esc(l.label)}</a>`)
            .join('\n          ')}
        </div>
      </div>
    </div>
    <div class="site-footer__bottom">
      <span>&copy; ${new Date().getFullYear()} Magicomeal. ${esc(co.tagline)}.</span>
      <span>ISO 22000:2018 · HACCP · FSSAI compliant</span>
    </div>
  </div>
</footer>

<!-- ============================ STICKY MOBILE CTA ================= -->
<div class="sticky-cta" role="group" aria-label="Quick contact">
  <a class="btn btn--ghost" href="${telHref}" data-event="phone_click" data-loc="sticky">${ICON.phone}${esc(
    c.stickyCta.call
  )}</a>
  <a class="btn btn--primary" href="#lead-form" data-event="cta_click" data-loc="sticky">${esc(
    c.stickyCta.proposal
  )}</a>
</div>

<script>window.MM_CONFIG=${runtimeConfig};</script>
<script src="/assets/js/main.js${v.js ? '?v=' + v.js : ''}" defer></script>
</body>
</html>
`;
};
