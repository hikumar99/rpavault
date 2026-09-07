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
  REPLY_TO: "info@rpavault.com"
};

// ================= WEB ENDPOINT (doPost) =================
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    // Auto-create and format sheet if it doesn't exist yet
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      sheet.appendRow([
        "Timestamp",
        "Full Name",
        "Email Address",
        "Phone / WhatsApp",
        "Source Page",
        "Referrer",
        "User Agent",
        "Confirmation Email",
        "Reminder Email Status"
      ]);
      const headerRange = sheet.getRange(1, 1, 1, 9);
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
    const source = (data.source || "/join-demo/").toString().trim();
    const referrer = (data.referrer || "").toString().trim();
    const userAgent = (data.userAgent || "").toString().trim();

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

    // Append to Google Sheet
    sheet.appendRow([
      timestamp,
      name,
      email,
      phone,
      source,
      referrer,
      userAgent,
      confirmStatus,
      "" // Reminder not sent yet
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
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #f4f8fb; color: #1a181b; }
      .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e1ebf2; }
      .header { background: linear-gradient(135deg, #0a192f 0%, #0058b0 100%); padding: 32px 28px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
      .badge { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 99px; padding: 6px 16px; font-size: 13px; font-weight: 700; color: #7dd3fc; margin-bottom: 12px; }
      .body-content { padding: 30px 28px; }
      .greeting { font-size: 18px; font-weight: 700; color: #0a192f; margin-bottom: 16px; }
      .highlight-card { background: #f0f7ff; border: 1.5px solid #cce3fa; border-radius: 14px; padding: 22px; margin: 24px 0; }
      .meeting-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
      .btn { display: inline-block; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; text-align: center; }
      .btn-zoom { background: #2D8CFF; color: #ffffff !important; box-shadow: 0 4px 12px rgba(45,140,255,0.3); margin-bottom: 12px; }
      .btn-whatsapp { background: #25D366; color: #ffffff !important; margin-bottom: 12px; }
      .btn-cal { background: #ffffff; color: #0058b0 !important; border: 1.5px solid #0058b0; }
      .curriculum-box { background: #fafbfc; border-radius: 12px; padding: 18px; margin: 24px 0; border: 1px solid #ebf0f4; }
      .curriculum-item { margin-bottom: 8px; font-size: 14px; color: #334155; }
      .footer { background: #f8fafc; padding: 20px 28px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="badge">🔴 LIVE INTERACTIVE ZOOM DEMO</div>
        <h1>Registration Confirmed!</h1>
        <p style="margin:0; font-size:15px; opacity:0.9;">8-Week Generative AI Engineering Track</p>
      </div>

      <div class="body-content">
        <p class="greeting">Hi ${firstName},</p>
        <p style="font-size:15px; line-height:1.6; color:#334155;">
          You're all set! We have reserved your seat for the exclusive <strong>Live GenAI Masterclass &amp; Roadmap Demo</strong> hosted by RPAVault.
        </p>

        <!-- Meeting Credentials Box -->
        <div class="highlight-card">
          <div style="font-size:13px; font-weight:800; color:#0058b0; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;">
            ZOOM MEETING ACCESS DETAILS
          </div>
          <div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:6px;">
            🗓️ Date &amp; Time:
          </div>
          <div style="font-size:14px; color:#334155; margin-bottom:14px; padding-left:24px;">
            <strong>${CONFIG.DEMO_DATE_STR}</strong><br>
            <span style="color:#64748b;">(${CONFIG.DEMO_DATE_US})</span>
          </div>

          <div style="font-size:16px; font-weight:700; color:#0f172a; margin-bottom:6px;">
            🔑 Meeting Credentials:
          </div>
          <div style="font-size:14px; color:#334155; margin-bottom:18px; padding-left:24px;">
            Meeting ID: <strong>${CONFIG.MEETING_ID}</strong><br>
            Passcode: <strong>${CONFIG.PASSCODE}</strong>
          </div>

          <div style="text-align:center;">
            <a href="${CONFIG.ZOOM_LINK}" target="_blank" class="btn btn-zoom" style="display:block; margin-bottom:12px;">
              Join Zoom Meeting Directly &rarr;
            </a>
            <a href="${CONFIG.WHATSAPP_GROUP}" target="_blank" class="btn btn-whatsapp" style="display:block; margin-bottom:12px;">
              💬 Join WhatsApp Demo Group
            </a>
            <a href="${googleCalLink}" target="_blank" class="btn btn-cal" style="display:block;">
              📅 Add to Google Calendar
            </a>
          </div>
        </div>

        <!-- Curriculum Highlights -->
        <div class="curriculum-box">
          <div style="font-weight:800; font-size:15px; color:#0f172a; margin-bottom:12px;">
            What Will Be Covered In The Demo:
          </div>
          <div class="curriculum-item">⚡ <strong>Transformers &amp; Attention:</strong> Demystifying embeddings, tokenization, and QKV mechanisms.</div>
          <div class="curriculum-item">⚡ <strong>Production RAG Architecture:</strong> Hybrid search, chunking, re-ranking, and vector DBs (FAISS/Chroma).</div>
          <div class="curriculum-item">⚡ <strong>Model Adaptation:</strong> SFT vs RAG vs Prompting decision framework and PEFT/LoRA fine-tuning.</div>
          <div class="curriculum-item">⚡ <strong>FastAPI &amp; Docker Deployment:</strong> Turning LLM pipelines into resilient enterprise microservices.</div>
          <div class="curriculum-item">⚡ <strong>Portfolio Capstone:</strong> Building the Enterprise Knowledge RAG Assistant.</div>
        </div>

        <p style="font-size:14px; line-height:1.6; color:#475569;">
          Make sure to join our WhatsApp group above so you don't miss live Q&amp;A, demo source code repositories, and session deck slides.
        </p>
      </div>

      <div class="footer">
        RPAVault — Enterprise Automation, GenAI &amp; Consultancy<br>
        Questions? Email us at <a href="mailto:${CONFIG.REPLY_TO}" style="color:#0058b0;">${CONFIG.REPLY_TO}</a>
      </div>
    </div>
  </body>
  </html>
  `;

  MailApp.sendEmail({
    to: email,
    subject: subject,
    htmlBody: htmlBody,
    name: CONFIG.SENDER_NAME,
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
