/**
 * google-sheet-webhook.gs — writes each website lead into a Google Sheet.
 *
 * public/lead.php POSTs every enquiry here as JSON and this appends a row.
 * The sheet is an extra copy, not the only one: lead.php also writes
 * leads.jsonl on the server and emails sales@magicomeal.com, and it still
 * does both if this script is down.
 *
 * ---------------------------------------------------------------- SETUP
 *  1. Create a Google Sheet. Name the first tab exactly: Leads
 *       (or don't — the script creates it on the first lead.)
 *  2. Extensions -> Apps Script. Delete the sample code, paste this file,
 *     and save.
 *  3. Deploy -> New deployment -> gear icon -> Web app.
 *       Description     : anything
 *       Execute as      : Me
 *       Who has access  : Anyone          <-- required
 *  4. Deploy, then Authorize access and accept the Google warning screen
 *     ("Go to <project> (unsafe)" — it says that for every personal script).
 *  5. Copy the Web app URL. It ends in /exec.
 *  6. Paste it into public/lead.php as SHEET_WEBHOOK_URL, re-upload
 *     lead.php, and submit the form once to confirm a row appears.
 *
 * On "Who has access: Anyone" — the server posts without a Google login, so
 * there is no alternative. The URL is unguessable and this script only ever
 * appends: it never reads the sheet and never returns its contents. A
 * leaked URL would let someone add junk rows, not read your leads.
 *
 * IMPORTANT: editing this file does not change what is live. Deploy ->
 * Manage deployments -> edit -> Version: New version -> Deploy.
 */

/* Column order. Add new fields at the END so existing rows stay aligned
 * with their headers. Names must match the JSON keys lead.php sends. */
var HEADERS = [
  'receivedAt',
  'leadId',
  'firstName',
  'lastName',
  'phone',
  'email',
  'company',
  'location',
  'pincode',
  'requirement',
  'pax',
  'headcount',
  'cuisine',
  'dietary',
  'rotation',
  'message',
  'gclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'heroVariant',
  'pageUrl',
  'referrer',
  'ip',
  'userAgent',
];

var SHEET_NAME = 'Leads';

function doPost(e) {
  // Two forms submitted in the same second would otherwise both read the
  // same last row and one would overwrite the other.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return reply_({ ok: false, error: 'busy' });
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return reply_({ ok: false, error: 'no body' });
    }
    var lead = JSON.parse(e.postData.contents);

    var sheet = getSheet_();
    sheet.appendRow(
      HEADERS.map(function (key) {
        var v = lead[key];
        return v === undefined || v === null ? '' : String(v);
      })
    );

    return reply_({ ok: true });
  } catch (err) {
    // lead.php treats ok:false as a failure and logs it, so this is visible
    // on the server as well as in View -> Executions here.
    console.error('lead append failed: ' + err);
    return reply_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* Opening the /exec URL in a browser should say the deployment is live.
 * Handy for checking step 5 before touching lead.php. */
function doGet() {
  return reply_({ ok: true, note: 'Lead webhook is deployed. POST JSON to store a lead.' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Run this once from the Apps Script editor (Run -> testAppend) to prove
 * the sheet side works before involving the website at all. It writes one
 * obvious dummy row for you to delete.
 */
function testAppend() {
  getSheet_().appendRow(
    HEADERS.map(function (k) {
      if (k === 'company') return 'TEST ROW - delete me';
      if (k === 'receivedAt') return new Date().toISOString();
      if (k === 'firstName') return 'Test';
      if (k === 'lastName') return 'Row';
      return '';
    })
  );
}
