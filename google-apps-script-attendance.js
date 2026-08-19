/**
 * Google Apps Script for RPAVault Live Class Attendance & Dynamic Dashboard
 * 
 * Google Sheet Tab Structure:
 * 1. "Registered_Students" tab:
 *    - Column A: Name
 *    - Column B: Email
 *    - Column C: Mobile Number
 *    - Column D: Batch
 * 
 * 2. "Attendance_Logs" tab (22 Columns in exact order):
 *    - Column A: Timestamp
 *    - Column B: Email
 *    - Column C: IP Address
 *    - Column D: City
 *    - Column E: Region
 *    - Column F: Country
 *    - Column G: OS
 *    - Column H: Browser
 *    - Column I: Device Type
 *    - Column J: Screen Size
 *    - Column K: Browser Language
 *    - Column L: Visitor Type
 *    - Column M: Visitor ID
 *    - Column N: Visit Count
 *    - Column O: First Visit Date
 *    - Column P: Path Trail
 *    - Column Q: Referrer
 *    - Column R: Time Spent on Page (sec)
 *    - Column S: Timezone
 *    - Column T: Source Page Path
 *    - Column U: Source Page Title
 *    - Column V: Local Time Submitted
 */

const REDIRECT_MEETING_URL = "/go/join-rpa-meeting";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    const sheetApp = SpreadsheetApp.getActiveSpreadsheet();
    const regSheet = sheetApp.getSheetByName("Registered_Students");
    const logSheet = sheetApp.getSheetByName("Attendance_Logs");

    // Parse parameters
    let params = e.parameter || {};
    if (e.postData && e.postData.contents) {
      try {
        const parsed = JSON.parse(e.postData.contents);
        params = Object.assign({}, params, parsed);
      } catch (parseErr) {}
    }

    const inputEmail = (params.email || "").trim().toLowerCase();

    if (!inputEmail) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        verified: false,
        message: "Email is required."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Verify against Registered_Students tab (Column B: Email)
    const regData = regSheet.getDataRange().getValues();
    let isRegistered = false;
    let registeredName = "";
    let batchName = "";

    // Row 1 is header (Name, Email, Mobile Number, Batch)
    for (let i = 1; i < regData.length; i++) {
      const rowName = regData[i][0];
      const rowEmail = (regData[i][1] || "").toString().trim().toLowerCase();
      const rowBatch = regData[i][3];

      if (rowEmail === inputEmail) {
        isRegistered = true;
        registeredName = rowName || inputEmail.split("@")[0];
        batchName = rowBatch || "Live Batch";
        break;
      }
    }

    if (!isRegistered) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        verified: false,
        message: "This is only for registered users."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Extract full telemetry metadata
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
    const localTime = params["Session: Local Time Submitted"] || params.local_time || new Date().toString();

    // 3. Log attendance & metadata (22 values)
    const now = new Date();
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

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      verified: true,
      redirectUrl: REDIRECT_MEETING_URL,
      student: {
        name: registeredName,
        email: inputEmail,
        batch: batchName
      }
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    const sheetApp = SpreadsheetApp.getActiveSpreadsheet();
    const regSheet = sheetApp.getSheetByName("Registered_Students");
    const logSheet = sheetApp.getSheetByName("Attendance_Logs");

    const regData = regSheet.getDataRange().getValues();
    const logData = logSheet.getDataRange().getValues();

    // 1. Extract all registered students
    const studentsMap = {};
    const registeredList = [];
    let detectedBatch = "Live RPA Batch";

    for (let i = 1; i < regData.length; i++) {
      const name = regData[i][0];
      const email = (regData[i][1] || "").toString().trim().toLowerCase();
      const mobile = regData[i][2] || "";
      const batch = regData[i][3] || "";
      if (batch) detectedBatch = batch;

      if (email) {
        studentsMap[email] = {
          id: i,
          name: name || email.split("@")[0],
          email: email,
          mobile: mobile,
          batch: batch,
          presentDates: new Set()
        };
        registeredList.push(studentsMap[email]);
      }
    }

    // 2. Extract unique class dates and map attendance
    const uniqueDatesSet = new Set();
    const dateCountsMap = {};

    for (let i = 1; i < logData.length; i++) {
      const rawTimestamp = logData[i][0];
      const email = (logData[i][1] || "").toString().trim().toLowerCase();

      if (rawTimestamp) {
        const dateObj = new Date(rawTimestamp);
        if (!isNaN(dateObj.getTime())) {
          const dateStr = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "yyyy-MM-dd");
          uniqueDatesSet.add(dateStr);

          // Track unique student visits per date for turnout count
          if (!dateCountsMap[dateStr]) {
            dateCountsMap[dateStr] = new Set();
          }
          if (email) {
            dateCountsMap[dateStr].add(email);
          }

          // Mark present for student
          if (studentsMap[email]) {
            studentsMap[email].presentDates.add(dateStr);
          }
        }
      }
    }

    const sortedDates = Array.from(uniqueDatesSet).sort();
    const totalClassesHeld = sortedDates.length || 1;
    const latestDate = sortedDates[sortedDates.length - 1] || "N/A";

    // 3. Compute peak turnout and date
    let peakCount = 0;
    let peakDate = "N/A";
    sortedDates.forEach(d => {
      const cnt = dateCountsMap[d] ? dateCountsMap[d].size : 0;
      if (cnt >= peakCount) {
        peakCount = cnt;
        peakDate = d;
      }
    });

    // 4. Compute absentees on latest class date
    const latestAbsentees = [];
    registeredList.forEach(student => {
      if (!student.presentDates.has(latestDate)) {
        latestAbsentees.push(student.name);
      }
    });

    // 5. Compute candidate stats & perfect attendance
    let perfectAttendanceCount = 0;
    const totalStudentsCount = registeredList.length || 1;

    const studentsReport = registeredList.map(s => {
      const presentCount = s.presentDates.size;
      const absentCount = Math.max(0, totalClassesHeld - presentCount);
      const rate = Math.round((presentCount / totalClassesHeld) * 100);

      if (absentCount === 0 && totalClassesHeld > 0) {
        perfectAttendanceCount++;
      }

      const absentDates = sortedDates
        .filter(d => !s.presentDates.has(d))
        .map(formatDisplayDate);

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        batch: s.batch,
        present: presentCount,
        absent: absentCount,
        rate: rate,
        absentDates: absentDates
      };
    });

    // Sort leaderboard by percentage descending
    studentsReport.sort((a, b) => b.rate - a.rate);

    // 6. Aggregate summary metrics
    const totalMarksPresent = studentsReport.reduce((acc, curr) => acc + curr.present, 0);
    const totalPossibleMarks = totalStudentsCount * totalClassesHeld;
    const overallRate = Math.round((totalMarksPresent / totalPossibleMarks) * 100) || 0;
    const avgPresentPerClass = Math.round(totalMarksPresent / totalClassesHeld) || 0;

    const startDateStr = sortedDates[0] ? formatDisplayDate(sortedDates[0]) : "N/A";
    const endDateStr = sortedDates[sortedDates.length - 1] ? formatDisplayDate(sortedDates[sortedDates.length - 1]) : "N/A";

    const trendLabels = sortedDates.map(formatDisplayDate);
    const trendCounts = sortedDates.map(d => dateCountsMap[d] ? dateCountsMap[d].size : 0);

    const payload = {
      batchInfo: {
        batchName: detectedBatch,
        overallAttendanceRate: `${overallRate}%`,
        overallAttendanceSub: `${totalMarksPresent} of ${totalPossibleMarks} marks`,
        avgPresentPerClass: avgPresentPerClass,
        avgPresentSub: `out of ${totalStudentsCount} candidates`,
        classesHeld: totalClassesHeld,
        dateRangeSub: `${startDateStr} – ${endDateStr}`,
        perfectAttendanceCount: perfectAttendanceCount,
        perfectAttendanceSub: `candidates, 0 absences`,
        peakTurnout: peakCount,
        peakTurnoutSub: formatDisplayDate(peakDate),
        totalStudents: totalStudentsCount
      },
      latestClass: {
        date: latestDate !== "N/A" ? formatDisplayDate(latestDate) : "N/A",
        absentees: latestAbsentees
      },
      trend: {
        dates: trendLabels,
        counts: trendCounts
      },
      students: studentsReport
    };

    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDisplayDate(dateStr) {
  if (!dateStr || dateStr === "N/A") return "N/A";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = parseInt(parts[2], 10);
  const month = months[parseInt(parts[1], 10) - 1] || parts[1];
  return `${day} ${month}`;
}
