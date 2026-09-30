#!/usr/bin/env node
/**
 * server.js — static host for public/ plus the POST /api/lead endpoint.
 * Zero dependencies (node:http only).
 *
 *   npm start            → http://localhost:3000
 *   PORT=8080 npm start
 *
 * Leads are appended to data/leads.jsonl (one JSON object per line) and,
 * if LEAD_WEBHOOK_URL is set, forwarded to that URL as JSON. Point it at
 * your CRM, Zapier/Make, or a WordPress endpoint when you deploy.
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
const MEAL_OPTIONS = ['50–99', '100–249', '250–499', '500–999', '1,000+', 'Not sure yet'];
// Must match `form.requirementOptions` in src/data/content.js.
const REQUIREMENT_OPTIONS = ['Daily corporate meals', 'Institutional catering'];

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
const MEAL_KEYS = MEAL_OPTIONS.map(normaliseChoice);
const REQUIREMENT_KEYS = REQUIREMENT_OPTIONS.map(normaliseChoice);

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
    name: str('name', 120),
    company: str('company', 160),
    email: str('email', 160).toLowerCase(),
    phone: normalisePhone(body.phone),
    location: str('location', 160),
    meals: str('meals', 40),
    requirement: str('requirement', 60),
    message: str('message', 2000),
  };

  if (lead.name.length < 2) errors.push('name');
  if (lead.company.length < 2) errors.push('company');
  if (!EMAIL_RE.test(lead.email)) errors.push('email');
  if (!(lead.phone.length === 10 && /^[6-9]/.test(lead.phone))) errors.push('phone');
  if (lead.location.length < 2) errors.push('location');
  // Store the canonical label, not whatever spelling arrived.
  const mealIdx = MEAL_KEYS.indexOf(normaliseChoice(lead.meals));
  if (mealIdx === -1) errors.push('meals');
  else lead.meals = MEAL_OPTIONS[mealIdx];

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

  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.appendFileSync(LEADS_FILE, JSON.stringify(record) + '\n', 'utf8');
  } catch (err) {
    console.error('[lead] failed to write leads.jsonl:', err.message);
    return json(res, 500, { ok: false, error: 'Could not store the enquiry.' });
  }

  console.log(
    `[lead] ${record.leadId}  ${record.company}  ${record.meals} meals/day  ${record.requirement}  ${record.location}`
  );

  if (WEBHOOK) {
    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }).catch((err) => console.error('[lead] webhook failed:', err.message));
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
