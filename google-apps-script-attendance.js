/**
 * Google Apps Script for RPAVault Live Class Attendance & Dynamic Dashboard
 * 
 * Google Sheet Architecture:
 * 1. "Settings" Tab:
 *    - Column C: Admin / Temp Meeting Link (strictly for admin/temp rows)
 *    - Column E: Course Name (e.g. RPA / UiPath)
 *    - Column F: Single Batch Name (e.g. RPA_UiPath_Sep2026 or UI Path September 2026)
 *    - Column G: Batch Meeting URL (linked to Column F batch)
 * 2. "Registered_Students" Tab:
 *    - Column A: Student Name
 *    - Column B: Student Email
 *    - Column C: Mobile Number
 *    - Column D: Batch Name (Exact search term matching Column F of Settings!)
 *    - Column E: Course Name
 * 3. "Attendance_Logs" Tab:
 *    - 22 Columns telemetry logs with auto-cleanup for entries older than 180 days.
 *
 * Menu Features:
 * - ⚡ RPAVault Attendance:
 *   1. 🔄 Sync Dashboard Cache (Fast Load)
 *   2. 🧹 Delete Attendance Logs Older Than 180 Days
 *   3. ⏰ Setup Daily 180-Day Auto-Cleanup Trigger
 */

// =========================================================================
// 1. SPREADSHEET CUSTOM MENU & TRIGGERS
// =========================================================================

function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("⚡ RPAVault Attendance")
      .addItem("🔄 Sync Dashboard Cache (Fast Load)", "syncDashboardCache")
      .addSeparator()
      .addItem("🧹 Delete Logs Older Than 180 Days", "cleanupOldAttendanceLogs")
      .addItem("⏰ Setup Daily 180-Day Auto-Cleanup Trigger", "setupDailyCleanupTrigger")
      .addToUi();
  } catch (_) {}
}

/**
 * 180-Day Auto-Purge: Deletes attendance logs older than 180 days
 */
function cleanupOldAttendanceLogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = getSheet(ss, "Attendance_Logs");
  if (!logSheet) {
    showAlertIfUI("Notice", "Sheet 'Attendance_Logs' not found.");
    return { deleted: 0, retained: 0 };
  }

  const data = logSheet.getDataRange().getValues();
  if (data.length <= 1) {
    showAlertIfUI("Notice", "No attendance logs to clean up.");
    return { deleted: 0, retained: 0 };
  }

  const header = data[0];
  const rows = data.slice(1);
  const now = new Date().getTime();
  const cutoffMs = 180 * 24 * 60 * 60 * 1000; // 180 days in ms
  const cutoffTime = now - cutoffMs;

  const retainedRows = [];
  let deletedCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const timestampVal = row[0];
    let rowTime = 0;

    if (timestampVal instanceof Date) {
      rowTime = timestampVal.getTime();
    } else if (timestampVal) {
      const parsed = new Date(timestampVal);
      if (!isNaN(parsed.getTime())) {
        rowTime = parsed.getTime();
      }
    }

    if (rowTime === 0 || rowTime >= cutoffTime) {
      retainedRows.push(row);
    } else {
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    logSheet.clearContents();
    const newData = [header].concat(retainedRows);
    logSheet.getRange(1, 1, newData.length, header.length).setValues(newData);
  }

  const summary = "Attendance Logs Cleanup Finished:\n" +
                  "• Logs older than 180 days deleted: " + deletedCount + "\n" +
                  "• Active logs retained: " + retainedRows.length;
  Logger.log(summary);
  showAlertIfUI("🧹 180-Day Log Cleanup", summary);

  return { deleted: deletedCount, retained: retainedRows.length };
}

/**
 * Installs daily automated trigger to run cleanupOldAttendanceLogs at 3:00 AM
 */
function setupDailyCleanupTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "cleanupOldAttendanceLogs") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("cleanupOldAttendanceLogs")
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  showAlertIfUI(
    "⏰ Auto-Cleanup Trigger Activated",
    "Daily cleanup trigger has been set up successfully!\n\n" +
    "Every day at 3:00 AM, attendance logs older than 180 days will be automatically purged in the background."
  );
}

/**
 * Precompute & Sync Dashboard Cache in ScriptCache (TTL 6 hrs) and Script Properties
 */
