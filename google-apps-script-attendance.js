/**
 * Google Apps Script for RPAVault Live Class Attendance & Dynamic Dashboard
 * 
 * Google Sheet Tabs:
 * 1. "Registered_Students": Name | Email | Mobile Number | Batch | Course
 * 2. "Settings" (Optional): Meeting_URL | Admin_Email | Batches & Joining Links
 * 3. "Attendance_Logs" (22 Columns): Timestamp | Email | IP | City | Region | Country | OS | Browser | Device | Screen | Lang | Visitor Type | Visitor ID | Visit Count | First Visit | Path Trail | Referrer | Time Spent | Timezone | Source Path | Source Title | Local Time
 *
 * Menu Features:
 * - ⚡ RPAVault Attendance Menu:
 *   1. 🔄 Sync Dashboard Cache (Instant Web Loading)
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
 * 180-Day Auto-Purge: Deletes attendance log entries older than 180 days
 * to keep the spreadsheet lightweight and performant.
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

    // Retain row if within 180 days or if timestamp was empty
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
 * Sync & Precompute Dashboard Cache:
 * Caches the entire dashboard JSON payload in CacheService (TTL 6 hrs) and Script Properties.
 * Makes web requests load in ~30ms instead of 4+ seconds!
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
              "• Total Registered Candidates: " + (payload.students ? payload.students.length : 0) + "\n" +
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

    // 1. Read Settings tab
    const adminEmails = new Set();
    const adminMeetingMap = {}; // email -> specific meeting URL from column C
    const tempMeetingMap = {};  // temp email -> specific meeting URL from column C
    const batchMeetingMap = {}; // batch identifier/slug -> meeting URL
    let defaultBatchMeetingUrl = "";
    let activeSettingsBatch = "";
    let activeSettingsCourse = "RPA Uipath & PA";

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
          const colE = (row[4] || "").toString().trim();
          const colF = (row[5] || "").toString().trim();
          const colG = (row[6] || "").toString().trim(); // Column G: Batch joining link

          const keyA = colA.toLowerCase();
          const keyB = colB.toLowerCase();

          // Check if this row declares or updates active batch/course
          [colA, colB, colD, colE, colF].forEach(function(val) {
            if (isBatchString(val)) {
              activeSettingsBatch = formatCleanBatch(val);
              if (!settingsBatchesList.includes(activeSettingsBatch)) {
                settingsBatchesList.push(activeSettingsBatch);
              }
            } else if (!val.includes("@") && /(rpa|uipath|power\s*automate|python|data)/i.test(val)) {
              activeSettingsCourse = val;
            }
          });

          // Process Column G (Batch joining link)
          if (colG && isLikelyUrl(colG)) {
            if (!defaultBatchMeetingUrl) defaultBatchMeetingUrl = colG;

            if (activeSettingsBatch) {
              registerBatchUrl(batchMeetingMap, activeSettingsBatch, colG);
            }

            [colA, colB, colD, colE, colF].forEach(function(val) {
              const clean = (val || "").toString().trim();
              if (clean && !isLikelyUrl(clean) && !clean.includes("@")) {
                if (isBatchString(clean)) {
                  registerBatchUrl(batchMeetingMap, clean, colG);
                }
              }
            });
          }

          // Process Column C (Admin / Temp meeting link)
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

    // 2. Check Registered Students
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
            if (isBatchString(rawB)) {
              batchName = formatCleanBatch(rawB);
            }
            courseName = (row[courseCol] || "").toString().trim();
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
        let runningCourse = activeSettingsCourse || "RPA Uipath & PA";

        for (let r = 0; r < sData.length; r++) {
          const row = sData[r];
          const colA = (row[0] || "").toString().trim();
          const colB = (row[1] || "").toString().trim();
          const colD = (row[3] || "").toString().trim();
          const colE = (row[4] || "").toString().trim();

          [colA, colB, colD, colE].forEach(function(val) {
            if (isBatchString(val)) {
              runningBatch = formatCleanBatch(val);
            } else if (!val.includes("@") && /(rpa|uipath|power\s*automate|python|data)/i.test(val)) {
              runningCourse = val;
            }
          });

          for (let c = 0; c < row.length; c++) {
            const cell = (row[c] || "").toString().trim().toLowerCase();
            if (cell.includes(inputEmail)) {
              isStudent = true;
              studentName = studentName || inputEmail.split("@")[0];
              if (!batchName && runningBatch) batchName = runningBatch;
              if (!courseName && runningCourse) courseName = runningCourse;
              break;
            }
          }
          if (isStudent && batchName) break;
        }
      } catch (_) {}
    }

    // Fallback batch if student is registered but batch wasn't explicitly populated
    if (isStudent && !batchName) {
      batchName = activeSettingsBatch || (settingsBatchesList.length > 0 ? settingsBatchesList[0] : "Sep 2026 Batch");
    }

    // 3. Evaluate verification and assign meeting URL
    const isTempUser = !!tempMeetingMap[inputEmail];
    const isAdmin = adminEmails.has(inputEmail) || !!adminMeetingMap[inputEmail];
    const action = (params.action || "").toString().trim().toLowerCase();

    let meetingUrl = "";
    let isVerified = false;
    let failMessage = "This is only for registered users, please contact us to register.";

    if (action === "dashboard_access") {
      // Temp emails are NOT allowed to open attendance dashboard
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
          const bNoBatch = batchName.replace(/\bbatch\b/gi, '').trim();

          if (batchMeetingMap[bSlug]) batchUrl = batchMeetingMap[bSlug];
          else if (batchMeetingMap[bKey]) batchUrl = batchMeetingMap[bKey];
          else if (bNoBatch && batchMeetingMap[bNoBatch.toLowerCase()]) batchUrl = batchMeetingMap[bNoBatch.toLowerCase()];
          else if (bNoBatch && batchMeetingMap[slugify(bNoBatch)]) batchUrl = batchMeetingMap[slugify(bNoBatch)];
          else if (courseName && batchMeetingMap[slugify(courseName)]) batchUrl = batchMeetingMap[slugify(courseName)];
          else if (courseName && batchMeetingMap[courseName.toLowerCase()]) batchUrl = batchMeetingMap[courseName.toLowerCase()];
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

    // Quick sync trigger via GET
    if (action === "sync") {
      const synced = syncDashboardCache();
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Dashboard cache synced", payload: synced })).setMimeType(ContentService.MimeType.JSON);
    }

    // Quick cleanup trigger via GET
    if (action === "cleanup") {
      const res = cleanupOldAttendanceLogs();
      return ContentService.createTextOutput(JSON.stringify({ success: true, cleanup: res })).setMimeType(ContentService.MimeType.JSON);
    }

    // Default action: getDashboard
    if (action === "getdashboard" || !action) {
      // 1. Return cached payload if available and not forcing refresh
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

      // 2. Compute fresh dashboard payload and update cache
      const payload = syncDashboardCache();
      return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "alive", action: action })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Builds the entire dashboard metrics, benchmarking data, and clean batch lists
 */
