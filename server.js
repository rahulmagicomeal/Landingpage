#!/usr/bin/env node
/**
 * server.js — static host for public/ plus the POST /api/lead endpoint.
 * Zero dependencies (node:http only).
 *
 *   npm start            → http://localhost:3000
 *   PORT=8080 npm start
 *
 * Leads go to up to two sinks, and at least one must be configured:
 *
 *   data/leads.jsonl   one JSON object per line. Local dev and ordinary
 *                      servers only — serverless hosts are read-only.
 *   LEAD_WEBHOOK_URL   POSTed the record as JSON. This is the sink that
 *                      actually works in production. Point it at a Google
 *                      Apps Script web app, Zapier/Make, or your CRM.
 *
 * Every lead is also printed as a [lead-record] JSON line so it can be
 * recovered from the host's runtime logs if both sinks fail.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.jsonl');
const WEBHOOK = process.env.LEAD_WEBHOOK_URL || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/* ------------------------------------------------------------ validation */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
// Must match `form.requirementOptions` in src/data/content.js.
const REQUIREMENT_OPTIONS = ['One-time catering', 'Daily meals'];

// Optional qualification answers. Must match the *Options lists in
// src/data/content.js. All four may be blank — they are never required.
const CUISINE_OPTIONS = [
  'North Indian',
  'South Indian',
  'Multi-cuisine',
  'Regional / regional specials',
  'Continental',
  'Not decided yet',
];
const DIETARY_OPTIONS = [
  'Vegetarian only',
  'Mostly vegetarian',
  'Mixed veg and non-veg',
  'Jain options needed',
  'Vegan options needed',
  'Not sure yet',
];
const ROTATION_OPTIONS = [
  'Yes — weekly rotation',
  'Yes — fortnightly rotation',
  'Yes — monthly rotation',
  'No — fixed menu is fine',
  'Not sure yet',
];

/**
 * The meal-range labels contain en dashes ("250–499"). Those survive the
 * browser fine, but get mangled by proxies, CRMs and copy-paste. Compare on a
 * normalised form (any dash variant → "-", whitespace collapsed) so a valid
 * lead is never rejected over a character encoding.
 */
function normaliseChoice(s) {
  return String(s || '')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
const REQUIREMENT_KEYS = REQUIREMENT_OPTIONS.map(normaliseChoice);

/**
 * Optional single-choice field: blank is fine, a known value is stored in its
 * canonical spelling, and anything unrecognised is dropped rather than
 * rejected — a junk value in an optional field must never cost us the lead.
 */
function optionalChoice(raw, options) {
  const v = String(raw == null ? '' : raw).trim();
  if (!v) return '';
  const i = options.map(normaliseChoice).indexOf(normaliseChoice(v));
  return i === -1 ? '' : options[i];
}

const PINCODE_RE = /^[1-9][0-9]{5}$/;

/** Positive whole number within a sane range, or null if it is not one. */
function toCount(raw) {
  const n = Number(String(raw == null ? '' : raw).replace(/[^\d]/g, ''));
  return Number.isInteger(n) && n >= 1 && n <= 100000 ? n : null;
}

function normalisePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d;
}

