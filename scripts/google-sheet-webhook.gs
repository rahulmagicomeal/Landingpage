/**
 * google-sheet-webhook.gs — durable lead storage for the landing page.
 *
 * Serverless hosts (Vercel, Netlify) have a read-only filesystem, so the
 * server cannot keep data/leads.jsonl in production. This Apps Script takes
 * its place: it receives each lead as JSON and appends a row to a Google
 * Sheet you already own. No third-party service, no monthly cost.
 *
 * SETUP (about five minutes)
 *   1. Create a new Google Sheet. Name the first tab "Leads".
 *   2. Extensions -> Apps Script. Delete the sample code, paste this file.
 *   3. Deploy -> New deployment -> type "Web app".
 *        Execute as:        Me
 *        Who has access:    Anyone                 <-- required; the server
 *                                                      posts without a login
 *   4. Authorise when prompted, then copy the /exec web app URL.
 *   5. Put that URL in the host's environment as LEAD_WEBHOOK_URL
 *      (Vercel: Project -> Settings -> Environment Variables), then redeploy.
 *   6. Submit the form once and confirm a row appears.
 *
 * NOTE ON "Anyone": the URL is unguessable, and this script only ever
 * appends. It never reads or returns sheet contents, so a leaked URL means
 * someone could add junk rows — not read your leads.
 */

/* Column order. Add new fields at the END so existing rows stay aligned. */
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

function doPost(e) {
  try {
    var lead = JSON.parse(e.postData.contents);
    var sheet = getSheet_();

    var row = HEADERS.map(function (key) {
      var v = lead[key];
      return v === undefined || v === null ? '' : String(v);
    });
    sheet.appendRow(row);

    return reply_({ ok: true });
  } catch (err) {
    // Returning a non-2xx is not possible from Apps Script, so the server
    // treats any body it cannot parse as a failure. Log it here too: the
    // execution log is the only place this is visible.
    console.error('lead append failed: ' + err);
    return reply_({ ok: false, error: String(err) });
  }
}

/* A GET is handy for checking the deployment is live from a browser. */
function doGet() {
  return reply_({ ok: true, note: 'Lead webhook is deployed. POST JSON to store a lead.' });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Leads') || ss.insertSheet('Leads');
  // Write the header row once, and freeze it so the sheet stays readable.
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
