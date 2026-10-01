#!/usr/bin/env node
/**
 * build.js — renders public/index.html, robots.txt and sitemap.xml
 * from the data layer in src/data/. Zero dependencies.
 *
 *   npm run build
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'public');

function fresh(mod) {
  delete require.cache[require.resolve(mod)];
  return require(mod);
}

const config = fresh('./src/data/config');
const render = fresh('./src/template');

/**
 * Content hashes for the CSS and JS. The server sends long cache headers for
 * static assets, so without this a stylesheet change would not reach visitors
 * (or the person testing locally) until the cache expired.
 */
const crypto = require('crypto');
const hash = (rel) => {
  const file = path.join(OUT, rel);
  if (!fs.existsSync(file)) return '';
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
};
const assetVersions = {
  css: hash('assets/css/styles.css'),
  js: hash('assets/js/main.js'),
};

/* --------------------------------------------------- validate config.sections
 * Cheap guards against the two ways this config can silently produce a broken
 * page: two lead forms (duplicate element ids, so main.js binds to one and the
 * visitor fills the other), or no lead form at all on a lead-gen page.
 */
const sections = config.sections || [];
const formSections = ['heroForm', 'leadForm'].filter((s) => sections.includes(s));

if (formSections.length > 1) {
  console.error(
    '\n  config.sections lists both "heroForm" and "leadForm".\n' +
      '  That renders the form twice and duplicates the element ids the form\n' +
      '  script binds to. Keep one.\n'
  );
  process.exit(1);
}
if (formSections.length === 0) {
  console.error(
    '\n  config.sections has no lead form — add "heroForm" (form in the hero)\n' +
      '  or "leadForm" (form in its own section further down).\n'
  );
  process.exit(1);
}

/* ------------------------------------------------------------- index.html */
const html = render(config, assetVersions);
fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');

/* ------------------------------------------------------------- robots.txt */
const robots = config.site.noindex
  ? `User-agent: *\nDisallow: ${config.site.path}\n`
  : `User-agent: *
Allow: /

# Answer engines and AI crawlers are welcome — this page is written to be
# quoted accurately. See the JSON-LD graph in the page head.
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: ${config.site.origin}/sitemap.xml
`;
fs.writeFileSync(path.join(OUT, 'robots.txt'), robots, 'utf8');

/* ------------------------------------------------------------ sitemap.xml */
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.site.origin}${config.site.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`;
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap, 'utf8');

/* ------------------------------------------------------------------ report */
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
console.log('Built public/index.html      ' + kb(Buffer.byteLength(html)));
console.log('Built public/robots.txt      ' + kb(Buffer.byteLength(robots)));
console.log('Built public/sitemap.xml     ' + kb(Buffer.byteLength(sitemap)));
console.log('Hero variant: ' + config.heroVariant + '   Canonical: ' + config.site.origin + config.site.path);
if (!config.tracking.adsConversionLabel) {
  console.warn(
    '\n  !  Google Ads conversion label is empty — form submissions will NOT\n' +
      '     report a conversion to Google Ads. Set `tracking.adsConversionLabel`\n' +
      '     in src/data/config.js before running paid traffic.\n'
  );
}
