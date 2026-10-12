<?php
/**
 * lead.php — form endpoint for the corporate-catering landing page.
 *
 * A faithful port of the validation in server.js, for the LiteSpeed/PHP
 * hosting that magicomeal.com already runs on. Unlike a serverless host,
 * this box has a writable disk and a working mail(), so every lead is
 * stored twice and emailed once:
 *
 *   1. emailed to NOTIFY_TO with Reply-To set to the enquirer, so the sales
 *      reply is one click and lands in their inbox.
 *   2. appended to leads.jsonl, kept OUTSIDE the web root wherever the host
 *      allows it. This file must never be fetchable over HTTP.
 *
 * Responses match server.js exactly, so public/assets/js/main.js needs no
 * change: {"ok":true,"leadId":...} or {"ok":false,"error":...,"fields":[...]}.
 */

declare(strict_types=1);

const NOTIFY_TO   = 'sales@magicomeal.com';
const MAIL_FROM   = 'no-reply@magicomeal.com';   // must be on this domain
const DEDUPE_SECS = 300;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

/* mbstring is present on virtually every host that runs WordPress, but a
 * missing extension here would be a fatal error on the one page that has to
 * work. The fallbacks are byte-based: for the Latin input this form accepts
 * they behave identically, and for anything else they only ever truncate a
 * little early, which is better than a 500. */
if (!function_exists('mb_strtolower')) {
    function mb_strtolower(string $s, ?string $enc = null): string { return strtolower($s); }
}
if (!function_exists('mb_strlen')) {
    function mb_strlen(string $s, ?string $enc = null): int { return strlen($s); }
}
if (!function_exists('mb_substr')) {
    function mb_substr(string $s, int $start, ?int $len = null, ?string $enc = null): string {
        return $len === null ? substr($s, $start) : substr($s, $start, $len);
    }
}

function reply(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    reply(405, ['ok' => false, 'error' => 'Use POST.']);
}

/* main.js sends JSON. A normal form post is accepted too, so the endpoint
 * still works if a tool posts to it directly. */
$raw  = file_get_contents('php://input');
$body = json_decode($raw === false ? '' : $raw, true);
if (!is_array($body)) {
    $body = $_POST;
}

/* Honeypot. Answer 200 so the bot records success and does not retry. */
if (trim((string)($body['website'] ?? '')) !== '') {
    reply(200, ['ok' => true, 'leadId' => 'hp']);
}

/* ------------------------------------------------------------ validation */

const REQUIREMENT_OPTIONS = ['One-time catering', 'Daily meals'];
const CUISINE_OPTIONS = [
    'North Indian', 'South Indian', 'Multi-cuisine',
    'Regional / regional specials', 'Continental', 'Not decided yet',
];
const DIETARY_OPTIONS = [
    'Vegetarian only', 'Mostly vegetarian', 'Mixed veg and non-veg',
    'Jain options needed', 'Vegan options needed', 'Not sure yet',
];
const ROTATION_OPTIONS = [
    'Yes — weekly rotation', 'Yes — fortnightly rotation',
    'Yes — monthly rotation', 'No — fixed menu is fine', 'Not sure yet',
];

/**
 * Labels travel through browsers, proxies and copy-paste, all of which
 * rewrite dashes and whitespace. Compare on a normalised form so a valid
 * lead is never rejected over a character encoding.
 */
function normalise_choice($s): string {
    $s = (string)$s;
    $s = preg_replace('/[\x{2010}-\x{2015}\x{2212}]/u', '-', $s) ?? $s;
    $s = preg_replace('/\s+/u', ' ', $s) ?? $s;
    return mb_strtolower(trim($s), 'UTF-8');
}

function optional_choice($raw, array $options): string {
    if (trim((string)$raw) === '') {
        return '';
    }
    $want = normalise_choice($raw);
    foreach ($options as $opt) {
        if (normalise_choice($opt) === $want) {
            return $opt;   // store the canonical spelling, not what arrived
        }
    }
    return '';
}

function normalise_phone($raw): string {
    $d = preg_replace('/\D/', '', (string)$raw) ?? '';
    if (strlen($d) > 10 && str_starts_with($d, '91')) {
        $d = substr($d, 2);
    }
    if (strlen($d) === 11 && str_starts_with($d, '0')) {
        $d = substr($d, 1);
    }
    return $d;
}

/** Positive whole number in a sane range, or null if it is not one. */
function to_count($raw): ?int {
    $digits = preg_replace('/\D/', '', (string)$raw) ?? '';
    if ($digits === '') {
        return null;
    }
    $n = (int)$digits;
    return ($n >= 1 && $n <= 100000) ? $n : null;
}