/** Mirrors the client-side rules. Never trust the browser. */
function validate(body) {
  const errors = [];
  const str = (k, max = 200) => String(body[k] == null ? '' : body[k]).trim().slice(0, max);

  const lead = {
    firstName: str('firstName', 80),
    lastName: str('lastName', 80),
    company: str('company', 160),
    email: str('email', 160).toLowerCase(),
    phone: normalisePhone(body.phone),
    location: str('location', 160),
    pincode: String(body.pincode == null ? '' : body.pincode).replace(/[^\d]/g, '').slice(0, 6),
    requirement: str('requirement', 60),
    message: str('message', 2000),

    // Headcounts: PAX is people served per meal, headcount is the whole site.
    pax: toCount(body.pax),
    headcount: toCount(body.headcount),

    // Optional qualification answers.
    cuisine: optionalChoice(body.cuisine, CUISINE_OPTIONS),
    dietary: optionalChoice(body.dietary, DIETARY_OPTIONS),
    rotation: optionalChoice(body.rotation, ROTATION_OPTIONS),
  };

  // Kept so anything downstream that expects a single name field still works.
  lead.name = [lead.firstName, lead.lastName].filter(Boolean).join(' ');

  if (lead.firstName.length < 2) errors.push('firstName');
  if (lead.lastName.length < 2) errors.push('lastName');
  if (lead.company.length < 2) errors.push('company');
  if (!EMAIL_RE.test(lead.email)) errors.push('email');
  if (!(lead.phone.length === 10 && /^[6-9]/.test(lead.phone))) errors.push('phone');
  if (lead.location.length < 2) errors.push('location');
  if (!PINCODE_RE.test(lead.pincode)) errors.push('pincode');
  if (lead.pax === null) errors.push('pax');
  if (lead.headcount === null) errors.push('headcount');

  // Store the canonical label, not whatever spelling arrived.
  const reqIdx = REQUIREMENT_KEYS.indexOf(normaliseChoice(lead.requirement));
  if (reqIdx === -1) errors.push('requirement');
  else lead.requirement = REQUIREMENT_OPTIONS[reqIdx];

  return { lead, errors };
}

/* --------------------------------------------- in-memory dedupe + throttle */
const recent = new Map(); // fingerprint -> timestamp
const DEDUPE_MS = 5 * 60 * 1000;
function isDuplicate(fp) {
  const now = Date.now();
  for (const [k, t] of recent) if (now - t > DEDUPE_MS) recent.delete(k);
  if (recent.has(fp)) return true;
  recent.set(fp, now);
  return false;
}

