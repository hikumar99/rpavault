const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>UiPath Test Automation Course Guide - RPA Vault</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&family=Sora:wght@600;700;800&display=swap');

  @page {
    size: 210mm 297mm;
    margin: 0;
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    background: #ffffff;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    width: 210mm;
    height: 297mm;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
    padding: 22mm 20mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
    overflow: hidden;
  }

  /* TOP HEADER & FOOTER */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #0284c7;
    text-transform: uppercase;
    margin-bottom: 6mm;
  }
  .doc-header .dh-left {
    color: #0f172a;
    letter-spacing: 0.1em;
  }

  .doc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 4mm;
    margin-top: auto;
  }
  .doc-footer a {
    color: #0284c7;
    text-decoration: none;
    font-weight: 600;
  }

  /* HEADINGS & TYPOGRAPHY */
  .section-tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #0284c7;
    margin-bottom: 2mm;
  }

  h1.page-title {
    font-family: 'Sora', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.22;
    margin: 0 0 3mm 0;
    letter-spacing: -0.02em;
  }

  p.page-desc {
    font-size: 11.5px;
    line-height: 1.55;
    color: #475569;
    margin: 0 0 6mm 0;
  }

  /* CARDS & GRIDS */
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4mm;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm;
  }

  .card-soft {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4mm;
    padding: 4mm 4.5mm;
  }

  .card-soft h4 {
    font-family: 'Sora', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 1.5mm 0;
  }

  .card-soft p, .card-soft li {
    font-size: 10px;
    line-height: 1.5;
    color: #475569;
  }

  .card-soft ul {
    margin: 0;
    padding-left: 3.5mm;
  }
  .card-soft li {
    margin-bottom: 1mm;
  }

  /* DARK NAVY CALLOUTS */
  .navy-callout {
    background: linear-gradient(135deg, #091e36, #003666);
    border-radius: 4mm;
    padding: 4.5mm 5.5mm;
    color: #ffffff;
    margin: 4mm 0;
  }
  .navy-callout h4 {
    font-family: 'Sora', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 1.5mm 0;
  }
  .navy-callout p {
    font-size: 10px;
    line-height: 1.55;
    color: #cbd5e1;
    margin: 0;
  }

  /* OUTCOME CALLOUT WITH BLUE ACCENT */
  .outcome-bar {
    border-left: 3px solid #0284c7;
    background: #f0f9ff;
    padding: 3mm 4mm;
    border-radius: 0 2.5mm 2.5mm 0;
    font-size: 10.5px;
    line-height: 1.5;
    color: #0f172a;
    margin-top: 4mm;
  }
  .outcome-bar strong {
    color: #0369a1;
  }

  /* TABLE STYLES (OVERVIEW) */
  .overview-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
    margin-top: 3mm;
    border: 1px solid #cbd5e1;
    border-radius: 2.5mm;
    overflow: hidden;
  }
  .overview-table th {
    background: #0058b0;
    color: #ffffff;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2.8mm 3.5mm;
    text-align: left;
  }
  .overview-table td {
    padding: 2.6mm 3.5mm;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
    line-height: 1.45;
  }
  .overview-table tr:nth-child(even) td {
    background: #f8fafc;
  }
  .overview-table .b-num {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    color: #0284c7;
  }
  .overview-table .b-focus {
    font-weight: 700;
    color: #0f172a;
  }

  /* METHOD PILLS */
  .pills-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5mm;
    margin-top: 1.5mm;
  }
  .pill {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 600;
    background: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
    padding: 1mm 2mm;
    border-radius: 1.5mm;
  }

  /* CODE BOX */
  .code-box {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 2mm;
    padding: 2mm 3mm;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    color: #0f172a;
    line-height: 1.4;
    margin-top: 2mm;
  }

  /* CHECKLIST */
  .check-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2mm;
    margin-top: 3mm;
  }
  .check-item {
    display: flex;
    align-items: center;
    gap: 2mm;
    font-size: 9.5px;
    color: #0f172a;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    padding: 2mm 3mm;
    border-radius: 2mm;
  }
  .check-item svg {
    width: 12px;
    height: 12px;
    color: #16a34a;
    flex: none;
  }

  /* COVER & CLOSING PAGES */
  .page-cover {
    background: linear-gradient(160deg, #091e36 0%, #031326 100%);
    color: #ffffff;
    padding: 28mm 24mm;
    justify-content: center;
  }
  .page-cover .brand-logo-txt {
    font-family: 'Sora', sans-serif;
    font-size: 34px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.03em;
    display: flex;
    align-items: center;
    gap: 3mm;
    margin-bottom: 24mm;
  }
  .page-cover .cover-badge {
    display: inline-block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #38bdf8;
    background: rgba(56, 189, 248, 0.12);
    border: 1px solid rgba(56, 189, 248, 0.3);
    padding: 2mm 4mm;
    border-radius: 99px;
    margin-bottom: 6mm;
  }
  .page-cover h1 {
    font-family: 'Sora', sans-serif;
    font-size: 42px;
    font-weight: 800;
    line-height: 1.15;
    margin: 0 0 6mm 0;
    letter-spacing: -0.03em;
    color: #ffffff;
  }
  .page-cover p.lead {
    font-size: 15px;
    line-height: 1.65;
    color: #94a3b8;
    max-width: 140mm;
    margin: 0 0 20mm 0;
  }
  .page-cover .series-txt {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: #64748b;
    margin-bottom: 8mm;
  }
  .page-cover .series-txt strong {
    color: #cbd5e1;
    display: block;
    margin-bottom: 1.5mm;
  }

  .cover-btn-row {
    display: flex;
    gap: 4mm;
  }
  .cover-btn {
    display: inline-block;
    padding: 3mm 6mm;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 700;
    text-decoration: none;
  }
  .cover-btn-primary {
    background: #0284c7;
    color: #ffffff;
  }
  .cover-btn-outline {
    border: 1px solid #475569;
    color: #cbd5e1;
  }

  /* PAGE CLOSING */
  .page-closing {
    background: linear-gradient(160deg, #091e36 0%, #031326 100%);
    color: #ffffff;
    padding: 28mm 24mm;
    justify-content: space-between;
  }
  .closing-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 4mm;
    padding: 8mm 10mm;
    margin: 10mm 0;
  }
  .closing-card h3 {
    font-family: 'Sora', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 3mm 0;
  }
  .closing-card p {
    font-size: 12.5px;
    color: #cbd5e1;
    line-height: 1.6;
    margin: 0 0 6mm 0;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1: COVER ==================== -->
  <div class="page page-cover">
    <div>
      <div class="brand-logo-txt">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        RPA Vault
      </div>
      <div class="cover-badge">PROFESSIONAL COURSE GUIDE</div>
      <h1>UiPath Test<br>Automation</h1>
      <p class="lead">Master test design, resilient UI automation, data handling, and enterprise-quality execution through an applied UiPath learning pathway.</p>
      
      <div class="series-txt">
        <strong>RPA Vault Learning Series</strong>
        Studio · Test Manager · Orchestrator · Data Fabric
      </div>

      <div class="cover-btn-row">
        <span class="cover-btn cover-btn-primary">View Course Details →</span>
        <span class="cover-btn cover-btn-outline">Talk to an Expert →</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 2: OVERVIEW (01) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT</span>
      <span>COURSE OVERVIEW</span>
    </div>

    <div>
      <div class="section-tag">THE LEARNING JOURNEY</div>
      <h1 class="page-title">A complete UiPath Test Automation program</h1>
      <p class="page-desc">This course is built for learners who want to move beyond simple workflow recording and develop the practical test-automation discipline used in real automation projects.</p>

      <div class="grid-3" style="margin-bottom: 5mm;">
        <div class="card-soft">
          <h4>Learn the language of quality</h4>
          <p>Understand how test cases, BDD scenarios, assertions, test data, defects, and evidence connect to a dependable release process.</p>
        </div>
        <div class="card-soft">
          <h4>Build workflows that resist change</h4>
          <p>Use selectors, anchors, browser activities, validation, loops, logging, and recovery paths to create robust automations.</p>
        </div>
        <div class="card-soft">
          <h4>Connect work to enterprise delivery</h4>
          <p>Use Test Manager, Orchestrator, Data Fabric, reporting, and execution governance to understand how automation scales.</p>
        </div>
      </div>

      <div style="margin-top: 3mm;">
        <h4 style="font-family:'Sora',sans-serif; font-size:13px; font-weight:700; color:#0f172a; margin:0 0 1.5mm 0;">Course structure</h4>
        <p style="font-size:10px; color:#64748b; margin:0 0 3mm 0;">The complete curriculum groups the original source material into eight teachable learning blocks. Each block combines explanation, demonstration, and guided practice.</p>

        <table class="overview-table">
          <thead>
            <tr>
              <th style="width:14%">Block</th>
              <th style="width:28%">Core focus</th>
              <th style="width:58%">Topics and practice</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="b-num">01</span></td>
              <td class="b-focus">Foundations &amp; Studio</td>
              <td>Process vs. test automation; Test Automation package; Community Edition; Studio workspace, activities, robot integration, variables, debugging, and Git.</td>
            </tr>
            <tr>
              <td><span class="b-num">02</span></td>
              <td class="b-focus">BDD &amp; test design</td>
              <td>Given–When–Then; preconditions, actions, assertions; UiDemo login and transaction scenario.</td>
            </tr>
            <tr>
              <td><span class="b-num">03</span></td>
              <td class="b-focus">UI automation</td>
              <td>Dynamic selectors, wildcards, Anchor Base, browser control, user interaction, element validation, and output capture.</td>
            </tr>
            <tr>
              <td><span class="b-num">04</span></td>
              <td class="b-focus">Data extraction</td>
              <td>Pattern-based data, web tables, screen scraping, DataTables, CSV output, and the Smart Search directory scraper bot.</td>
            </tr>
            <tr>
              <td><span class="b-num">05</span></td>
              <td class="b-focus">Workflow logic</td>
              <td>Variables, types, conditions, loops, collections, strings, DateTime, and Report Mover file routing.</td>
            </tr>
            <tr>
              <td><span class="b-num">06</span></td>
              <td class="b-focus">Reliable delivery</td>
              <td>Annotations, logging, debugging, Try/Catch/Finally, business vs. application exceptions, OS activities, Excel, and DataTables.</td>
            </tr>
            <tr>
              <td><span class="b-num">07–08</span></td>
              <td class="b-focus">Enterprise testing</td>
              <td>Test Manager, test cases, test sets, execution, defect tracking, reporting, Orchestrator, robots, jobs, assets, queues, Data Fabric, and monitoring.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/course/uipath-test-suite/">Explore the full curriculum at RPAVault.com →</a>
      <span>01</span>
    </div>
  </div>

  <!-- ==================== PAGE 3: MODULE 01 (02) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT</span>
      <span>MODULE 01</span>
    </div>

    <div>
      <div class="section-tag">FOUNDATIONS, STUDIO &amp; BDD</div>
      <h1 class="page-title">Start with test intent—not just clicks</h1>
      <p class="page-desc">Effective test automation begins with a clear distinction between executing business work and validating a system’s expected behavior.</p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <h4>Process automation</h4>
          <ul>
            <li>Automates repetitive, rule-based tasks and human application interactions.</li>
            <li>Uses UiPath workflows (.xaml) running on attended or unattended Robots.</li>
            <li>Commonly connects Studio, Robot, Orchestrator, files, spreadsheets, and applications.</li>
          </ul>
        </div>
        <div class="card-soft" style="border: 1.5px solid #0284c7;">
          <h4>Test automation</h4>
          <ul>
            <li>Automates quality-assurance and quality-engineering scenarios.</li>
            <li>Validates functionality and regression behavior using actual versus expected results.</li>
            <li>Supports BDD-style scenarios and can be integrated into CI/CD pipelines.</li>
          </ul>
        </div>
      </div>

      <div class="grid-3" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <h4>UiPath Studio</h4>
          <p>Design activity-based tests, use Selenium-like web automation patterns, support API and database validation, connect version control, and build reusable test libraries.</p>
        </div>
        <div class="card-soft">
          <h4>Test Manager</h4>
          <p>Manage test cases and test sets; run and review execution; link defects; connect Jenkins or Azure pipelines; and use dashboards and reports.</p>
        </div>
        <div class="card-soft">
          <h4>Studio workspace</h4>
          <p>Work with the Workflow Designer, Activity Library, Robot Integration, Variable Panel, Debug/Breakpoints, and Source Control.</p>
        </div>
      </div>

      <div class="navy-callout">
        <h4>BDD framework: turn business language into a testable contract</h4>
        <p><strong>Given</strong> the UiDemo application is open and valid credentials are available. <strong>When</strong> the user enters the username and password and selects Login. <strong>Then</strong> the dashboard appears; otherwise the expected error is shown and the app closes after three failed attempts.</p>
      </div>

      <div class="outcome-bar">
        <strong>Student outcome:</strong> Create a readable test case with explicit setup, action, validation, and cleanup—so the expected behavior is clear to both technical and business reviewers.
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/contact/">Want to discuss course fit? Contact RPA Vault →</a>
      <span>02</span>
    </div>
  </div>

  <!-- ==================== PAGE 4: MODULE 02 (03) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT</span>
      <span>MODULE 02</span>
    </div>

    <div>
      <div class="section-tag">UI AUTOMATION &amp; DATA EXTRACTION</div>
      <h1 class="page-title">Build UI workflows that remain stable and produce useful data</h1>
      <p class="page-desc">Students learn to handle changing interface elements, interact with browsers, validate what occurred, and transform screen content into structured records.</p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <h4>Dynamic selectors</h4>
          <ul>
            <li><strong>Selector with Variable:</strong> replace static attributes with runtime values such as a changing window title or identifier.</li>
            <li><strong>Wildcard Characters:</strong> use * for multiple characters and ? for a single character in partial matches.</li>
            <li><strong>Anchor Base:</strong> find changing elements relative to a stable control on the same screen.</li>
          </ul>
          <div class="code-box">
            <strong>Selector examples:</strong><br>
            <code>&lt;wnd title='&#123;&#123;windowTitle&#125;&#125;' .../&gt;</code><br>
            <code>title='Invoice *' matches invoice windows regardless of number.</code>
          </div>
        </div>

        <div class="card-soft">
          <h4>Web automation activities</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:2mm; margin-bottom:2mm;">
            <div>
              <strong style="font-size:9.5px; color:#0f172a; display:block; margin-bottom:1mm;">Browser control</strong>
              <ul>
                <li>Open Browser</li>
                <li>Navigate To</li>
                <li>Attach Browser</li>
                <li>Close Tab</li>
              </ul>
            </div>
            <div>
              <strong style="font-size:9.5px; color:#0f172a; display:block; margin-bottom:1mm;">Interaction &amp; validation</strong>
              <ul>
                <li>Click Text / Type Into</li>
                <li>Set Text / Send Hot Key</li>
                <li>Find Element / Exists</li>
                <li>Get Text / Attribute</li>
                <li>Check / Select Item</li>
              </ul>
            </div>
          </div>
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:2mm; padding:2mm 2.5mm; font-size:9px; color:#166534;">
            <strong>Test-design habit:</strong> Validate the target state after a key action. Do not infer success simply because a click completed.
          </div>
        </div>
      </div>

      <div class="grid-3" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <h4>Pattern-Based Data</h4>
          <p>Extract repeated text patterns from application screens. Useful for legacy or visually inconsistent interfaces.</p>
        </div>
        <div class="card-soft">
          <h4>Web Table Scraping</h4>
          <p>Extract HTML tables into DataTables and support multi-page navigation through a Next button.</p>
        </div>
        <div class="card-soft">
          <h4>Screen Scraping</h4>
          <p>Capture visible text with Full Text, Native, or OCR techniques from PDFs, images, or non-standard windows.</p>
        </div>
      </div>

      <div class="navy-callout">
        <h4>Applied case: Smart Search Directory Scraper Bot</h4>
        <p>Read search keywords from <code>Smart Search.xlsx</code> &rarr; loop through each item &rarr; open directory search portal &rarr; search &rarr; scrape results into a DataTable &rarr; write a keyword-named CSV &rarr; close the browser &rarr; continue. Students identify selector risk, data-quality checks, and recovery points.</p>
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/course/uipath-test-suite/">See the full UiPath Test Automation course →</a>
      <span>03</span>
    </div>
  </div>

  <!-- ==================== PAGE 5: MODULE 03 (04) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT</span>
      <span>MODULE 03</span>
    </div>

    <div>
      <div class="section-tag">WORKFLOW LOGIC, STRINGS &amp; DATES</div>
      <h1 class="page-title">Move from isolated activities to reusable workflow logic</h1>
      <p class="page-desc">Students gain the data and decision-making skills that let an automation adapt to input, apply business rules, and produce predictable outputs.</p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <h4>Variables &amp; data types</h4>
          <ul>
            <li>Use names with letters, numbers, and underscores; start with a letter or underscore.</li>
            <li>Avoid spaces, reserved words, and special characters other than underscore.</li>
            <li>Practice String, Int32, Double, Boolean, DateTime, and DataTable.</li>
          </ul>
        </div>
        <div class="card-soft">
          <h4>Conditions, loops &amp; collections</h4>
          <ul>
            <li>Use Single Line If, If/Else, Decision Flow, Switch, and Flow Switch for branching.</li>
            <li>Use For Each, While, Do While, and For Each Row for repeatable processing.</li>
            <li>Use List&lt;T&gt; and Dictionary&lt;K,V&gt; to manage collections; use CType() conversions when types must change safely.</li>
          </ul>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <h4>String methods</h4>
          <div class="pills-wrap">
            <span class="pill">Contains()</span>
            <span class="pill">EndsWith()</span>
            <span class="pill">Equals()</span>
            <span class="pill">IndexOf()</span>
            <span class="pill">ToLower()</span>
            <span class="pill">ToUpper()</span>
            <span class="pill">LastIndexOf()</span>
            <span class="pill">Length</span>
            <span class="pill">Remove()</span>
            <span class="pill">Replace()</span>
            <span class="pill">Split()</span>
            <span class="pill">StartsWith()</span>
            <span class="pill">Substring()</span>
            <span class="pill">ToCharArray()</span>
            <span class="pill">Trim()</span>
            <span class="pill">PadLeft()</span>
            <span class="pill">PadRight()</span>
          </div>
        </div>
        <div class="card-soft">
          <h4>DateTime methods</h4>
          <div class="pills-wrap">
            <span class="pill">AddDays(n)</span>
            <span class="pill">AddMonths(n)</span>
            <span class="pill">AddYears(n)</span>
            <span class="pill">Subtract(dt)</span>
            <span class="pill">DayOfWeek</span>
            <span class="pill">ToString(fmt)</span>
          </div>
          <p style="margin-top:2mm; font-size:9.5px;">Use them for date-sensitive rules, schedules, and report or filename formatting.</p>
        </div>
      </div>

      <div class="navy-callout">
        <h4>Applied case: Report Mover Bot</h4>
        <p>Select input and output folders &rarr; loop through files &rarr; detect Daily, Weekly, Monthly, or Yearly in the filename &rarr; check whether the matching subfolder exists &rarr; create it when necessary &rarr; move the file &rarr; record the outcome. This case connects strings, conditions, loops, folder logic, and auditable output.</p>
      </div>

      <div class="check-grid">
        <div class="check-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          <span>Inputs are validated before a loop begins.</span>
        </div>
        <div class="check-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          <span>Variable names make the workflow readable.</span>
        </div>
        <div class="check-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          <span>Date and string transformations are explicit.</span>
        </div>
        <div class="check-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          <span>Each file operation confirms its target path.</span>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/courses/">Get help selecting the right RPA learning path →</a>
      <span>04</span>
    </div>
  </div>

  <!-- ==================== PAGE 6: MODULE 04 (05) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT</span>
      <span>MODULE 04</span>
    </div>

    <div>
      <div class="section-tag">RELIABILITY, OS, DATATABLES &amp; EXCEL</div>
      <h1 class="page-title">Create automations that are easier to debug, recover, and support</h1>
      <p class="page-desc">A production-ready workflow does more than complete the happy path. It leaves evidence, handles known failure patterns, and manages its operating environment carefully.</p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <h4>Logging &amp; debugging</h4>
          <ul>
            <li><strong>Annotations:</strong> document canvas logic without changing execution.</li>
            <li><strong>Comments:</strong> clarify decisions and isolate sections during review.</li>
            <li><strong>Log Message:</strong> write Verbose, Info, Warn, Error, and Fatal evidence for monitoring.</li>
            <li><strong>Write Line:</strong> output focused values during development.</li>
            <li><strong>Breakpoints:</strong> pause a run and inspect properties and data.</li>
          </ul>
        </div>
        <div class="card-soft">
          <h4>Exception handling</h4>
          <ul>
            <li><strong>Try:</strong> hold activities that may fail.</li>
            <li><strong>Catch:</strong> respond to a specific failure type.</li>
            <li><strong>Finally:</strong> close browsers or clear temporary resources.</li>
            <li><strong>Throw / ReThrow:</strong> raise or preserve an error for an upstream handler.</li>
            <li><strong>Business Exception:</strong> invalid data or rule issue; <strong>Application Exception:</strong> timeout, crash, or unavailable element.</li>
          </ul>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <h4>Operating-system activities</h4>
          <ul>
            <li><strong>Files &amp; CSV:</strong> Read/Write Text File, Move/Copy/Delete File, Read/Write/Append CSV.</li>
            <li><strong>Folders:</strong> Create, Delete, Move, Get Files in Folder.</li>
            <li><strong>Clipboard &amp; processes:</strong> Get/Set Clipboard, Start Process, Kill Process, Get Process Info, Open/Close Application.</li>
          </ul>
        </div>
        <div class="card-soft">
          <h4>DataTables &amp; Excel Automation</h4>
          <ul>
            <li><strong>DataTables:</strong> Build Data Table, Add/Remove Data Row, Filter, Sort, For Each Row, Get Row Item, and Write Range.</li>
            <li><strong>Excel:</strong> Application Scope, Read/Write Range, Read/Write Cell, Append Range, Get Last Row, Delete Row/Column, Save/Save As.</li>
          </ul>
        </div>
      </div>

      <div class="outcome-bar">
        <strong>Reliability standard:</strong> Log the input and key branch, capture the failure context, clean up safely, preserve useful output, and return a result that a reviewer can understand immediately.
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/course/uipath-test-suite/">Explore course outcomes and project pathways →</a>
      <span>05</span>
    </div>
  </div>

  <!-- ==================== PAGE 7: MODULE 05 (06) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT</span>
      <span>MODULE 05</span>
    </div>

    <div>
      <div class="section-tag">TEST MANAGER, ORCHESTRATOR &amp; DATA FABRIC</div>
      <h1 class="page-title">Turn a workflow into a managed enterprise test practice</h1>
      <p class="page-desc">The final course block connects individual automation work to governance, traceability, scheduled execution, secure runtime assets, and operational visibility.</p>

      <div class="grid-3" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <h4>UiPath Test Manager</h4>
          <ul>
            <li>Create, edit, and organize manual and automated test cases.</li>
            <li>Link cases directly to Studio automation projects and business requirements.</li>
            <li>Manage test sets, runs, results, defects, dashboards, and reports.</li>
          </ul>
        </div>
        <div class="card-soft">
          <h4>Test cases &amp; test sets</h4>
          <ul>
            <li>A test case is an individual manual or automated scenario, often created in Studio as .xaml.</li>
            <li>Use Given–When–Then, tagging, filtering, requirements links, and data-driven parameters.</li>
            <li>Group cases into test sets; control execution order, environment, reuse, pass/fail tracking, and exports.</li>
          </ul>
        </div>
        <div class="card-soft">
          <h4>Orchestrator &amp; Data Fabric</h4>
          <ul>
            <li>Provision, monitor, and control attended and unattended robots.</li>
            <li>Schedule jobs; manage assets, credentials, configuration, queues, and work items.</li>
            <li>Connect governed application, database, and API data; monitor logs, alerts, and audit trails.</li>
          </ul>
        </div>
      </div>

      <div class="navy-callout">
        <h4>End-to-end execution model</h4>
        <p>Define a requirement &rarr; create a linked test case &rarr; group it into a test set &rarr; trigger a run through Test Manager or CI/CD &rarr; execute on robots through Orchestrator &rarr; review outcomes, logs, defects, and evidence &rarr; report coverage and quality status.</p>
      </div>

      <div class="card-soft" style="margin-bottom: 3mm;">
        <h4 style="color:#0369a1;">Next-level topics</h4>
        <p style="font-size:10px; line-height:1.5;">Students can extend this foundation into Studio Web, self-healing automation, performance testing, AI-assisted test design, live execution review, API/database validation, Document Understanding, REFramework, queues, and broader agentic automation practices.</p>
      </div>

      <div class="outcome-bar">
        <strong>Capstone direction:</strong> Combine a UiDemo or Smart Search directory scraper workflow with BDD test design, resilient selectors, structured data, logging, exception handling, test-case evidence, and an enterprise execution plan.
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/contact/">Talk to RPA Vault about enrolment or course guidance →</a>
      <span>06</span>
    </div>
  </div>

  <!-- ==================== PAGE 8: CLOSING ==================== -->
  <div class="page page-closing">
    <div>
      <div class="brand-logo-txt">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        RPA Vault
      </div>

      <div class="section-tag" style="color:#38bdf8;">START YOUR AUTOMATION LEARNING JOURNEY</div>
      <h1 style="font-family:'Sora',sans-serif; font-size:36px; font-weight:800; color:#ffffff; line-height:1.2; margin:0 0 4mm 0;">Build practical UiPath Test Automation skills with RPA Vault.</h1>
      <p style="font-size:14px; color:#cbd5e1; line-height:1.6; max-width:140mm; margin:0 0 10mm 0;">Review the complete course details, discuss your learning goals, and take the next step toward a structured automation career path.</p>

      <div class="closing-card">
        <h3>Ready to learn with a clearer plan?</h3>
        <p>Explore the complete course syllabus or contact RPA Vault to discuss the right learning path for you.</p>
        <div class="cover-btn-row">
          <span class="cover-btn cover-btn-primary">View Course Details →</span>
          <span class="cover-btn cover-btn-outline">Contact RPA Vault →</span>
        </div>
      </div>
    </div>

    <div class="doc-footer" style="border-top-color:rgba(255,255,255,0.15); color:#94a3b8;">
      <span>rpavault.com/course/uipath-test-suite</span>
      <span>rpavault.com/contact</span>
    </div>
  </div>

</body>
</html>`;

async function generatePdf() {
  const tempHtmlPath = path.join(__dirname, 'temp_syllabus.html');
  const outputPdfPath = path.join(__dirname, '..', 'assets', 'docs', 'uipath-test-suite-syllabus.pdf');
  const sitePdfPath = path.join(__dirname, '..', '_site', 'assets', 'docs', 'uipath-test-suite-syllabus.pdf');

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  console.log('[PDF Generator] Launching browser...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto('file://' + tempHtmlPath, { waitUntil: 'networkidle0' });

  console.log('[PDF Generator] Printing to PDF...');
  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  // Also copy to _site if it exists
  if (fs.existsSync(path.dirname(sitePdfPath))) {
    fs.copyFileSync(outputPdfPath, sitePdfPath);
  }

  await browser.close();
  fs.unlinkSync(tempHtmlPath);

  const stats = fs.statSync(outputPdfPath);
  console.log(`[PDF Generator] Success! Generated ${outputPdfPath} (${stats.size} bytes).`);
}

generatePdf().catch(err => {
  console.error('[PDF Generator] Error generating PDF:', err);
  process.exit(1);
});