function syncDashboardCache() {
  const startTime = new Date().getTime();
  const payload = buildDashboardPayload();
  const jsonStr = JSON.stringify(payload);

  const cache = CacheService.getScriptCache();
  try {
    if (jsonStr.length < 100000) {
      cache.put("RPA_DASHBOARD_PAYLOAD", jsonStr, 21600); // 6 hours
    }
  } catch (_) {}

  try {
    PropertiesService.getScriptProperties().setProperty("RPA_DASHBOARD_PAYLOAD", jsonStr);
    PropertiesService.getScriptProperties().setProperty("RPA_DASHBOARD_SYNC_TIME", new Date().toISOString());
  } catch (_) {}

  const elapsed = new Date().getTime() - startTime;
  const batchNames = (payload.batches && payload.batches.length > 0)
    ? payload.batches.map(function(b) { return b.name; }).join(", ")
    : (payload.batchInfo ? payload.batchInfo.batchName : "Default Batch");

  const msg = "Dashboard Cache Synced in " + elapsed + " ms!\n\n" +
              "• Total Candidates: " + (payload.students ? payload.students.length : 0) + "\n" +
              "• Batches Configured: " + batchNames + "\n" +
              "• Sessions Held: " + (payload.batchInfo ? payload.batchInfo.classesHeld : 0) + "\n\n" +
              "The website dashboard will now open instantly!";

  showAlertIfUI("⚡ Dashboard Cache Synced", msg);
  return payload;
}

// =========================================================================
// 2. HTTP POST HANDLER (Authentication, Telemetry & Joining Link Lookup)
// =========================================================================