function field(array $body, string $key, int $max): string {
    return mb_substr(trim((string)($body[$key] ?? '')), 0, $max, 'UTF-8');
}

$lead = [
    'firstName'   => field($body, 'firstName', 80),
    'lastName'    => field($body, 'lastName', 80),
    'company'     => field($body, 'company', 160),
    'email'       => mb_strtolower(field($body, 'email', 160), 'UTF-8'),
    'phone'       => normalise_phone($body['phone'] ?? ''),
    'location'    => field($body, 'location', 160),
    'pincode'     => substr(preg_replace('/\D/', '', (string)($body['pincode'] ?? '')) ?? '', 0, 6),
    'requirement' => field($body, 'requirement', 60),
    'message'     => field($body, 'message', 2000),

    // PAX is people served per meal; headcount is the whole site.
    'pax'         => to_count($body['pax'] ?? null),
    'headcount'   => to_count($body['headcount'] ?? null),

    // Optional qualification answers. All may be blank.
    'cuisine'     => optional_choice($body['cuisine'] ?? '', CUISINE_OPTIONS),
    'dietary'     => optional_choice($body['dietary'] ?? '', DIETARY_OPTIONS),
    'rotation'    => optional_choice($body['rotation'] ?? '', ROTATION_OPTIONS),
];

/* Kept so anything downstream expecting a single name field still works. */
$lead['name'] = trim($lead['firstName'] . ' ' . $lead['lastName']);

$errors = [];
if (mb_strlen($lead['firstName'], 'UTF-8') < 2) { $errors[] = 'firstName'; }
if (mb_strlen($lead['lastName'], 'UTF-8') < 2)  { $errors[] = 'lastName'; }
if (mb_strlen($lead['company'], 'UTF-8') < 2)   { $errors[] = 'company'; }
if (!preg_match('/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i', $lead['email'])) { $errors[] = 'email'; }
if (!(strlen($lead['phone']) === 10 && preg_match('/^[6-9]/', $lead['phone']))) { $errors[] = 'phone'; }
if (mb_strlen($lead['location'], 'UTF-8') < 2)  { $errors[] = 'location'; }
if (!preg_match('/^[1-9][0-9]{5}$/', $lead['pincode'])) { $errors[] = 'pincode'; }
if ($lead['pax'] === null)       { $errors[] = 'pax'; }
if ($lead['headcount'] === null) { $errors[] = 'headcount'; }

$req = optional_choice($lead['requirement'], REQUIREMENT_OPTIONS);
if ($req === '') {
    $errors[] = 'requirement';
} else {
    $lead['requirement'] = $req;   // canonical label, not whatever arrived
}

if ($errors) {
    reply(422, [
        'ok'     => false,
        'error'  => 'Please check the highlighted fields.',
        'fields' => $errors,
    ]);
}

/* --------------------------------------------------------------- storage */

/**
 * Leads must never be fetchable over HTTP — the file is the whole sales
 * pipeline. Preference order:
 *   1. a directory one level ABOVE the web root, unreachable by URL at all;
 *   2. ./_leads/ behind a deny-all .htaccess, for hosts that confine PHP to
 *      the web root (common on shared hosting).
 */
function lead_store_dir(): ?string {
    $candidates = [];
    $docRoot = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
    if ($docRoot !== '') {
        $candidates[] = rtrim(dirname($docRoot), '/\\') . '/magicomeal-leads';
    }
    $candidates[] = __DIR__ . '/_leads';

    foreach ($candidates as $dir) {
        if (!is_dir($dir) && !@mkdir($dir, 0750, true) && !is_dir($dir)) {
            continue;
        }
        if (!is_writable($dir)) {
            continue;
        }
        /* Belt and braces for the in-web-root fallback: if the server
         * ignores one guard it should still trip over another. */
        if (str_starts_with($dir, __DIR__)) {
            $ht = $dir . '/.htaccess';
            if (!file_exists($ht)) {
                @file_put_contents($ht, implode("\n", [
                    '<IfModule mod_authz_core.c>',
                    '  Require all denied',
                    '</IfModule>',
                    '<IfModule !mod_authz_core.c>',
                    '  Order allow,deny',
                    '  Deny from all',
                    '</IfModule>',
                    '',
                ]));
            }
            if (!file_exists($dir . '/index.html')) {
                @file_put_contents($dir . '/index.html', '');
            }
        }
        return $dir;
    }
    return null;
}

