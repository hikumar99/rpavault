/**
 * Google Apps Script for RPAVault Website Lead Capture & Google Sheets Sync
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets (create a new spreadsheet or use your existing leads sheet).
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any default code, paste this entire script, and save (Cmd+S or Ctrl+S).
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set "Description": "RPAVault Lead Capture Webhook".
 * 7. Set "Execute as": "Me (your email address)".
 * 8. Set "Who has access": "Anyone" (CRITICAL: allows the website form to submit leads).
 * 9. Click "Deploy", authorize permissions when prompted, and copy the "Web app URL" (ends in /exec).
 * 10. Paste this URL into `_data/settings.json` under `forms.webhook_endpoint`.
 */

// ================= CONFIGURATION =================
const CONFIG = {
  SHEET_NAME: "Website_Leads",
  NOTIFICATION_EMAIL: "info@rpavault.com", // Set your notification recipient or leave empty
  ENABLE_EMAIL_NOTIFICATION: false        // Set to true if you want instant email alerts from Google
};

const EXPECTED_HEADERS = [
  "Timestamp",
  "Form Type Name",
  "Full Name",
  "Email Address",
  "Phone / WhatsApp",
  "Topic / Interest",
  "Course Interest",
  "Message / Notes",
  "Source Page Path",
  "Source Page Title",
  "City",
  "Region",
  "Country",
  "IP Address",
  "Operating System",
  "Browser",
  "Device Type",
  "Referrer",
  "Time on Page (sec)",
  "Timezone",
  "Visitor ID",
  "Visit Count",
  "First Visit Date",
  "Session Trail",
  "Local Time Submitted"
];

// ================= WEB ENDPOINT (doPost) =================
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Wait up to 30 seconds for lock acquisition to prevent concurrent row overlap
    lock.waitLock(30000);

    // 1. Parse incoming payload (supports JSON and form-urlencoded)
    let data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (_) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    }

    // 2. Auto-heal sheet headers if empty or outdated
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(EXPECTED_HEADERS);
      const headerRange = sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length);
      headerRange.setBackground("#0058b0").setFontColor("#ffffff").setFontWeight("bold");
      sheet.setFrozenRows(1);
    } else if (sheet.getLastColumn() < EXPECTED_HEADERS.length) {
      sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).setValues([EXPECTED_HEADERS]);
      const headerRange = sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length);
      headerRange.setBackground("#0058b0").setFontColor("#ffffff").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // 3. Extract Form Type Name with comprehensive fallback aliases
    const formTypeName = (
      data.form_type_name || 
      data.form_type || 
      data["Form Type Name"] || 
      data["Form Type"] || 
      data["Form Name"] || 
      data.form_name || 
      data.formType || 
      data.persona || 
      data._subject || 
      "Website Lead Form"
    ).toString().trim();

    // 4. Extract Contact & Form Details
    const name = (data.name || data.fullName || data["Full Name"] || "").toString().trim();
    const email = (data.email || data.emailAddress || data["Email Address"] || "").toString().trim().toLowerCase();
    const phone = (data.phone || data.mobile || data["Phone / WhatsApp"] || "").toString().trim();
    const topic = (data.topic || data.interest || data["I’m interested in"] || data.target_role_stack || "").toString().trim();
    const course = (data.course || data.course_interest || data.course_name || data["Which course?"] || data.track || "").toString().trim();
    
    let message = (data.message || data.description || data.comments || data.notes || "").toString().trim();
    if (data.experience_requirement) {
      message = (message ? message + " | Experience: " : "Experience: ") + data.experience_requirement;
    }

    // Extract questionnaire Q&A if present
    const quizAnswers = [];
    Object.keys(data).forEach(k => {
      if (k.startsWith("Q") && k.includes("—")) {
        quizAnswers.push(k + ": " + data[k]);
      } else if (k === "q1" || k === "q2" || k === "q3") {
        quizAnswers.push(k.toUpperCase() + ": " + data[k]);
      }
    });
    if (quizAnswers.length > 0) {
      message = (message ? message + " | " : "") + quizAnswers.join(" | ");
    }

    // 5. Extract Session & Telemetry Details
    const sourcePage = (data.source_page || data["Session: Source Page Path"] || data.source || "").toString().trim();
    const sourceTitle = (data.source_page_title || data["Session: Source Page Title"] || "").toString().trim();
    const city = (data.visitor_city || data["Geo: City"] || "").toString().trim();
    const region = (data.visitor_region || data["Geo: Region"] || "").toString().trim();
    const country = (data.visitor_country || data["Geo: Country"] || "").toString().trim();
    const ip = (data.visitor_ip || data["Geo: IP Address"] || "").toString().trim();
    const os = (data.operating_system || data["Device: OS"] || "").toString().trim();
    const browser = (data.browser || data["Device: Browser"] || "").toString().trim();
    const device = (data.device_type || data["Device: Type"] || "").toString().trim();
    const referrer = (data.referrer || data["Session: Current Referrer"] || data["Session: Referrer"] || "direct").toString().trim();
    const timeOnPage = (data.time_on_page_seconds || data["Session: Time Spent on Page (sec)"] || "").toString().trim();
    const timezone = (data.timezone || data["Session: Timezone"] || "").toString().trim();
    const visitorId = (data.visitor_id || data["Session: Visitor ID"] || "").toString().trim();
    const visitCount = (data.visit_count || data["Session: Visit Count"] || "").toString().trim();
    const firstVisit = (data.first_visit_date || data["Session: First Visit Date"] || "").toString().trim();
    const sessionPath = (data.session_path || data["Session: Path Trail"] || "").toString().trim();
    const localTime = (data.submitted_at_local || data["Session: Local Time Submitted"] || new Date().toString()).toString().trim();

    const timestamp = new Date();

    // 6. Append Row to Sheet
    const newRow = [
      timestamp,
      formTypeName,
      name,
      email,
      phone,
      topic,
      course,
      message,
      sourcePage,
      sourceTitle,
      city,
      region,
      country,
      ip,
      os,
      browser,
      device,
      referrer,
      timeOnPage,
      timezone,
      visitorId,
      visitCount,
      firstVisit,
      sessionPath,
      localTime
    ];

    sheet.appendRow(newRow);

    // Optional email notification
    if (CONFIG.ENABLE_EMAIL_NOTIFICATION && CONFIG.NOTIFICATION_EMAIL) {
      try {
        MailApp.sendEmail({
          to: CONFIG.NOTIFICATION_EMAIL,
          subject: `⚡ New Lead: [${formTypeName}] - ${name || email || "Visitor"}`,
          htmlBody: `
            <h3>New Website Lead Received</h3>
            <p><strong>Form Type:</strong> ${formTypeName}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Topic / Role:</strong> ${topic}</p>
            <p><strong>Course:</strong> ${course}</p>
            <p><strong>Message / Notes:</strong> ${message}</p>
            <p><strong>Source Page:</strong> ${sourcePage}</p>
            <p><strong>Location:</strong> ${city}, ${region}, ${country} (IP: ${ip})</p>
          `
        });
      } catch (mailErr) {
        console.warn("Lead email notification failed:", mailErr);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Lead recorded successfully",
      form_type_name: formTypeName
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error("doPost error:", err);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ================= TEST ENDPOINT (doGet) =================
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "RPAVault Website Leads Webhook",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
