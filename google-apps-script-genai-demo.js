/**
 * Google Apps Script for RPAVault GenAI Demo Registration & Automated Mailer
 * 
 * SETUP INSTRUCTIONS:
 * 1. Open Google Sheets (create a new spreadsheet or use your existing one).
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any code in the editor, paste this entire script, and save (Cmd+S or Ctrl+S).
 * 4. Click "Deploy" > "New deployment".
 * 5. Select type: "Web app".
 * 6. Set "Execute as": "Me (your email)".
 * 7. Set "Who has access": "Anyone" (CRITICAL: this allows the website form to post data).
 * 8. Click "Deploy", authorize access when prompted, and copy the "Web app URL" (ends in /exec).
 * 9. Paste that Web app URL into join-demo.html (under GOOGLE_SHEET_ENDPOINT).
 * 
 * TO AUTOMATE THE 30-MINUTE REMINDER EMAIL:
 * In Apps Script, select the function "setupDemoReminderTrigger" from the dropdown and click "Run".
 * That's it! Google will automatically trigger the reminder emails at 6:30 AM IST on Sep 8.
 */

// ================= CONFIGURATION =================
const CONFIG = {
  SHEET_NAME: "GenAI_Demo_Registrations",
  ZOOM_LINK: "https://us06web.zoom.us/j/82666730613?pwd=OzDODw5m21Z1UCAMCQpZl1UVsYG1HZ.1",
  MEETING_ID: "826 6673 0613",
  PASSCODE: "059882",
  WHATSAPP_GROUP: "https://chat.whatsapp.com/J0jWbPcSVOb3hJwvazd8d3",
  DEMO_DATE_STR: "Tuesday, September 8, 2026 at 7:00 AM IST",
  DEMO_DATE_US: "Sep 8, 2026 at 9:30 PM EDT (US/Canada)",
  SENDER_NAME: "RPAVault Live Demo Team",
  REPLY_TO: "RPAVault1@gmail.com"
};

