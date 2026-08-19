/**
 * Google Apps Script for RPAVault Live Class Attendance & Dynamic Dashboard
 * 
 * Works flexibly with any Sheet naming:
 * - "Registered Students" or "Registered_Students"
 * - "Attendance Logs" or "Attendance_Logs"
 * - "Settings"
 */

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Parse incoming payload safely
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
    const action = (params.action || "join").toString().trim().toLowerCase();

    if (!inputEmail) {
      return jsonResponse({ success: false, verified: false, message: "Please enter your email ID." });
    }

    // Flexible sheet discovery (handles spaces, underscores, and case differences)
    const regSheet = findSheet(ss, ["Registered_Students", "Registered Students", "Students", "Registered"]);
    const settingsSheet = findSheet(ss, ["Settings", "Config", "Setting"]);
    const logSheet = findSheet(ss, ["Attendance_Logs", "Attendance Logs", "Logs", "Attendance"]);

    // 1. Read Settings (Meeting URL & Admins)
    let meetingUrl = "https://teams.microsoft.com";
    const adminEmails = new Set();

    if (settingsSheet) {
      const sData = settingsSheet.getDataRange().getValues();
      for (let r = 0; r < sData.length; r++) {
        const row = sData[r];
        const key = (row[0] || "").toString().trim().toLowerCase();
        const val = (row[1] || "").toString().trim();

        if (key.includes("meeting") || key.includes("teams") || key.includes("url") || key.includes("link")) {
          if (val.startsWith("http")) meetingUrl = val;
        }

        // Look for Admin in any column or key
        if (key.includes("admin")) {
          val.split(/[,\s;]+/).forEach(em => {
            const clean = em.toLowerCase().trim();
            if (clean && clean.includes("@")) adminEmails.add(clean);
          });
        }
        
        // Also check if Column B or C has an admin email
        for (let c = 0; c < row.length; c++) {
          const cellStr = (row[c] || "").toString().trim().toLowerCase();
          if (key.includes("admin") && cellStr.includes("@")) {
            adminEmails.add(cellStr);
          }
        }
      }
    }

    // 2. Check if user is an Admin
    let isAdmin = adminEmails.has(inputEmail);
    let isStudent = false;
    let studentName = isAdmin ? "Admin" : "";
    let batchName = "";

    // 3. Check Registered Students
    if (regSheet) {
      const regData = regSheet.getDataRange().getValues();
      if (regData.length > 0) {
        // Detect Email Column (default to column 1 if not found)
        let emailCol = 1;
        let nameCol = 0;
        let batchCol = 3;

        const headerRow = regData[0];
        for (let c = 0; c < headerRow.length; c++) {
          const h = headerRow[c].toString().toLowerCase();
          if (h.includes("email")) emailCol = c;
          else if (h.includes("name")) nameCol = c;
          else if (h.includes("batch")) batchCol = c;
        }

        for (let r = 1; r < regData.length; r++) {
          const rowEmail = (regData[r][emailCol] || "").toString().trim().toLowerCase();
          
          // Also check across all cells in the row just in case columns shifted
          let matchedRow = false;
          if (rowEmail === inputEmail) {
            matchedRow = true;
          } else {
            for (let c = 0; c < regData[r].length; c++) {
              if ((regData[r][c] || "").toString().trim().toLowerCase() === inputEmail) {
                matchedRow = true;
                break;
              }
            }
          }

          if (matchedRow) {
            isStudent = true;
            if (!isAdmin) {
              studentName = (regData[r][nameCol] || "").toString().trim() || inputEmail.split("@")[0];
              batchName = formatCleanBatch(regData[r][batchCol]);
            }
            break;
          }
        }
      }
    }

    const isVerified = (isAdmin || isStudent);

    // 4. ALWAYS log to Attendance_Logs (even wrong/unregistered emails so they become leads!)
    if (logSheet) {
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
    }

    if (!isVerified) {
      return jsonResponse({
        success: false,
        verified: false,
        message: "This portal is strictly for registered members."
      });
    }

    return jsonResponse({
      success: true,
      verified: true,
      isAdmin: isAdmin,
      redirectUrl: meetingUrl,
      student: {
        name: studentName,
        email: inputEmail,
        batch: batchName,
        isAdmin: isAdmin
      }
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const regSheet = findSheet(ss, ["Registered_Students", "Registered Students", "Students", "Registered"]);
    const logSheet = findSheet(ss, ["Attendance_Logs", "Attendance Logs", "Logs", "Attendance"]);

    const regData = regSheet ? regSheet.getDataRange().getValues() : [];
    const logData = logSheet ? logSheet.getDataRange().getValues() : [];

    // 1. Extract registered students
    const studentsMap = {};
    const registeredList = [];
    let detectedBatch = "Live RPA Batch";

    if (regData.length > 1) {
      let emailCol = 1;
      let nameCol = 0;
      let mobileCol = 2;
      let batchCol = 3;

      const headerRow = regData[0];
      for (let c = 0; c < headerRow.length; c++) {
        const h = headerRow[c].toString().toLowerCase();
        if (h.includes("email")) emailCol = c;
        else if (h.includes("name")) nameCol = c;
        else if (h.includes("mobile") || h.includes("phone")) mobileCol = c;
        else if (h.includes("batch")) batchCol = c;
      }

      for (let i = 1; i < regData.length; i++) {
        const name = (regData[i][nameCol] || "").toString().trim();
        const email = (regData[i][emailCol] || "").toString().trim().toLowerCase();
        const mobile = (regData[i][mobileCol] || "").toString().trim();
        const cleanBatch = formatCleanBatch(regData[i][batchCol]);
        if (cleanBatch) detectedBatch = cleanBatch;

        if (email && email.includes("@")) {
          studentsMap[email] = {
            id: i,
            name: name || email.split("@")[0],
            email: email,
            mobile: mobile,
            batch: cleanBatch,
            presentDates: new Set()
          };
          registeredList.push(studentsMap[email]);
        }
      }
    }

    // 2. Extract unique class dates and map student attendance
    const uniqueDatesSet = new Set();
    const dateCountsMap = {};

    for (let i = 1; i < logData.length; i++) {
      const rawTimestamp = logData[i][0];
      const email = (logData[i][1] || "").toString().trim().toLowerCase();

      if (rawTimestamp) {
        const dateObj = new Date(rawTimestamp);
        if (!isNaN(dateObj.getTime())) {
          const dateStr = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "yyyy-MM-dd");
          
          // Only count dates if it matches a registered student (filter out random non-student test entries from skewing batch stats)
          if (studentsMap[email]) {
            uniqueDatesSet.add(dateStr);
            if (!dateCountsMap[dateStr]) {
              dateCountsMap[dateStr] = new Set();
            }
            dateCountsMap[dateStr].add(email);
            studentsMap[email].presentDates.add(dateStr);
          }
        }
      }
    }

    const sortedDates = Array.from(uniqueDatesSet).sort();
    const totalClassesHeld = sortedDates.length || 0;

    // 3. Last 2 class absentees with clean date titles
    const recentClassAbsentees = [];
    if (sortedDates.length > 0) {
      const lastDate = sortedDates[sortedDates.length - 1];
      const abs1 = [];
      registeredList.forEach(s => {
        if (!s.presentDates.has(lastDate)) abs1.push(s.name);
      });
      recentClassAbsentees.push({
        dateStr: lastDate,
        dateFormatted: formatFullDate(lastDate),
        title: `${formatFullDate(lastDate)} Absentees`,
        absentees: abs1
      });
    }

    if (sortedDates.length > 1) {
      const prevDate = sortedDates[sortedDates.length - 2];
      const abs2 = [];
      registeredList.forEach(s => {
        if (!s.presentDates.has(prevDate)) abs2.push(s.name);
      });
      recentClassAbsentees.push({
        dateStr: prevDate,
        dateFormatted: formatFullDate(prevDate),
        title: `${formatFullDate(prevDate)} Absentees`,
        absentees: abs2
      });
    }

    // 4. Compute peak turnout
    let peakCount = 0;
    let peakDate = "N/A";
    sortedDates.forEach(d => {
      const cnt = dateCountsMap[d] ? dateCountsMap[d].size : 0;
      if (cnt >= peakCount) {
        peakCount = cnt;
        peakDate = d;
      }
    });

    // 5. Compute candidate details
    let perfectAttendanceCount = 0;
    const totalStudentsCount = registeredList.length || 0;

    const studentsReport = registeredList.map(s => {
      const presentCount = s.presentDates.size;
      const absentCount = totalClassesHeld > 0 ? Math.max(0, totalClassesHeld - presentCount) : 0;
      const rate = totalClassesHeld > 0 ? Math.round((presentCount / totalClassesHeld) * 100) : 0;

      if (absentCount === 0 && totalClassesHeld > 0) {
        perfectAttendanceCount++;
      }

      let maxStreak = 0;
      let curStreak = 0;
      let activeStreak = 0;

      sortedDates.forEach(d => {
        if (s.presentDates.has(d)) {
          curStreak++;
          if (curStreak > maxStreak) maxStreak = curStreak;
        } else {
          curStreak = 0;
        }
      });

      for (let i = sortedDates.length - 1; i >= 0; i--) {
        if (s.presentDates.has(sortedDates[i])) {
          activeStreak++;
        } else {
          break;
        }
      }

      const calendarTiles = sortedDates.map(d => {
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

      const absentDates = sortedDates
        .filter(d => !s.presentDates.has(d))
        .map(formatShortDate);

      const firstAttended = sortedDates.find(d => s.presentDates.has(d));
      const joinedFormatted = firstAttended ? formatFullDate(firstAttended) : (sortedDates[0] ? formatFullDate(sortedDates[0]) : "N/A");

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        batch: s.batch,
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

    studentsReport.sort((a, b) => b.rate - a.rate);

    // 6. Aggregate summary metrics
    const totalMarksPresent = studentsReport.reduce((acc, curr) => acc + curr.present, 0);
    const totalPossibleMarks = totalStudentsCount * (totalClassesHeld || 1);
    const overallRate = totalClassesHeld > 0 ? Math.round((totalMarksPresent / totalPossibleMarks) * 100) : 0;
    const avgPresentPerClass = totalClassesHeld > 0 ? Math.round(totalMarksPresent / totalClassesHeld) : 0;

    const startDateStr = sortedDates[0] ? formatFullDate(sortedDates[0]) : "N/A";
    const endDateStr = sortedDates.length > 0 ? formatFullDate(sortedDates[sortedDates.length - 1]) : "N/A";

    const trendLabels = sortedDates.map(formatShortDate);
    const trendCounts = sortedDates.map(d => dateCountsMap[d] ? dateCountsMap[d].size : 0);

    const payload = {
      batchInfo: {
        batchName: detectedBatch,
        overallAttendanceRate: `${overallRate}%`,
        overallAttendanceSub: totalClassesHeld > 0 ? `${totalMarksPresent} of ${totalPossibleMarks} marks` : "0 marks",
        avgPresentPerClass: avgPresentPerClass,
        avgPresentSub: `out of ${totalStudentsCount} candidates`,
        classesHeld: totalClassesHeld,
        dateRangeSub: totalClassesHeld > 0 ? `${startDateStr} – ${endDateStr}` : "No sessions held yet",
        perfectAttendanceCount: perfectAttendanceCount,
        perfectAttendanceSub: `candidates, 0 absences`,
        peakTurnout: peakCount,
        peakTurnoutSub: peakDate !== "N/A" ? formatShortDate(peakDate) : "N/A",
        totalStudents: totalStudentsCount,
        allClassDates: sortedDates.map(d => ({
          dateStr: d,
          short: formatShortDate(d),
          full: formatFullDate(d),
          turnout: dateCountsMap[d] ? dateCountsMap[d].size : 0
        }))
      },
      recentAbsentees: recentClassAbsentees,
      trend: {
        dates: trendLabels,
        counts: trendCounts
      },
      students: studentsReport
    };

    return jsonResponse(payload);

  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Case-insensitive & symbol-insensitive tab finder
function findSheet(ss, possibleNames) {
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    const sName = sheets[i].getName().toLowerCase().replace(/[\s_-]+/g, "");
    for (let j = 0; j < possibleNames.length; j++) {
      const pName = possibleNames[j].toLowerCase().replace(/[\s_-]+/g, "");
      if (sName === pName) return sheets[i];
    }
  }
  return null;
}

function formatCleanBatch(rawBatch) {
  if (!rawBatch) return "Live Batch";
  if (rawBatch instanceof Date) {
    return Utilities.formatDate(rawBatch, Session.getScriptTimeZone(), "dd MMM yyyy Batch");
  }
  const str = rawBatch.toString().trim();
  if (str.includes("T") && str.includes("Z")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd MMM yyyy Batch");
    }
  }
  return str;
}

function formatShortDate(dateStr) {
  if (!dateStr || dateStr === "N/A") return "N/A";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = parseInt(parts[2], 10);
  const month = months[parseInt(parts[1], 10) - 1] || parts[1];
  return `${day} ${month}`;
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
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}
