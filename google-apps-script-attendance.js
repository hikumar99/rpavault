/**
 * Google Apps Script for RPAVault Live Class Attendance & Dynamic Dashboard
 * 
 * Google Sheet Tabs:
 * 1. "Registered_Students": Name | Email | Mobile Number | Batch
 * 2. "Settings" (Optional): Meeting_URL | Admin_Email
 * 3. "Attendance_Logs" (22 Columns): Timestamp | Email | IP | City | Region | Country | OS | Browser | Device | Screen | Lang | Visitor Type | Visitor ID | Visit Count | First Visit | Path Trail | Referrer | Time Spent | Timezone | Source Path | Source Title | Local Time
 */

function doPost(e) {
  try {
    // Parse parameters
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

    // 1. Read Settings tab:
    // - Column G: Batches joining link
    // 1. Read Settings tab:
    // - Column G: Batches joining link
    // - Column C: Admin/Temp email meeting link
    const adminEmails = new Set();
    const adminMeetingMap = {}; // email -> specific meeting URL from column C
    const tempMeetingMap = {};  // temp email -> specific meeting URL from column C
    const batchMeetingMap = {}; // batch/course identifier -> joining link from column G
    let defaultBatchMeetingUrl = "";

    if (settingsSheet) {
      try {
        const sData = settingsSheet.getDataRange().getValues();
        for (let r = 0; r < sData.length; r++) {
          const row = sData[r];
          const colA = (row[0] || "").toString().trim();
          const colB = (row[1] || "").toString().trim();
          const colC = (row[2] || "").toString().trim(); // Column C: Admin / Temp meeting link
          const colD = (row[3] || "").toString().trim();
          const colE = (row[4] || "").toString().trim();
          const colF = (row[5] || "").toString().trim();
          const colG = (row[6] || "").toString().trim(); // Column G: Batches joining link

          const keyA = colA.toLowerCase();
          const keyB = colB.toLowerCase();

          // A) Process Column G (Batches joining link)
          if (colG && isLikelyUrl(colG)) {
            if (!defaultBatchMeetingUrl) defaultBatchMeetingUrl = colG;

            [colA, colB, colD, colE, colF].forEach(function(val) {
              const clean = (val || "").toString().trim();
              if (clean && !isLikelyUrl(clean)) {
                batchMeetingMap[clean.toLowerCase()] = colG;
                batchMeetingMap[slugify(clean)] = colG;
                const noBatch = clean.replace(/\bbatch\b/gi, '').trim();
                if (noBatch) {
                  batchMeetingMap[noBatch.toLowerCase()] = colG;
                  batchMeetingMap[slugify(noBatch)] = colG;
                }
              }
            });
          }

          // B) Process Column C (Admin / Temp meeting link) - strictly mapped to the email in that row
          if (colC && isLikelyUrl(colC)) {
            // 1. Temp_Email row:
            if (keyA.includes("temp") || keyB.includes("temp")) {
              for (let c = 0; c < row.length; c++) {
                const cell = (row[c] || "").toString().trim().toLowerCase();
                if (cell.includes("@") && cell.includes(".")) {
                  tempMeetingMap[cell] = colC;
                }
              }
            }

            // 2. Admin rows:
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

            // 3. Direct email rows with Column C link:
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
            // If colC is not a URL, still register admin emails if row designates admin
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

    // 2. Check Registered Students (reads columns A-E: Name, Email, Mobile, Batch, Course)
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

        // Auto find column positions from header row
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
            batchName = formatCleanBatch(row[batchCol]);
            courseName = (row[courseCol] || "").toString().trim();
            break;
          }
        }
      }
    }

    // 3. Evaluate verification and assign meeting URL based on user type & action
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
      // Action is "join" or default (Joining Live Class)
      // A) Temp User: Only access the link assigned in Column C
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
      }
      // B) Admin: Only access the link assigned to his email from Column C (no fallback!)
      else if (isAdmin) {
        const assignedUrl = adminMeetingMap[inputEmail];
        if (assignedUrl && isLikelyUrl(assignedUrl)) {
          meetingUrl = assignedUrl;
          isVerified = true;
          studentName = studentName || "Admin";
        } else {
          // Admin email has no meeting link mapped in Column C
          isVerified = false;
          failMessage = "Admin email not mapped to any meeting link in Settings sheet.";
        }
      }
      // C) Registered Student: Access the batch joining link from Column G
      else if (isStudent) {
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

    // 4. ALWAYS log to Attendance_Logs (Wrong/unregistered emails captured as leads!)
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

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const regSheet = getSheet(ss, "Registered_Students");
    const logSheet = getSheet(ss, "Attendance_Logs");

    const regData = regSheet ? regSheet.getDataRange().getValues() : [];
    const logData = logSheet ? logSheet.getDataRange().getValues() : [];

    // 1. Extract registered students
    const studentsMap = {};
    const registeredList = [];
    let detectedBatch = "Live RPA Batch";

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
        const cleanBatch = formatCleanBatch(row[batchCol]);
        const cleanCourse = (row[courseCol] || "").toString().trim();
        if (cleanBatch) detectedBatch = cleanBatch;

        if (email && email.includes("@")) {
          studentsMap[email] = {
            id: i,
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
      const presentCount = s.presentDates.size;
      const absentCount = totalClassesHeld > 0 ? Math.max(0, totalClassesHeld - presentCount) : 0;
      const rate = totalClassesHeld > 0 ? Math.round((presentCount / totalClassesHeld) * 100) : 0;

      if (absentCount === 0 && totalClassesHeld > 0) {
        perfectAttendanceCount++;
      }

      let maxStreak = 0;
      let curStreak = 0;
      let activeStreak = 0;

      sortedDates.forEach(function(d) {
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

      const calendarTiles = sortedDates.map(function(d) {
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
        .filter(function(d) { return !s.presentDates.has(d); })
        .map(formatShortDate);

      let firstAttended = null;
      for (let j = 0; j < sortedDates.length; j++) {
        if (s.presentDates.has(sortedDates[j])) {
          firstAttended = sortedDates[j];
          break;
        }
      }
      const joinedFormatted = firstAttended ? formatFullDate(firstAttended) : (sortedDates[0] ? formatFullDate(sortedDates[0]) : "N/A");

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

    const payload = {
      batchInfo: {
        batchName: detectedBatch,
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

    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Resilient sheet finder
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

function formatCleanBatch(rawBatch) {
  if (!rawBatch) return "";
  try {
    if (rawBatch instanceof Date) {
      return Utilities.formatDate(rawBatch, Session.getScriptTimeZone(), "dd MMM yyyy") + " Batch";
    }
    const str = rawBatch.toString().trim();
    if (!str) return "";
    if (str.indexOf("T") !== -1 && str.indexOf("Z") !== -1) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return Utilities.formatDate(d, Session.getScriptTimeZone(), "dd MMM yyyy") + " Batch";
      }
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
