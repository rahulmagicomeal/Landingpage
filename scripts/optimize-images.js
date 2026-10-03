#!/usr/bin/env node
/**
 * optimize-images.js — turns the raw Magicomeal photos in source-images/
 * into the web-sized WebP files the landing page actually ships.
 *
 *   npm run images
 *
 * This is a build-time-only step. `sharp` is a devDependency; nothing is
 * added to the page itself. Re-run it whenever source-images/ changes.
 *
 * Each entry declares the widest the image is ever DISPLAYED at, and we emit
 * roughly 2x that for retina. Emitting more than that is wasted bytes on a
 * page that pays for its traffic.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'source-images');
const OUT = path.join(__dirname, '..', 'public', 'assets', 'img');

/**
 * from      — file in source-images/
 * to        — published filename (descriptive, keyword-appropriate, no IMG_1234)
 * width     — output width in px (~2x the largest displayed width)
 * aspect    — optional [w, h] to crop to; omitted keeps the source ratio
 * quality   — WebP quality; photos with fine detail get a little more
 */
const MANIFEST = [
  // Hero — the single most persuasive frame: a real client cafeteria in use.
  // Two crops of the same frame. `<picture>` downloads exactly one: the tall
  // 5:6 balances the copy column on desktop, the 4:3 keeps the CTA above the
  // fold on phones. Both keep the menu screens and the counter queue in frame.
  // Two widths each so the LCP image is not shipped at 2x to 1x screens.
  { from: '12.jpg', to: 'magicomeal-corporate-cafeteria-service-mumbai-600.webp', width: 600, aspect: [5, 6], quality: 76 },
  { from: '12.jpg', to: 'magicomeal-corporate-cafeteria-service-mumbai.webp', width: 1100, aspect: [5, 6], quality: 74 },
  { from: '12.jpg', to: 'magicomeal-corporate-cafeteria-service-mumbai-wide-500.webp', width: 500, aspect: [4, 3], quality: 76 },
  { from: '12.jpg', to: 'magicomeal-corporate-cafeteria-service-mumbai-wide.webp', width: 900, aspect: [4, 3], quality: 74 },

  // Service sections
  { from: '11.jpg', to: 'magicomeal-corporate-catering-counter-service-mumbai.webp', width: 1100, aspect: [4, 3] },
  { from: '4.webp', to: 'magicomeal-cafeteria-management-kitchen-mumbai.webp', width: 1100, aspect: [4, 3] },
  { from: '14.webp', to: 'magicomeal-office-breakfast-idli-chutney-mumbai.webp', width: 1100, aspect: [4, 3], quality: 72 },
  { from: '13.jpg', to: 'magicomeal-corporate-event-buffet-mumbai.webp', width: 1100, aspect: [4, 3] },
  { from: '8.jpg', to: 'magicomeal-school-catering-students-mumbai.webp', width: 1100, aspect: [4, 3] },

  // Operational scale
  { from: '7.jpg', to: 'magicomeal-catering-team-site-mumbai.webp', width: 1240, aspect: [3, 2] },

  // Food safety — a real 2x2 grid of our own kitchen, not a stock collage
  { from: '3.webp', to: 'magicomeal-central-kitchen-mumbai.webp', width: 640, aspect: [1, 1] },
  { from: '2.webp', to: 'magicomeal-veg-section-cooking-mumbai.webp', width: 640, aspect: [1, 1] },
  { from: '5.jpg', to: 'magicomeal-kitchen-production-chefs-mumbai.webp', width: 640, aspect: [1, 1] },
  { from: '1.webp', to: 'magicomeal-staff-briefing-training-mumbai.webp', width: 640, aspect: [1, 1] },

  // Menu mosaic
  { from: '9.jpg', to: 'magicomeal-onam-sadya-corporate-dining-mumbai.webp', width: 900, aspect: [1, 1], quality: 68 },
  { from: '6.jpg', to: 'magicomeal-festival-menu-spread-mumbai.webp', width: 560, aspect: [4, 3] },
  { from: '10.jpg', to: 'magicomeal-corporate-buffet-counter-mumbai.webp', width: 560, aspect: [4, 3] },

  // Hero background slides. Wide crops, two widths each: the first is the LCP
  // image so it is preloaded, the rest are lazy.
  { from: '12.jpg', to: 'hero/hero-1-corporate-cafeteria-mumbai.webp', width: 1800, aspect: [16, 9], quality: 70 },
  { from: '12.jpg', to: 'hero/hero-1-corporate-cafeteria-mumbai-900.webp', width: 900, aspect: [16, 9], quality: 70 },
  { from: '6.jpg', to: 'hero/hero-2-festival-spread-mumbai.webp', width: 1800, aspect: [16, 9], quality: 70 },
  { from: '6.jpg', to: 'hero/hero-2-festival-spread-mumbai-900.webp', width: 900, aspect: [16, 9], quality: 70 },
  { from: '13.jpg', to: 'hero/hero-3-event-buffet-mumbai.webp', width: 1800, aspect: [16, 9], quality: 70 },
  { from: '13.jpg', to: 'hero/hero-3-event-buffet-mumbai-900.webp', width: 900, aspect: [16, 9], quality: 70 },
  { from: '4.webp', to: 'hero/hero-4-production-kitchen-mumbai.webp', width: 1800, aspect: [16, 9], quality: 70 },
  { from: '4.webp', to: 'hero/hero-4-production-kitchen-mumbai-900.webp', width: 900, aspect: [16, 9], quality: 70 },

  // Gallery — square crops, small, all lazy-loaded below the fold.
  { from: '27.jpg', to: 'gallery/magicomeal-corporate-cafeteria-lunch-rush-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '26.jpg', to: 'gallery/magicomeal-school-cafeteria-independence-day-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '22.jpg', to: 'gallery/magicomeal-outdoor-event-catering-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '24.jpg', to: 'gallery/magicomeal-festival-catering-team-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '28.jpg', to: 'gallery/magicomeal-service-team-jbcn-school-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '25.jpg', to: 'gallery/magicomeal-onam-sadya-service-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '21.jpg', to: 'gallery/magicomeal-bulk-cooking-equipment-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  // Cropped from the LEFT, not by attention: the "Since 2010" logo sits on
  // the left edge and attention-cropping picked the timeline wall instead.
  { from: '30.jpg', to: 'gallery/magicomeal-office-since-2010-mumbai.webp', width: 600, aspect: [1, 1], quality: 72, position: 'left' },
  { from: '31.jpg', to: 'gallery/magicomeal-school-lunch-student-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '32.jpg', to: 'gallery/magicomeal-parent-child-school-meal-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '19.jpg', to: 'gallery/magicomeal-event-canapes-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '39.jpg', to: 'gallery/magicomeal-corporate-event-buffet-office-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '41.jpg', to: 'gallery/magicomeal-corporate-event-marquee-buffet-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },
  { from: '33.jpg', to: 'gallery/magicomeal-event-salad-buffet-mumbai.webp', width: 600, aspect: [1, 1], quality: 72 },

  // Open Graph / Twitter card — 1.91:1 is what the platforms crop to.
  { from: '12.jpg', to: 'magicomeal-corporate-catering-mumbai-og.webp', width: 1200, aspect: [1200, 630] },
];

const kb = (n) => (n / 1024).toFixed(1).padStart(6) + ' KB';

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error('source-images/ not found — nothing to optimise.');
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, 'gallery'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'hero'), { recursive: true });

  let totalIn = 0;
  let totalOut = 0;

  for (const item of MANIFEST) {
    const src = path.join(SRC, item.from);
    if (!fs.existsSync(src)) {
      console.warn(`  SKIP  ${item.from} — not found in source-images/`);
      continue;
    }

    let img = sharp(src).rotate(); // honour EXIF orientation

    if (item.aspect) {
      const [aw, ah] = item.aspect;
      const height = Math.round((item.width * ah) / aw);
      // `attention` biases the crop toward faces and detail rather than the
      // geometric centre — matters a lot for the photos with people in them.
      img = img.resize(item.width, height, {
        fit: 'cover',
        position: item.position || sharp.strategy.attention,
      });
    } else {
      img = img.resize({ width: item.width, withoutEnlargement: true });
    }

    const buf = await img.webp({ quality: item.quality || 80, effort: 6 }).toBuffer();
    fs.writeFileSync(path.join(OUT, item.to), buf);

    const inSize = fs.statSync(src).size;
    totalIn += inSize;
    totalOut += buf.length;

    const meta = await sharp(buf).metadata();
    console.log(`  ${kb(inSize)} → ${kb(buf.length)}  ${meta.width}x${meta.height}  ${item.to}`);
  }

  console.log(
    `\n  ${MANIFEST.length} images: ${(totalIn / 1024 / 1024).toFixed(2)} MB → ` +
      `${(totalOut / 1024).toFixed(0)} KB  (${Math.round((1 - totalOut / totalIn) * 100)}% smaller)\n`
  );
})();