function doPost(e) {
  try {
    let params = {};
    if (e && e.parameter) {
      params = Object.assign({}, e.parameter);
    }
    if (e && e.postData && e.postData.contents) {
      try {
        const parsed = JSON.parse(e.postData.contents);
        params = Object.assign(params, parsed);
      } catch (_) {}
    }

    const inputEmail = (params.email || "").toString().trim().toLowerCase();
    if (!inputEmail) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        verified: false,
        message: "Not mapped to any batch"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const regSheet = getSheet(ss, "Registered_Students");
    const settingsSheet = getSheet(ss, "Settings");
    const logSheet = getSheet(ss, "Attendance_Logs");

    // 1. Read Settings tab: Column F = Batch Name, Column G = Batch Meeting URL, Column C = Admin/Temp URL
    const adminEmails = new Set();
    const adminMeetingMap = {}; // email -> specific meeting URL from column C
    const tempMeetingMap = {};  // temp email -> specific meeting URL from column C
    const batchMeetingMap = {}; // batch slug / name -> meeting URL from column G
    let defaultBatchMeetingUrl = "";
    let activeSettingsBatch = "";
    let activeSettingsCourse = "RPA / UiPath";
    const settingsBatchesList = [];

    if (settingsSheet) {
      try {
        const sData = settingsSheet.getDataRange().getValues();
        for (let r = 0; r < sData.length; r++) {
          const row = sData[r];
          const colA = (row[0] || "").toString().trim();
          const colB = (row[1] || "").toString().trim();
          const colC = (row[2] || "").toString().trim(); // Column C: Admin / Temp link
          const colD = (row[3] || "").toString().trim();
          const colE = (row[4] || "").toString().trim(); // Column E: Course Name
          const colF = (row[5] || "").toString().trim(); // Column F: Batch Name!
          const colG = (row[6] || "").toString().trim(); // Column G: Batch meeting link

          const keyA = colA.toLowerCase();
          const keyB = colB.toLowerCase();

          // A) Process Column F (Single Batch Name) & Column G (Meeting Link)
          if (colF && !isLikelyUrl(colF) && !colF.includes("@")) {
            const cleanBatch = formatBatchDisplay(colF);
            if (cleanBatch && cleanBatch.toLowerCase() !== "batch" && cleanBatch.toLowerCase() !== "batch name") {
              activeSettingsBatch = cleanBatch;
              if (!settingsBatchesList.includes(cleanBatch)) {
                settingsBatchesList.push(cleanBatch);
              }
              if (colE) activeSettingsCourse = colE;

              if (colG && isLikelyUrl(colG)) {
                if (!defaultBatchMeetingUrl) defaultBatchMeetingUrl = colG;
                registerBatchUrl(batchMeetingMap, cleanBatch, colG);
                registerBatchUrl(batchMeetingMap, colF, colG);
              }
            }
          } else if (colG && isLikelyUrl(colG)) {
            if (!defaultBatchMeetingUrl) defaultBatchMeetingUrl = colG;
          }

          // B) Process Column C (Admin / Temp meeting link)
          if (colC && isLikelyUrl(colC)) {
            if (keyA.includes("temp") || keyB.includes("temp")) {
              for (let c = 0; c < row.length; c++) {
                const cell = (row[c] || "").toString().trim().toLowerCase();
                if (cell.includes("@") && cell.includes(".")) {
                  tempMeetingMap[cell] = colC;
                }
              }
            }

            if (keyA.includes("admin") || keyB.includes("admin")) {
              colB.split(/[,\s;]+/).forEach(function(em) {
                const clean = em.toLowerCase().trim();
                if (clean && clean.includes("@")) {
                  adminEmails.add(clean);
                  adminMeetingMap[clean] = colC;
                }
              });
              colA.split(/[,\s;]+/).forEach(function(em) {
                const clean = em.toLowerCase().trim();
                if (clean && clean.includes("@")) {
                  adminEmails.add(clean);
                  adminMeetingMap[clean] = colC;
                }
              });
            }

            if (colA.includes("@") && colA.includes(".")) {
              const em = colA.toLowerCase();
              adminEmails.add(em);
              adminMeetingMap[em] = colC;
            }
            if (colB.includes("@") && colB.includes(".")) {
              const em = colB.toLowerCase();
              adminEmails.add(em);
              adminMeetingMap[em] = colC;
            }
          } else {
            if (keyA.includes("admin")) {
              colB.split(/[,\s;]+/).forEach(function(em) {
                const clean = em.toLowerCase().trim();
                if (clean && clean.includes("@")) adminEmails.add(clean);
              });
            }
            if (colA.includes("@") && keyA.includes("admin")) {
              adminEmails.add(colA.toLowerCase());
            }
          }
        }
      } catch (_) {}
    }

    // 2. Check Registered Students (Column D = Batch Name, matching Column F)
    let isStudent = false;
    let studentName = "";
    let batchName = "";
    let courseName = "";

    if (regSheet) {
      const regData = regSheet.getDataRange().getValues();
      if (regData && regData.length > 1) {
        let emailCol = 1;
        let nameCol = 0;
        let batchCol = 3;
        let courseCol = 4;

        const headers = regData[0];
        for (let c = 0; c < headers.length; c++) {
          const h = (headers[c] || "").toString().toLowerCase();
          if (h.includes("email")) emailCol = c;
          else if (h.includes("name")) nameCol = c;
          else if (h.includes("batch")) batchCol = c;
          else if (h.includes("course")) courseCol = c;
        }

        for (let i = 1; i < regData.length; i++) {
          const row = regData[i];
          const rowEmail = (row[emailCol] || "").toString().trim().toLowerCase();
          
          let match = (rowEmail === inputEmail);
          if (!match) {
            for (let c = 0; c < row.length; c++) {
              if ((row[c] || "").toString().trim().toLowerCase() === inputEmail) {
                match = true;
                break;
              }
            }
          }

          if (match) {
            isStudent = true;
            studentName = (row[nameCol] || "").toString().trim() || inputEmail.split("@")[0];
            const rawB = row[batchCol];
            batchName = formatBatchDisplay(rawB) || (rawB ? rawB.toString().trim() : "");
            courseName = (row[courseCol] || "").toString().trim() || activeSettingsCourse;
            break;
          }
        }
      }
    }

    // 2b. Also check if student email is present in Settings sheet
    if (settingsSheet) {
      try {
        const sData = settingsSheet.getDataRange().getValues();
        let runningBatch = activeSettingsBatch || (settingsBatchesList.length > 0 ? settingsBatchesList[0] : "");

        for (let r = 0; r < sData.length; r++) {
          const row = sData[r];
          const colF = (row[5] || "").toString().trim();
          if (colF && !isLikelyUrl(colF) && !colF.includes("@")) {
            const cleanF = formatBatchDisplay(colF);
            if (cleanF && cleanF.toLowerCase() !== "batch") runningBatch = cleanF;
          }

          for (let c = 0; c < row.length; c++) {
            const cell = (row[c] || "").toString().trim().toLowerCase();
            if (cell.includes(inputEmail)) {
              isStudent = true;
              studentName = studentName || inputEmail.split("@")[0];
              if (!batchName && runningBatch) batchName = runningBatch;
              break;
            }
          }
          if (isStudent && batchName) break;
        }
      } catch (_) {}
    }

    if (isStudent && !batchName) {
      batchName = activeSettingsBatch || (settingsBatchesList.length > 0 ? settingsBatchesList[0] : "RPA UiPath Sep2026");
    }

    // 3. Evaluate verification and assign meeting URL
    const isTempUser = !!tempMeetingMap[inputEmail];
    const isAdmin = adminEmails.has(inputEmail) || !!adminMeetingMap[inputEmail];
    const action = (params.action || "").toString().trim().toLowerCase();

    let meetingUrl = "";
    let isVerified = false;
    let failMessage = "This is only for registered users, please contact us to register.";

    if (action === "dashboard_access") {
      if (isTempUser) {
        isVerified = false;
        failMessage = "Attendance dashboard is only for registered students and admins.";
      } else if (isAdmin) {
        isVerified = true;
        studentName = studentName || "Admin";
      } else if (isStudent) {
        if (!batchName) {
          isVerified = false;
          failMessage = "Not mapped to any batch";
        } else {
          isVerified = true;
        }
      } else {
        isVerified = false;
        failMessage = "This is only for registered users, please contact us to register.";
      }
    } else {
      // Action is "join" or default
      if (isTempUser) {
        const assignedUrl = tempMeetingMap[inputEmail];
        if (assignedUrl && isLikelyUrl(assignedUrl)) {
          meetingUrl = assignedUrl;
          isVerified = true;
          studentName = studentName || "Member";
        } else {
          isVerified = false;
          failMessage = "Not mapped to any meeting link";
        }
      } else if (isAdmin) {
        const assignedUrl = adminMeetingMap[inputEmail];
        if (assignedUrl && isLikelyUrl(assignedUrl)) {
          meetingUrl = assignedUrl;
          isVerified = true;
          studentName = studentName || "Admin";
        } else {
          isVerified = false;
          failMessage = "Admin email not mapped to any meeting link in Settings sheet.";
        }
      } else if (isStudent) {
        if (!batchName) {
          isVerified = false;
          failMessage = "Not mapped to any batch";
        } else {
          let batchUrl = "";
          const bKey = batchName.toLowerCase();
          const bSlug = slugify(batchName);

          if (batchMeetingMap[bSlug]) batchUrl = batchMeetingMap[bSlug];
          else if (batchMeetingMap[bKey]) batchUrl = batchMeetingMap[bKey];
          else if (defaultBatchMeetingUrl) batchUrl = defaultBatchMeetingUrl;

          if (batchUrl && isLikelyUrl(batchUrl)) {
            meetingUrl = batchUrl;
            isVerified = true;
          } else {
            isVerified = false;
            failMessage = "Not mapped to any batch";
          }
        }
      } else {
        isVerified = false;
        failMessage = "This is only for registered users, please contact us to register.";
      }
    }

    // 4. ALWAYS log to Attendance_Logs
    if (logSheet) {
      try {
        const now = new Date();
        const ip = params["Geo: IP Address"] || params.ip || "";
        const city = params["Geo: City"] || params.city || "";
        const region = params["Geo: Region"] || params.region || "";
        const country = params["Geo: Country"] || params.country || "";
        const os = params["Device: OS"] || params.os || "";
        const browser = params["Device: Browser"] || params.browser || "";
        const device = params["Device: Type"] || params.device || "";
        const screen = params["Device: Screen Size"] || params.screen || "";
        const lang = params["Device: Browser Language"] || params.language || "";
        const visitorType = params["Session: Visitor Type"] || params.visitor_type || "";
        const visitorId = params["Session: Visitor ID"] || params.visitor_id || "";
        const visitCount = params["Session: Visit Count"] || params.visit_count || "1";
        const firstVisit = params["Session: First Visit Date"] || params.first_visit_date || "";
        const pathTrail = params["Session: Path Trail"] || params.path_trail || "";
        const referrer = params["Session: Referrer"] || params.referrer || "direct";
        const timeOnPage = params["Session: Time Spent on Page (sec)"] || params.time_spent || "";
        const timezone = params["Session: Timezone"] || params.timezone || "";
        const pagePath = params["Session: Source Page Path"] || params.source_page || "";
        const pageTitle = params["Session: Source Page Title"] || params.source_page_title || "";
        const localTime = params["Session: Local Time Submitted"] || params.local_time || now.toString();

        logSheet.appendRow([
          now,
          inputEmail,
          ip,
          city,
          region,
          country,
          os,
          browser,
          device,
          screen,
          lang,
          visitorType,
          visitorId,
          visitCount,
          firstVisit,
          pathTrail,
          referrer,
          timeOnPage,
          timezone,
          pagePath,
          pageTitle,
          localTime
        ]);
      } catch (_) {}
    }

    if (!isVerified) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        verified: false,
        isAdmin: isAdmin,
        isTempUser: isTempUser,
        message: failMessage || "This is only for registered users, please contact us to register."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      verified: true,
      isAdmin: isAdmin,
      isTempUser: isTempUser,
      redirectUrl: meetingUrl,
      student: {
        name: studentName,
        email: inputEmail,
        batch: batchName,
        course: courseName,
        isAdmin: isAdmin
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// =========================================================================
// 3. HTTP GET HANDLER (Dynamic Dashboard & Caching Engine)
// =========================================================================

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action.toLowerCase() : "";
    const forceRefresh = (e && e.parameter && (e.parameter.refresh === "1" || e.parameter.nocache === "1"));

    if (action === "sync") {
      const synced = syncDashboardCache();
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Dashboard cache synced", payload: synced })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "cleanup") {
      const res = cleanupOldAttendanceLogs();
      return ContentService.createTextOutput(JSON.stringify({ success: true, cleanup: res })).setMimeType(ContentService.MimeType.JSON);
    }

    // Default: getDashboard
    if (action === "getdashboard" || !action) {
      if (!forceRefresh) {
        const cache = CacheService.getScriptCache();
        let cached = cache.get("RPA_DASHBOARD_PAYLOAD");
        if (cached) {
          return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
        }

        const prop = PropertiesService.getScriptProperties().getProperty("RPA_DASHBOARD_PAYLOAD");
        if (prop) {
          try {
            cache.put("RPA_DASHBOARD_PAYLOAD", prop, 21600);
          } catch (_) {}
          return ContentService.createTextOutput(prop).setMimeType(ContentService.MimeType.JSON);
        }
      }

      const payload = syncDashboardCache();
      return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "alive", action: action })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Builds the dashboard metrics, streaks, calendar tiles, and single batch list
 */
function buildDashboardPayload() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const regSheet = getSheet(ss, "Registered_Students");
  const settingsSheet = getSheet(ss, "Settings");
  const logSheet = getSheet(ss, "Attendance_Logs");

  const regData = regSheet ? regSheet.getDataRange().getValues() : [];
  const settingsData = settingsSheet ? settingsSheet.getDataRange().getValues() : [];
  const logData = logSheet ? logSheet.getDataRange().getValues() : [];

  const batchesMap = {}; // slug -> { id, name }
  let defaultActiveBatch = "RPA UiPath Sep2026";

  // Scan Settings Tab: Column F = Batch Name
  if (settingsData && settingsData.length > 0) {
    for (let r = 0; r < settingsData.length; r++) {
      const row = settingsData[r];
      const colF = (row[5] || "").toString().trim(); // Column F: Batch Name
      if (colF && !isLikelyUrl(colF) && !colF.includes("@")) {
        const cleanName = formatBatchDisplay(colF);
        if (cleanName && cleanName.toLowerCase() !== "batch" && cleanName.toLowerCase() !== "batch name") {
          defaultActiveBatch = cleanName;
          const slug = slugify(cleanName);
          if (!batchesMap[slug]) {
            batchesMap[slug] = {
              id: slug,
              name: cleanName
            };
          }
        }
      }
    }
  }

  // 1. Extract registered students from "Registered_Students" (Column D = Batch Name)
  const studentsMap = {};
  const registeredList = [];

  if (regData && regData.length > 1) {
    let emailCol = 1;
    let nameCol = 0;
    let mobileCol = 2;
    let batchCol = 3;
    let courseCol = 4;

    const headers = regData[0];
    for (let c = 0; c < headers.length; c++) {
      const h = (headers[c] || "").toString().toLowerCase();
      if (h.includes("email")) emailCol = c;
      else if (h.includes("name")) nameCol = c;
      else if (h.includes("mobile") || h.includes("phone")) mobileCol = c;
      else if (h.includes("batch")) batchCol = c;
      else if (h.includes("course")) courseCol = c;
    }

    for (let i = 1; i < regData.length; i++) {
      const row = regData[i];
      const name = (row[nameCol] || "").toString().trim();
      const email = (row[emailCol] || "").toString().trim().toLowerCase();
      const mobile = (row[mobileCol] || "").toString().trim();
      const rawBatch = row[batchCol];
      
      let cleanBatch = formatBatchDisplay(rawBatch) || (rawBatch ? rawBatch.toString().trim() : "");
      if (!cleanBatch || cleanBatch.toLowerCase() === "batch") {
        cleanBatch = defaultActiveBatch;
      }

      const slug = slugify(cleanBatch);
      if (!batchesMap[slug]) {
        batchesMap[slug] = {
          id: slug,
          name: cleanBatch
        };
      }

      if (email && email.includes("@")) {
        studentsMap[email] = {
          id: registeredList.length + 1,
          name: name || email.split("@")[0],
          email: email,
          mobile: mobile,
          batch: cleanBatch,
          course: cleanBatch,
          presentDates: new Set()
        };
        registeredList.push(studentsMap[email]);
      }
    }
  }

  // 1b. Incorporate student emails defined in Settings tab
  if (settingsData && settingsData.length > 0) {
    let runningBatch = defaultActiveBatch;

    for (let r = 0; r < settingsData.length; r++) {
      const row = settingsData[r];
      const colF = (row[5] || "").toString().trim();
      if (colF && !isLikelyUrl(colF) && !colF.includes("@")) {
        const cleanF = formatBatchDisplay(colF);
        if (cleanF && cleanF.toLowerCase() !== "batch") runningBatch = cleanF;
      }

      for (let c = 0; c < row.length; c++) {
        const cell = (row[c] || "").toString().trim();
        if (cell.includes("@") && cell.includes(".")) {
          const emailsInCell = cell.split(/[,\s;]+/);
          emailsInCell.forEach(function(em) {
            const cleanEm = em.toLowerCase().trim();
            if (cleanEm && cleanEm.includes("@") && cleanEm.includes(".")) {
              if (!studentsMap[cleanEm]) {
                const sBatch = runningBatch || defaultActiveBatch;
                const slug = slugify(sBatch);
                if (!batchesMap[slug]) batchesMap[slug] = { id: slug, name: sBatch };

                studentsMap[cleanEm] = {
                  id: registeredList.length + 1,
                  name: cleanEm.split("@")[0],
                  email: cleanEm,
                  mobile: "",
                  batch: sBatch,
                  course: sBatch,
                  presentDates: new Set()
                };
                registeredList.push(studentsMap[cleanEm]);
              } else if (runningBatch && !studentsMap[cleanEm].batch) {
                studentsMap[cleanEm].batch = runningBatch;
              }
            }
          });
        }
      }
    }
  }

  // 2. Extract attendance dates and map student presence
  const uniqueDatesSet = new Set();
  const dateCountsMap = {};
  const batchDatesMap = {}; // batchName -> Set of class dates

  for (let i = 1; i < logData.length; i++) {
    const rawTimestamp = logData[i][0];
    const email = (logData[i][1] || "").toString().trim().toLowerCase();

    if (rawTimestamp) {
      const dateObj = new Date(rawTimestamp);
      if (!isNaN(dateObj.getTime())) {
        const dateStr = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "yyyy-MM-dd");

        if (studentsMap[email]) {
          uniqueDatesSet.add(dateStr);
          if (!dateCountsMap[dateStr]) {
            dateCountsMap[dateStr] = new Set();
          }
          dateCountsMap[dateStr].add(email);
          studentsMap[email].presentDates.add(dateStr);

          const bName = studentsMap[email].batch || defaultActiveBatch;
          if (!batchDatesMap[bName]) {
            batchDatesMap[bName] = new Set();
          }
          batchDatesMap[bName].add(dateStr);
        }
      }
    }
  }

  const sortedDates = Array.from(uniqueDatesSet).sort();
  const totalClassesHeld = sortedDates.length || 0;

  // 3. Last 2 class absentees
  const recentClassAbsentees = [];
  if (sortedDates.length > 0) {
    const lastDate = sortedDates[sortedDates.length - 1];
    const abs1 = [];
    registeredList.forEach(function(s) {
      if (!s.presentDates.has(lastDate)) abs1.push(s.name);
    });
    recentClassAbsentees.push({
      dateStr: lastDate,
      dateFormatted: formatFullDate(lastDate),
      title: formatFullDate(lastDate) + " Absentees",
      absentees: abs1
    });
  }

  if (sortedDates.length > 1) {
    const prevDate = sortedDates[sortedDates.length - 2];
    const abs2 = [];
    registeredList.forEach(function(s) {
      if (!s.presentDates.has(prevDate)) abs2.push(s.name);
    });
    recentClassAbsentees.push({
      dateStr: prevDate,
      dateFormatted: formatFullDate(prevDate),
      title: formatFullDate(prevDate) + " Absentees",
      absentees: abs2
    });
  }

  // 4. Compute peak turnout
  let peakCount = 0;
  let peakDate = "N/A";
  sortedDates.forEach(function(d) {
    const cnt = dateCountsMap[d] ? dateCountsMap[d].size : 0;
    if (cnt >= peakCount) {
      peakCount = cnt;
      peakDate = d;
    }
  });

  // 5. Compute candidate details
  let perfectAttendanceCount = 0;
  const totalStudentsCount = registeredList.length || 0;

  const studentsReport = registeredList.map(function(s) {
    const bName = s.batch || defaultActiveBatch;
    const studentBatchDates = batchDatesMap[bName] ? Array.from(batchDatesMap[bName]).sort() : sortedDates;
    const sTotalClasses = studentBatchDates.length > 0 ? studentBatchDates.length : 1;

    const presentCount = s.presentDates.size;
    const absentCount = Math.max(0, sTotalClasses - presentCount);
    const rate = sTotalClasses > 0 ? Math.round((presentCount / sTotalClasses) * 100) : 0;

    if (absentCount === 0 && sTotalClasses > 0) {
      perfectAttendanceCount++;
    }

    let maxStreak = 0;
    let curStreak = 0;
    let activeStreak = 0;

    studentBatchDates.forEach(function(d) {
      if (s.presentDates.has(d)) {
        curStreak++;
        if (curStreak > maxStreak) maxStreak = curStreak;
      } else {
        curStreak = 0;
      }
    });

    for (let i = studentBatchDates.length - 1; i >= 0; i--) {
      if (s.presentDates.has(studentBatchDates[i])) {
        activeStreak++;
      } else {
        break;
      }
    }

    const calendarTiles = studentBatchDates.map(function(d) {
      const isPresent = s.presentDates.has(d);
      const dayNum = parseInt(d.split("-")[2], 10);
      return {
        dateStr: d,
        dayNum: dayNum,
        formatted: formatFullDate(d),
        short: formatShortDate(d),
        status: isPresent ? "Present" : "Absent"
      };
    });

    const absentDates = studentBatchDates
      .filter(function(d) { return !s.presentDates.has(d); })
      .map(formatShortDate);

    let firstAttended = null;
    for (let j = 0; j < studentBatchDates.length; j++) {
      if (s.presentDates.has(studentBatchDates[j])) {
        firstAttended = studentBatchDates[j];
        break;
      }
    }
    const joinedFormatted = firstAttended ? formatFullDate(firstAttended) : (studentBatchDates[0] ? formatFullDate(studentBatchDates[0]) : "N/A");

    return {
      id: s.id,
      name: s.name,
      email: s.email,
      batch: s.batch,
      course: s.course,
      present: presentCount,
      absent: absentCount,
      rate: rate,
      bestStreak: maxStreak,
      currentStreak: activeStreak,
      joinedFormatted: joinedFormatted,
      calendarTiles: calendarTiles,
      absentDates: absentDates
    };
  });

  studentsReport.sort(function(a, b) { return b.rate - a.rate; });

  // 6. Aggregate summary metrics
  const totalMarksPresent = studentsReport.reduce(function(acc, curr) { return acc + curr.present; }, 0);
  const totalPossibleMarks = totalStudentsCount * (totalClassesHeld || 1);
  const overallRate = totalClassesHeld > 0 ? Math.round((totalMarksPresent / totalPossibleMarks) * 100) : 0;
  const avgPresentPerClass = totalClassesHeld > 0 ? Math.round(totalMarksPresent / totalClassesHeld) : 0;

  const startDateStr = sortedDates[0] ? formatFullDate(sortedDates[0]) : "N/A";
  const endDateStr = sortedDates.length > 0 ? formatFullDate(sortedDates[sortedDates.length - 1]) : "N/A";

  const trendLabels = sortedDates.map(formatShortDate);
  const trendCounts = sortedDates.map(function(d) { return dateCountsMap[d] ? dateCountsMap[d].size : 0; });

  const finalBatches = Object.values(batchesMap).map(function(b) {
    return {
      id: b.id,
      name: b.name,
      isLive: (b.id === slugify(defaultActiveBatch))
    };
  });

  return {
    batches: finalBatches,
    batchInfo: {
      batchName: defaultActiveBatch,
      overallAttendanceRate: overallRate + "%",
      overallAttendanceSub: totalClassesHeld > 0 ? (totalMarksPresent + " of " + totalPossibleMarks + " marks") : "0 marks",
      avgPresentPerClass: avgPresentPerClass,
      avgPresentSub: "out of " + totalStudentsCount + " candidates",
      classesHeld: totalClassesHeld,
      dateRangeSub: totalClassesHeld > 0 ? (startDateStr + " – " + endDateStr) : "No sessions held yet",
      perfectAttendanceCount: perfectAttendanceCount,
      perfectAttendanceSub: "candidates, 0 absences",
      peakTurnout: peakCount,
      peakTurnoutSub: peakDate !== "N/A" ? formatShortDate(peakDate) : "N/A",
      totalStudents: totalStudentsCount,
      allClassDates: sortedDates.map(function(d) {
        return {
          dateStr: d,
          short: formatShortDate(d),
          full: formatFullDate(d),
          turnout: dateCountsMap[d] ? dateCountsMap[d].size : 0
        };
      })
    },
    recentAbsentees: recentClassAbsentees,
    trend: {
      dates: trendLabels,
      counts: trendCounts
    },
    students: studentsReport
  };
}

