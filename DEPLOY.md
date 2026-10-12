# Deploying to magicomeal.com

Verified about the live host on 12 Oct 2026:

| | |
| --- | --- |
| Server | LiteSpeed |
| PHP | 8.2.34 |
| CMS | WordPress (`wp-content`, `wp-includes`, `wp-login.php` all respond) |
| `/corporate-catering-mumbai/` | nothing there yet |
| `/corporate-catering-services-mumbai/` | exists, returns 200 |
| Root `robots.txt` | already allows everything |

Because the host runs PHP, **Vercel is no longer needed**. The page goes
on the real domain, and `lead.php` stores each enquiry on disk *and* emails
it to sales. No webhook, no Google Sheet, no reverse proxy, no third party.

---

## 1. Upload

Upload the **contents of `public/`** (not the folder itself) into a new
directory `corporate-catering-mumbai/` in the web root — the same directory
that contains `wp-content/` and `wp-includes/`, usually `public_html/`.

```
public_html/
└── corporate-catering-mumbai/
    ├── .htaccess          <- easy to miss: WinSCP hides dotfiles by default
    ├── index.html
    ├── lead.php
    ├── sitemap.xml
    └── assets/
```

Two things to watch:

- **`.htaccess` is a hidden file.** In WinSCP turn on
  Options → Preferences → Panels → "Show hidden files" (Ctrl+Alt+H) before
  you drag, or it will be silently skipped and caching, compression and the
  lead-store protection all go with it.
- **Do not upload `robots.txt`.** It only has any effect at a domain root,
  and the root one already allows crawling. Uploading it here does nothing;
  overwriting the root one would drop the existing
  `sitemap_index.xml` reference.

Transfer mode: **Binary** (the default). ASCII mode corrupts `.webp` files.

## 2. Test `lead.php` before you tell anyone the page exists

I could not run PHP locally — there is no PHP on this machine — so the file
has been checked structurally but **not executed**. The first real run has
to be on the server. Do it before the page is public, not after.

```bash
curl -i -X POST "https://magicomeal.com/corporate-catering-mumbai/lead.php" -H "Content-Type: application/json" -d "{\"firstName\":\"Test\",\"lastName\":\"Lead\",\"phone\":\"9820011223\",\"email\":\"you@yourdomain.com\",\"company\":\"Test Co\",\"location\":\"Andheri East, Mumbai\",\"pincode\":\"400093\",\"requirement\":\"Daily meals\",\"pax\":\"120\",\"headcount\":\"180\"}"
```

Expected: `HTTP/1.1 200` and a body like `{"ok":true,"leadId":"a1b2…"}`.

- **A blank response or HTTP 500** means a PHP parse or runtime error. The
  message will be in the hosting control panel's PHP error log — send it to
  me and I will fix it.
- **HTTP 422** with a `fields` array means validation rejected the payload;
  the listed field names tell you which.
- **HTTP 403 / a WordPress page** means the catch-all redirect caught it —
  see step 3.

Then check **both** sinks actually worked:

1. An email arrived at `sales@magicomeal.com`, subject
   `Corporate catering enquiry: Test Co (Daily meals, 120 PAX)`.
   Check spam. Hitting reply should address the enquirer, not the website.
2. A line was appended to `leads.jsonl` — look in `magicomeal-leads/`
   one level **above** the web root, or in
   `corporate-catering-mumbai/_leads/` if the host confines PHP to the web
   root.

### If the email does not arrive

`lead.php` sends as `no-reply@magicomeal.com`. If that address does not
exist as a mailbox or alias, the domain's SPF record may cause the host or
the recipient to drop the message. Either create the alias, or change
`MAIL_FROM` at the top of `lead.php` to an address that does exist.

The lead is still saved to `leads.jsonl` even when mail fails, so nothing
is lost while you sort this out.

## 3. Confirm the page is actually reachable

```bash
curl -sS -o /dev/null -w "%{http_code} %{url_effective}\n" -L "https://magicomeal.com/corporate-catering-mumbai/"
```

Expected: `200 https://magicomeal.com/corporate-catering-mumbai/`.

**If it redirects to the homepage**, something is catching the URL before
the directory is served. Today an unknown path like
`/zzz-no-such-page-12345/` 301s to `https://magicomeal.com` — that is a
catch-all, and a real directory should take precedence over it. If it does
not, the cause is one of:

- a redirect plugin in WordPress with a rule for this slug — delete the rule;
- a `RedirectMatch` or `Redirect` line in the root `.htaccess`, which runs
  *before* the directory check — add an exclusion for this path;
- a WordPress page or post already using the slug `corporate-catering-mumbai`
  — rename or trash it.

## 4. Confirm the lead store is not public

This is the one that matters most. The file is your entire sales pipeline.

```bash
curl -sS -o /dev/null -w "leads.jsonl -> %{http_code}\n" "https://magicomeal.com/corporate-catering-mumbai/_leads/leads.jsonl"
```

**Anything other than 403 or 404 is a data leak — stop and tell me.**
A `200` means the `.htaccess` guards are not being honoured and the file
must be moved above the web root immediately.

## 5. Submit to Google

- Search Console → URL Inspection → `https://magicomeal.com/corporate-catering-mumbai/` → Request Indexing.
- Search Console → Sitemaps → submit `corporate-catering-mumbai/sitemap.xml`.
  The root `robots.txt` points at `sitemap_index.xml` (Yoast or similar);
  adding this page to that index works equally well if you prefer.
- Point the Google Ads final URL at the new page.

## 6. Retire the competing page

`/corporate-catering-services-mumbai/` currently returns 200 and targets the
same query. Once the new page is live and indexed, 301-redirect the old one
to it, so the two stop competing for the same search.

---

## Still outstanding

1. **`tracking.adsConversionLabel` in `src/data/config.js` is empty.** Until
   it is set, GA4 and the dataLayer receive every event but **Google Ads
   records no conversions** — you would be buying clicks with no way to see
   which ones became enquiries. Google Ads → Goals → Conversions → your lead
   action → Tag setup → "Use Google Tag Manager" → copy the Conversion Label.
   `npm run build` warns while it is blank.
2. Confirm WhatsApp is monitored on +91 93200 22422 — the page offers it.
3. magicomeal.com still says "15,000+ meals cooked daily" while this page
   says "18,000+ meals served daily", and the site does not mention the two
   kitchens. The two should agree.

## What is no longer needed

- The Vercel deployment, the subdomain, and the email to the hosting
  provider about a redirect or reverse proxy. The page is on the real
  domain, so it inherits the domain's authority directly.
- `scripts/google-sheet-webhook.gs` and `LEAD_WEBHOOK_URL`. Keep them only
  if you also want leads pushed into a Google Sheet or CRM; `server.js`
  still supports it, and `lead.php` does not need it.