function buildDashboardPayload() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const regSheet = getSheet(ss, "Registered_Students");
  const settingsSheet = getSheet(ss, "Settings");
  const logSheet = getSheet(ss, "Attendance_Logs");

  const regData = regSheet ? regSheet.getDataRange().getValues() : [];
  const settingsData = settingsSheet ? settingsSheet.getDataRange().getValues() : [];
  const logData = logSheet ? logSheet.getDataRange().getValues() : [];

  // Track discovered valid batches
  const batchesMap = {}; // slug -> { name, course }
  let defaultActiveBatch = "Sep 2026 Batch";

  // Scan Settings tab first for explicitly defined batches
  let activeSettingsBatch = "";
  let activeSettingsCourse = "RPA Uipath & PA";

  if (settingsData && settingsData.length > 0) {
    for (let r = 0; r < settingsData.length; r++) {
      const row = settingsData[r];
      const colA = (row[0] || "").toString().trim();
      const colB = (row[1] || "").toString().trim();
      const colD = (row[3] || "").toString().trim();
      const colE = (row[4] || "").toString().trim();
      const colF = (row[5] || "").toString().trim();

      [colA, colB, colD, colE, colF].forEach(function(val) {
        if (isBatchString(val)) {
          const bClean = formatCleanBatch(val);
          activeSettingsBatch = bClean;
          defaultActiveBatch = bClean;
          const key = slugify(activeSettingsCourse + "-" + bClean);
          batchesMap[key] = { name: bClean, course: activeSettingsCourse };
        } else if (!val.includes("@") && /(rpa|uipath|power\s*automate|python|data)/i.test(val)) {
          activeSettingsCourse = val;
        }
      });
    }
  }

  // 1. Extract registered students from "Registered_Students"
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
      
      let cleanBatch = "";
      if (isBatchString(rawBatch)) {
        cleanBatch = formatCleanBatch(rawBatch);
      } else {
        // Fallback to active batch if row batch is a date or missing
        cleanBatch = defaultActiveBatch;
      }

      const cleanCourse = (row[courseCol] || "").toString().trim() || "RPA Uipath & PA";
      if (cleanBatch) {
        const bKey = slugify(cleanCourse + "-" + cleanBatch);
        if (!batchesMap[bKey]) batchesMap[bKey] = { name: cleanBatch, course: cleanCourse };
      }

      if (email && email.includes("@")) {
        studentsMap[email] = {
          id: registeredList.length + 1,
          name: name || email.split("@")[0],
          email: email,
          mobile: mobile,
          batch: cleanBatch,
          course: cleanCourse,
          presentDates: new Set()
        };
        registeredList.push(studentsMap[email]);
      }
    }
  }

  // 1b. Also incorporate student emails defined in "Settings" tab
  if (settingsData && settingsData.length > 0) {
    let runningBatch = activeSettingsBatch || defaultActiveBatch;
    let runningCourse = activeSettingsCourse || "RPA Uipath & PA";

    for (let r = 0; r < settingsData.length; r++) {
      const row = settingsData[r];
      const colA = (row[0] || "").toString().trim();
      const colB = (row[1] || "").toString().trim();
      const colD = (row[3] || "").toString().trim();
      const colE = (row[4] || "").toString().trim();

      [colA, colB, colD, colE].forEach(function(val) {
        if (isBatchString(val)) {
          runningBatch = formatCleanBatch(val);
        } else if (!val.includes("@") && /(rpa|uipath|power\s*automate|python|data)/i.test(val)) {
          runningCourse = val;
        }
      });

      for (let c = 0; c < row.length; c++) {
        const cell = (row[c] || "").toString().trim();
        if (cell.includes("@") && cell.includes(".")) {
          const emailsInCell = cell.split(/[,\s;]+/);
          emailsInCell.forEach(function(em) {
            const cleanEm = em.toLowerCase().trim();
            if (cleanEm && cleanEm.includes("@") && cleanEm.includes(".")) {
              if (!studentsMap[cleanEm]) {
                const sBatch = runningBatch || defaultActiveBatch;
                const sCourse = runningCourse || "RPA Uipath & PA";
                const bKey = slugify(sCourse + "-" + sBatch);
                if (!batchesMap[bKey]) batchesMap[bKey] = { name: sBatch, course: sCourse };

                studentsMap[cleanEm] = {
                  id: registeredList.length + 1,
                  name: cleanEm.split("@")[0],
                  email: cleanEm,
                  mobile: "",
                  batch: sBatch,
                  course: sCourse,
                  presentDates: new Set()
                };
                registeredList.push(studentsMap[cleanEm]);
              } else if (runningBatch && (!studentsMap[cleanEm].batch || !isBatchString(studentsMap[cleanEm].batch))) {
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

  return {
    batches: Object.values(batchesMap),
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
  const noBatch = raw.replace(/\bbatch\b/gi, '').trim();
  if (noBatch) {
    map[noBatch.toLowerCase()] = url;
    map[slugify(noBatch)] = url;
  }
}

/**
 * Distinguishes genuine batch/cohort names from single class dates or logs
 */
function isBatchString(val) {
  if (!val) return false;
  if (val instanceof Date) return false;
  const str = val.toString().trim();
  if (!str || str.includes("@") || str.toLowerCase().startsWith("http") || str.length > 60) return false;

  // Single class dates without year (e.g. "1 Sep", "16 Sep", "20-Jul", "05/09") -> NOT batches!
  if (/^\d{1,2}[\s\/\.-]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*$/i.test(str)) return false;
  if (/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\/\.-]+\d{1,2}$/i.test(str)) return false;

  // Explicit keyword "batch" or "cohort"
  if (/\b(batch|cohort)\b/i.test(str)) return true;

  // Month + Year (e.g. sep2026, sep 2026, september 2026, sep-26, 17 sep 2026, 16sep26)
  if (/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s_-]*(?:20\d{2}|\d{2})/i.test(str)) return true;
  if (/(?:20\d{2})[\s_-]*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(str)) return true;

  return false;
}

function formatCleanBatch(rawBatch) {
  if (!rawBatch) return "";
  try {
    let str = rawBatch.toString().trim();
    if (!str) return "";

    // If month + year format like sep2026, sep 2026, sep-2026
    const myMatch = str.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s_-]*(20\d{2}|\d{2})$/i);
    if (myMatch) {
      const m = myMatch[1].charAt(0).toUpperCase() + myMatch[1].slice(1).toLowerCase();
      let y = myMatch[2];
      if (y.length === 2) y = "20" + y;
      return m + " " + y + " Batch";
    }

    str = str.replace(/\s{2,}/g, " ").trim();
    if (!/\bbatch\b/i.test(str) && !/\bcohort\b/i.test(str)) {
      str = str + " Batch";
    }
    return str;
  } catch (_) {
    return (rawBatch || "").toString().trim();
  }
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