/* ---------------------------------------------------------------- helpers */
function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (ch) => {
      size += ch.length;
      if (size > limit) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(ch);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ------------------------------------------------------------- lead route */
async function handleLead(req, res) {
  let body;
  try {
    body = JSON.parse((await readBody(req)) || '{}');
  } catch {
    return json(res, 400, { ok: false, error: 'Invalid JSON body.' });
  }

  // Honeypot: a bot filled the hidden field. Respond 200 so it doesn't retry.
  if (String(body.website || '').trim()) {
    console.log('[lead] honeypot triggered — discarded');
    return json(res, 200, { ok: true, leadId: 'hp' });
  }

  const { lead, errors } = validate(body);
  if (errors.length) {
    return json(res, 422, { ok: false, error: 'Please check the highlighted fields.', fields: errors });
  }

  const fingerprint = crypto
    .createHash('sha1')
    .update(lead.email + '|' + lead.phone)
    .digest('hex');
  if (isDuplicate(fingerprint)) {
    console.log('[lead] duplicate within 5 min — not stored again:', lead.email);
    return json(res, 200, { ok: true, leadId: 'dup-' + fingerprint.slice(0, 8), duplicate: true });
  }

  const record = {
    leadId: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    ...lead,
    // Attribution passed through from the browser.
    gclid: String(body.gclid || ''),
    utm_source: String(body.utm_source || ''),
    utm_medium: String(body.utm_medium || ''),
    utm_campaign: String(body.utm_campaign || ''),
    utm_term: String(body.utm_term || ''),
    utm_content: String(body.utm_content || ''),
    heroVariant: String(body.heroVariant || ''),
    pageUrl: String(body.pageUrl || '').slice(0, 500),
    referrer: String(body.referrer || '').slice(0, 500),
    ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString().split(',')[0].trim(),
    userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
  };

  /* --------------------------------------------------------- persistence
   * Two independent sinks, because they fail in different places:
   *
   *   1. data/leads.jsonl — works in local dev and on any ordinary server.
   *      Serverless hosts (Vercel, Netlify, Lambda) mount a READ-ONLY
   *      filesystem, so this write throws EROFS there. That is expected on
   *      those hosts and must NOT fail the request: returning 500 here is
   *      exactly what silently binned every lead on the Vercel deploy.
   *   2. LEAD_WEBHOOK_URL — the durable sink in production. Point it at a
   *      Google Apps Script web app, Zapier/Make, or the CRM directly.
   *
   * Before either is attempted the whole record goes to stdout as one JSON
   * line tagged [lead-record], so a lead stays recoverable from the host's
   * runtime logs even when both sinks are down. */
  console.log('[lead-record] ' + JSON.stringify(record));

  const stored = [];
  const failed = [];

  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(LEADS_FILE, JSON.stringify(record) + '\n', 'utf8');
    stored.push('file');
  } catch (err) {
    failed.push('file:' + (err.code || err.message));
  }

  if (WEBHOOK) {
    try {
      // Awaited on purpose. An unawaited fetch is killed the moment a
      // serverless invocation returns, which drops the lead with no trace.
      const resp = await fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(8000),
      });
      // A Google Apps Script web app cannot return a non-2xx status, so a
      // failed append still arrives as 200. Trust the body over the status
      // whenever the body is JSON that says ok:false.
      const text = (await resp.text()).slice(0, 500);
      let declined = null;
      try {
        const parsed = JSON.parse(text);
        if (parsed && parsed.ok === false) declined = parsed.error || 'ok:false';
      } catch {
        /* Not JSON. Fall back to the HTTP status alone. */
      }
      if (!resp.ok) failed.push('webhook:' + resp.status);
      else if (declined) failed.push('webhook:' + declined);
      else stored.push('webhook');
    } catch (err) {
      failed.push('webhook:' + err.message);
    }
  }

  console.log(
    `[lead] ${record.leadId}  ${record.company}  ${record.pax} pax  ` +
      `${record.requirement}  ${record.location}  ` +
      `stored=[${stored.join(',') || 'none'}]` +
      (failed.length ? ` failed=[${failed.join(',')}]` : '')
  );

  if (!stored.length) {
    // The visitor has already done the work of filling the form. Turning
    // them away loses the lead AND the visitor, so acknowledge it — the
    // full record is in the [lead-record] line above, and make the gap
    // impossible to miss in the logs.
    console.error(
      '[lead] NO DURABLE SINK ACCEPTED THIS LEAD. Set LEAD_WEBHOOK_URL. ' +
        'Recoverable only from runtime logs: leadId=' + record.leadId
    );
  }

  return json(res, 200, { ok: true, leadId: record.leadId });
}

/* ----------------------------------------------------------- static files */
function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';

  const filePath = path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h1>404</h1><p><a href="/">Go to the landing page</a></p>');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    // HTML must never be cached: it carries the hashed ?v= links to CSS/JS,
    // so a stale copy would pin visitors to stale assets. Everything else is
    // either content-hashed (css/js) or genuinely immutable (images, fonts).
    const isHtml = ext === '.html';
    const hashed = /\.(css|js)$/.test(ext);
    const immutable = /\.(woff2|png|jpe?g|webp|svg|ico)$/.test(ext);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': isHtml
        ? 'no-cache, must-revalidate'
        : immutable || hashed
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

/* ------------------------------------------------------------------ serve */
http
  .createServer((req, res) => {
    if (req.method === 'POST' && req.url.split('?')[0] === '/api/lead') {
      handleLead(req, res).catch((err) => {
        console.error('[lead] unhandled:', err);
        json(res, 500, { ok: false, error: 'Server error.' });
      });
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD, POST' }).end('Method not allowed');
      return;
    }
    serveStatic(req, res);
  })
  .listen(PORT, () => {
    console.log(`\n  Magicomeal LP running at http://localhost:${PORT}`);
    console.log(`  Leads → ${path.relative(__dirname, LEADS_FILE)}`);
    console.log(`  Webhook → ${WEBHOOK || '(not set — export LEAD_WEBHOOK_URL to forward leads)'}\n`);
  });