$leadId = bin2hex(random_bytes(8));
$record = $lead + [
    'leadId'       => $leadId,
    'receivedAt'   => gmdate('c'),
    // Attribution passed through from the browser.
    'gclid'        => field($body, 'gclid', 200),
    'utm_source'   => field($body, 'utm_source', 120),
    'utm_medium'   => field($body, 'utm_medium', 120),
    'utm_campaign' => field($body, 'utm_campaign', 160),
    'utm_term'     => field($body, 'utm_term', 160),
    'utm_content'  => field($body, 'utm_content', 160),
    'heroVariant'  => field($body, 'heroVariant', 8),
    'pageUrl'      => field($body, 'pageUrl', 500),
    'referrer'     => field($body, 'referrer', 500),
    'ip'           => trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? ''))[0]),
    'userAgent'    => mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300, 'UTF-8'),
];

$dir = lead_store_dir();

/* Double submits happen: impatient click, bad signal, browser retry. PHP
 * keeps no memory between requests, so recent fingerprints live in a small
 * file that is pruned on every write. */
if ($dir !== null) {
    $fpFile = $dir . '/recent.json';
    $fp     = hash('sha1', $lead['email'] . '|' . $lead['phone']);
    $now    = time();
    $recent = [];
    if (is_file($fpFile)) {
        $decoded = json_decode((string)@file_get_contents($fpFile), true);
        if (is_array($decoded)) {
            $recent = $decoded;
        }
    }
    foreach ($recent as $k => $t) {
        if (!is_int($t) || $now - $t > DEDUPE_SECS) {
            unset($recent[$k]);
        }
    }
    if (isset($recent[$fp])) {
        reply(200, ['ok' => true, 'leadId' => 'dup-' . substr($fp, 0, 8), 'duplicate' => true]);
    }
    $recent[$fp] = $now;
    @file_put_contents($fpFile, json_encode($recent), LOCK_EX);
}

$stored = [];

if ($dir !== null) {
    $line  = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
    $bytes = @file_put_contents($dir . '/leads.jsonl', $line, FILE_APPEND | LOCK_EX);
    if ($bytes !== false) {
        $stored[] = 'file';
    }
}

/* ----------------------------------------------------------------- email */

$labels = [
    'name'        => 'Name',
    'company'     => 'Company',
    'phone'       => 'Mobile',
    'email'       => 'Email',
    'location'    => 'Location',
    'pincode'     => 'PIN code',
    'requirement' => 'Requirement',
    'pax'         => 'PAX per meal',
    'headcount'   => 'Total headcount',
    'cuisine'     => 'Cuisine',
    'dietary'     => 'Dietary mix',
    'rotation'    => 'Rotating menu',
    'message'     => 'Message',
];
$lines = [];
foreach ($labels as $key => $label) {
    $val = $record[$key] ?? '';
    if ($val !== '' && $val !== null) {
        $lines[] = str_pad($label, 16) . ': ' . $val;
    }
}
$lines[] = '';
$lines[] = str_repeat('-', 46);
$lines[] = 'Lead ID         : ' . $leadId;
$lines[] = 'Received        : ' . gmdate('d M Y, H:i') . ' UTC';
if ($record['gclid'] !== '') {
    $lines[] = 'Google Ads      : yes (gclid present)';
}
if ($record['utm_source'] !== '') {
    $lines[] = 'Source          : ' . $record['utm_source'] . ' / ' . $record['utm_campaign'];
}
$lines[] = 'Page            : ' . $record['pageUrl'];

$subject = sprintf(
    'Corporate catering enquiry: %s (%s, %d PAX)',
    $record['company'],
    $record['requirement'],
    (int)$record['pax']
);

/* A newline in a mail header is an injection vector. Both of these values
 * came from the request, so strip CR/LF before they reach a header. */
$subject = str_replace(["\r", "\n"], ' ', $subject);
$replyTo = str_replace(["\r", "\n"], '', $record['email']);
$replyNm = str_replace(["\r", "\n"], '', $record['name']);

$headers = implode("\r\n", [
    'From: Magicomeal Website <' . MAIL_FROM . '>',
    'Reply-To: ' . $replyNm . ' <' . $replyTo . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: magicomeal-lp',
]);

if (@mail(NOTIFY_TO, $subject, implode("\n", $lines) . "\n", $headers, '-f' . MAIL_FROM)) {
    $stored[] = 'email';
}

if (!$stored) {
    /* Both sinks are down. The visitor has already done the work of filling
     * the form, so acknowledge it rather than losing the lead AND the
     * visitor — this line keeps it recoverable from the PHP error log. */
    error_log('[lead] NO SINK ACCEPTED THIS LEAD ' . json_encode($record, JSON_UNESCAPED_SLASHES));
}

reply(200, ['ok' => true, 'leadId' => $leadId]);