// ================= WEB ENDPOINT (doPost) =================
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    // Use active sheet if sheet with CONFIG.SHEET_NAME is not found
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();

    const EXPECTED_HEADERS = [
      "Timestamp",
      "Full Name",
      "Email Address",
      "Phone / WhatsApp",
      "Track / Course",
      "IP Address",
      "City",
      "Region",
      "Country",
      "Operating System",
      "Browser",
      "Device Type",
      "Screen Resolution",
      "Language",
      "Timezone",
      "Time on Page (sec)",
      "Referrer",
      "Source Page",
      "Visitor ID",
      "Visit Count",
      "First Visit Date",
      "Session Trail",
      "UTM Source",
      "UTM Campaign",
      "Confirmation Email Status",
      "Reminder Email Status"
    ];

    // Auto-create or heal sheet headers if empty or outdated
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(EXPECTED_HEADERS);
      const headerRange = sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length);
      headerRange.setBackground("#0058b0").setFontColor("#ffffff").setFontWeight("bold");
      sheet.setFrozenRows(1);
    } else if (sheet.getLastColumn() < EXPECTED_HEADERS.length) {
      // Heal existing sheet if it was created with fewer columns
      sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length).setValues([EXPECTED_HEADERS]);
      const headerRange = sheet.getRange(1, 1, 1, EXPECTED_HEADERS.length);
      headerRange.setBackground("#0058b0").setFontColor("#ffffff").setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // Parse incoming payload (supports JSON and form-urlencoded)
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

    const name = (data.name || data.fullName || "").toString().trim();
    const email = (data.email || "").toString().trim().toLowerCase();
    const phone = (data.phone || data.mobile || "").toString().trim();
    const course = (data.course || data.track || "Python + GenAI + Agentic AI Engineering Track").toString().trim();
    
    // Telemetry fields
    const ip = (data.ip || data["Geo: IP Address"] || data.visitor_ip || "").toString().trim();
    const city = (data.city || data["Geo: City"] || data.visitor_city || "").toString().trim();
    const region = (data.region || data["Geo: Region"] || data.visitor_region || "").toString().trim();
    const country = (data.country || data["Geo: Country"] || data.visitor_country || "").toString().trim();
    const os = (data.os || data["Device: OS"] || data.operating_system || "").toString().trim();
    const browser = (data.browser || data["Device: Browser"] || "").toString().trim();
    const deviceType = (data.deviceType || data.device_type || data["Device: Type"] || "").toString().trim();
    const screen = (data.screen || data["Device: Screen Size"] || "").toString().trim();
    const lang = (data.language || data["Device: Browser Language"] || "").toString().trim();
    const tz = (data.timezone || data["Session: Timezone"] || "").toString().trim();
    const timeOnPage = (data.timeOnPage || data.time_on_page_seconds || data["Session: Time Spent on Page (sec)"] || "").toString().trim();
    const referrer = (data.referrer || data["Session: Referrer"] || "").toString().trim();
    const sourcePage = (data.source || data.source_page || data["Session: Source Page Path"] || "/genai-demo/").toString().trim();
    const visitorId = (data.visitorId || data.visitor_id || data["Session: Visitor ID"] || "").toString().trim();
    const visitCount = (data.visitCount || data.visit_count || data["Session: Visit Count"] || "").toString().trim();
    const firstVisit = (data.firstVisit || data.first_visit_date || data["Session: First Visit Date"] || "").toString().trim();
    const sessionPath = (data.sessionPath || data.session_path || data["Session: Path Trail"] || "").toString().trim();
    const utmSource = (data.utm_source || "").toString().trim();
    const utmCampaign = (data.utm_campaign || "").toString().trim();

    if (!email) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Email address is required."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const timestamp = new Date();
    let confirmStatus = "Pending";

    // Send instant confirmation email
    try {
      sendInstantConfirmationEmail(name, email);
      confirmStatus = "Sent (" + Utilities.formatDate(timestamp, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss") + ")";
    } catch (mailErr) {
      confirmStatus = "Failed: " + mailErr.message;
      console.error("Confirmation mail error:", mailErr);
    }

    // Append full record to Google Sheet
    sheet.appendRow([
      timestamp,
      name,
      email,
      phone,
      course,
      ip,
      city,
      region,
      country,
      os,
      browser,
      deviceType,
      screen,
      lang,
      tz,
      timeOnPage,
      referrer,
      sourcePage,
      visitorId,
      visitCount,
      firstVisit,
      sessionPath,
      utmSource,
      utmCampaign,
      confirmStatus,
      "" // Reminder Email Status
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Registration successful! Confirmation email dispatched.",
      zoomUrl: CONFIG.ZOOM_LINK,
      meetingId: CONFIG.MEETING_ID,
      passcode: CONFIG.PASSCODE,
      whatsappGroup: CONFIG.WHATSAPP_GROUP
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error("doPost error:", err);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Support GET for connection testing
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "RPAVault GenAI Demo Webhook",
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// ================= EMAIL TEMPLATES =================

/**
 * 1. Instant Registration Confirmation Email
 */
function sendInstantConfirmationEmail(name, email) {
  const firstName = name ? name.split(" ")[0] : "there";
  const subject = "Confirmed: Your Zoom Link for Live GenAI Demo — Sep 8, 7:00 AM IST";

  const googleCalLink = buildGoogleCalendarUrl();

  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #f4f5f7; color: #232333; }
      .email-wrap { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e1e4e8; box-shadow: 0 4px 18px rgba(0,0,0,0.05); }
      .zoom-top-bar { background: #0b5cff; padding: 22px 28px; text-align: left; }
      .zoom-top-logo { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
      .zoom-top-tag { font-size: 12px; color: #dbeafe; font-weight: 600; text-transform: uppercase; margin-top: 2px; }
      .email-body { padding: 32px 28px; }
      .salutation { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 12px; }
      .intro-text { font-size: 14px; line-height: 1.6; color: #374151; margin-bottom: 24px; }
      .join-box { background: #f0f7ff; border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 22px; margin-bottom: 24px; text-align: center; }
      .join-btn { display: inline-block; background: #0b5cff; color: #ffffff !important; font-size: 16px; font-weight: 800; padding: 14px 36px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(11,92,255,0.3); }
      .creds-table { width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 13px; text-align: left; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #dbeafe; }
      .creds-table td { padding: 10px 14px; border-bottom: 1px solid #eff6ff; }
      .creds-table td.lbl { font-weight: 700; color: #4b5563; width: 38%; }
      .creds-table td.val { font-family: monospace; font-weight: 800; color: #111827; font-size: 14px; }
      .cal-row { margin: 20px 0; text-align: center; }
      .cal-link { display: inline-block; color: #0b5cff; text-decoration: underline; font-weight: 700; font-size: 13px; margin: 0 10px; }
      .wa-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; margin: 24px 0; font-size: 13px; line-height: 1.5; color: #166534; }
      .wa-card a { color: #15803d; font-weight: 800; text-decoration: underline; }
      .curriculum-summary { background: #fafafa; border: 1px solid #eaeaea; border-radius: 10px; padding: 18px 20px; margin: 24px 0; font-size: 13px; color: #374151; }
      .curriculum-summary h4 { margin: 0 0 10px 0; font-size: 14px; color: #111827; }
      .dialin-section { font-size: 12px; line-height: 1.6; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 18px; margin-top: 24px; }
      .footer-note { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
    </style>
  </head>
  <body>
    <div class="email-wrap">
      <!-- Zoom Style Header -->
      <div class="zoom-top-bar">
        <div class="zoom-top-logo">zoom <span style="font-size:15px; font-weight:400; opacity:0.85;">| RPAVault</span></div>
        <div class="zoom-top-tag">Live Webinar Confirmation</div>
      </div>

      <div class="email-body">
        <div class="salutation">Hi ${firstName},</div>
        <div class="intro-text">
          Thank you for registering for <strong>September AI Demo — Python + GenAI + Agentic AI Engineering Track</strong>.<br>
          Please find your meeting access credentials below:
        </div>

        <!-- Primary Join Card (Zoom Style) -->
        <div class="join-box">
          <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:#1d4ed8; letter-spacing:0.8px; margin-bottom:12px;">
            Join from PC, Mac, Linux, iOS or Android
          </div>
          
          <a href="${CONFIG.ZOOM_LINK}" target="_blank" class="join-btn">
            Click Here to Join Meeting &rarr;
          </a>

          <table class="creds-table">
            <tr>
              <td class="lbl">Date &amp; Time:</td>
              <td class="val" style="font-family:inherit; font-size:13px;">
                <strong>${CONFIG.DEMO_DATE_STR}</strong><br>
                <span style="font-weight:400; color:#6b7280; font-size:12px;">(${CONFIG.DEMO_DATE_US})</span>
              </td>
            </tr>
            <tr>
              <td class="lbl">Meeting ID:</td>
              <td class="val">${CONFIG.MEETING_ID}</td>
            </tr>
            <tr>
              <td class="lbl">Passcode:</td>
              <td class="val">${CONFIG.PASSCODE}</td>
            </tr>
          </table>
        </div>

        <!-- Add to Calendar -->
        <div class="cal-row">
          <strong>Add to Calendar:</strong>
          <a href="${googleCalLink}" target="_blank" class="cal-link">Google Calendar</a> |
          <a href="${CONFIG.ZOOM_LINK}" target="_blank" class="cal-link">Save Zoom Link</a>
        </div>

        <!-- WhatsApp Updates Notice -->
        <div class="wa-card">
          💬 <strong>You can join our WhatsApp group to get more updates:</strong><br>
          Get session reminders, lab Python notebooks, and slide decks directly on WhatsApp:<br>
          <a href="${CONFIG.WHATSAPP_GROUP}" target="_blank">Tap here to join the WhatsApp Demo Group &rarr;</a>
        </div>

        <!-- 2-Month Track Overview -->
        <div class="curriculum-summary">
          <h4>What We Will Cover in Tomorrow's Demo:</h4>
          <ul style="padding-left:18px; margin:0; line-height:1.6;">
            <li><strong>Foundations &amp; Classical ML:</strong> Python, NumPy, Vectors, PyTorch Tensors</li>
            <li><strong>Transformers &amp; LLMs:</strong> Self-Attention, QKV, Prompt Engineering, Embeddings</li>
            <li><strong>Production RAG:</strong> Vector DBs (FAISS/Chroma), Hybrid Search &amp; Evals</li>
            <li><strong>Model Adaptation:</strong> SFT vs RAG vs Prompting &amp; PEFT/LoRA Fine-Tuning</li>
            <li><strong>Deployment:</strong> FastAPI Microservices &amp; Docker</li>
            <li><strong>Portfolio Capstone:</strong> Enterprise Knowledge RAG Assistant</li>
          </ul>
        </div>

        <!-- Dial-in info (Standard Zoom Format) -->
        <div class="dialin-section">
          <strong>Or iPhone one-tap:</strong><br>
          +13017158592,,82666730613#,,,,*059882# US (Washington DC)<br>
          +13126266799,,82666730613#,,,,*059882# US (Chicago)<br><br>
          <strong>Or Telephone:</strong><br>
          Dial: +1 301 715 8592 (US)<br>
          Meeting ID: 826 6673 0613 &nbsp;|&nbsp; Passcode: 059882<br>
          SIP: 82666730613@zoomcrc.com
        </div>

        <div class="footer-note">
          Sent by RPAVault Webinar System • Hyderabad, India<br>
          Questions? Contact us at <a href="mailto:${CONFIG.REPLY_TO}" style="color:#0b5cff;">${CONFIG.REPLY_TO}</a>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody,
    name: "September AI Demo (Zoom)",
    replyTo: CONFIG.REPLY_TO
  });
}

/**
 * 2. 30-Minute Meeting Reminder Email (Scheduled for Sep 8, 6:30 AM IST)
 */
function sendMeetingReminderEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    console.warn("Sheet not found: " + CONFIG.SHEET_NAME);
    return;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return; // Only header

  let sentCount = 0;
  const now = new Date();

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const name = row[1] || "";
    const email = (row[2] || "").toString().trim().toLowerCase();
    const reminderStatus = (row[8] || "").toString().trim();

    // Only send if email is valid and reminder wasn't sent yet
    if (email && email.includes("@") && !reminderStatus) {
      try {
        const firstName = name ? name.split(" ")[0] : "there";
        const subject = "🔴 Starting in 30 Minutes! Join Live GenAI Demo on Zoom";
        
        const htmlBody = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; max-width:600px; margin:0 auto; padding:24px; border:1px solid #cce3fa; border-radius:16px; background:#ffffff;">
          <div style="text-align:center; margin-bottom:20px;">
            <div style="display:inline-block; background:#fee2e2; color:#ef4444; font-weight:800; font-size:12px; padding:6px 14px; border-radius:99px; text-transform:uppercase;">
              Starting at 7:00 AM IST
            </div>
            <h2 style="color:#0f172a; margin:12px 0 6px;">Your GenAI Demo Begins in 30 Minutes!</h2>
            <p style="color:#64748b; font-size:14px; margin:0;">8-Week Generative AI Engineering Masterclass</p>
          </div>

          <p style="font-size:15px; color:#334155; line-height:1.6;">
            Hi ${firstName}, our live interactive session is starting shortly. Please click below to join the Zoom meeting:
          </p>

          <div style="text-align:center; margin:24px 0;">
            <a href="${CONFIG.ZOOM_LINK}" target="_blank" style="display:inline-block; background:#2D8CFF; color:#ffffff; font-weight:800; font-size:16px; text-decoration:none; padding:15px 36px; border-radius:10px; box-shadow:0 4px 14px rgba(45,140,255,0.4);">
              🚀 Join Zoom Meeting Now &rarr;
            </a>
          </div>

          <div style="background:#f8fafc; border-radius:12px; padding:16px; font-size:14px; color:#334155; margin-bottom:20px;">
            <strong>Meeting ID:</strong> ${CONFIG.MEETING_ID}<br>
            <strong>Passcode:</strong> ${CONFIG.PASSCODE}<br>
            <strong>WhatsApp Demo Community:</strong> <a href="${CONFIG.WHATSAPP_GROUP}" style="color:#0058b0;">Join WhatsApp Group</a>
          </div>

          <p style="font-size:13px; color:#94a3b8; text-align:center; margin:0;">
            See you in the live room! — Team RPAVault
          </p>
        </div>
        `;

        MailApp.sendEmail({
          to: email,
          subject: subject,
          htmlBody: htmlBody,
          name: CONFIG.SENDER_NAME,
          replyTo: CONFIG.REPLY_TO
        });

        // Mark as sent in Column I (column index 9)
        sheet.getRange(r + 1, 9).setValue("Sent (" + Utilities.formatDate(now, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ss") + ")");
        sentCount++;
      } catch (err) {
        console.error("Failed sending reminder to " + email, err);
        sheet.getRange(r + 1, 9).setValue("Failed: " + err.message);
      }
    }
  }

  console.log("Reminders dispatched to " + sentCount + " attendees.");
}

/**
 * 3. Schedule the Automated Trigger (Run this once from Apps Script)
 * Automatically triggers sendMeetingReminderEmails() on Sep 8, 2026 at 06:30 AM IST.
 */
function setupDemoReminderTrigger() {
  // Clear any existing triggers for this function to avoid duplicate triggers
  const existingTriggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < existingTriggers.length; i++) {
    if (existingTriggers[i].getHandlerFunction() === "sendMeetingReminderEmails") {
      ScriptApp.deleteTrigger(existingTriggers[i]);
    }
  }

  // Set for September 8, 2026 at 06:30:00 IST (UTC: Sep 8 01:00:00)
  // Month is 0-indexed in JS (8 = September)
  const triggerDate = new Date(2026, 8, 8, 6, 30, 0);

  ScriptApp.newTrigger("sendMeetingReminderEmails")
    .timeBased()
    .at(triggerDate)
    .inTimezone("Asia/Kolkata")
    .create();

  console.log("Automated 30-minute reminder trigger successfully scheduled for: " + triggerDate.toString());
}

/**
 * Helper: Generates 1-click Google Calendar Link with meeting details
 */
function buildGoogleCalendarUrl() {
  const title = encodeURIComponent("Live GenAI Demo & Engineering Masterclass — RPAVault (Zoom)");
  const details = encodeURIComponent(
    "Join Zoom Meeting:\\n" + CONFIG.ZOOM_LINK +
    "\\n\\nMeeting ID: " + CONFIG.MEETING_ID +
    "\\nPasscode: " + CONFIG.PASSCODE +
    "\\nWhatsApp Group: " + CONFIG.WHATSAPP_GROUP +
    "\\n\\nTopic: 8-Week Generative AI Engineering Track Demo"
  );
  const location = encodeURIComponent(CONFIG.ZOOM_LINK);
  // Sep 8, 2026 07:00 IST = 01:30 UTC. Duration 1 hour 30 mins -> 03:00 UTC
  const dates = "20260908T013000Z/20260908T030000Z";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
}