// =========================================================================
// 4. HELPER UTILITIES
// =========================================================================

function registerBatchUrl(map, batchName, url) {
  if (!map || !batchName || !url) return;
  const raw = batchName.toString().trim();
  const slug = slugify(raw);
  const lower = raw.toLowerCase();
  map[slug] = url;
  map[lower] = url;
  const clean = formatBatchDisplay(raw);
  if (clean) {
    map[clean.toLowerCase()] = url;
    map[slugify(clean)] = url;
  }
}

function formatBatchDisplay(raw) {
  if (!raw) return "";
  let str = raw.toString().trim();
  if (!str || str.toLowerCase() === "batch" || str.toLowerCase() === "batch name" || isLikelyUrl(str) || str.includes("@")) return "";
  // Strip trailing "Batch" if redundant
  str = str.replace(/\bBatch\b/gi, "").trim();
  // Replace underscores with clean spaces
  str = str.replace(/_+/g, " ").replace(/\s{2,}/g, " ").trim();
  return str;
}

function slugify(str) {
  if (!str) return "";
  return str.toString().toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isLikelyUrl(str) {
  if (!str) return false;
  const s = str.toString().trim();
  const lower = s.toLowerCase();
  if (lower === "meeting link" || lower === "joining link" || lower === "batch link" || lower === "link" || lower === "url" || lower === "meeting url") return false;
  return lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("/go/") || lower.startsWith("/") || lower.includes("teams.microsoft.com") || lower.includes("meet.google.com") || lower.includes("zoom.us") || lower.includes(".com/") || lower.includes(".ms/") || (lower.includes(".") && lower.includes("/") && s.length > 8);
}

function formatShortDate(dateStr) {
  if (!dateStr || dateStr === "N/A") return "N/A";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = parseInt(parts[2], 10);
  const month = months[parseInt(parts[1], 10) - 1] || parts[1];
  return day + " " + month;
}

function formatFullDate(dateStr) {
  if (!dateStr || dateStr === "N/A") return "N/A";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayName = days[d.getDay()] || "";
  const dayNum = String(d.getDate()).padStart(2, "0");
  const monthName = months[d.getMonth()] || "";
  const year = d.getFullYear();
  return dayName + ", " + dayNum + " " + monthName + " " + year;
}

function getSheet(ss, name) {
  if (!ss) return null;
  const direct = ss.getSheetByName(name);
  if (direct) return direct;
  
  const sheets = ss.getSheets();
  const cleanTarget = name.toLowerCase().replace(/[\s_-]+/g, "");
  for (let i = 0; i < sheets.length; i++) {
    const sName = sheets[i].getName().toLowerCase().replace(/[\s_-]+/g, "");
    if (sName === cleanTarget) return sheets[i];
  }
  return null;
}

function showAlertIfUI(title, message) {
  try {
    const ui = SpreadsheetApp.getUi();
    if (ui) ui.alert(title, message, ui.ButtonSet.OK);
  } catch (_) {}
}
