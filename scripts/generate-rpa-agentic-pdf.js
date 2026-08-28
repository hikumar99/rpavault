const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RPA & Agentic Automation Career Pathway - RPA Vault</title>
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
    padding: 20mm 18mm;
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
    letter-spacing: 0.12em;
    color: #0058b0;
    text-transform: uppercase;
    margin-bottom: 4mm;
  }
  .doc-header .dh-left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #0f172a;
    font-weight: 700;
  }
  .doc-header .dh-right {
    color: #0058b0;
  }

  .doc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 3mm;
    margin-top: 4mm;
  }
  .doc-footer a {
    color: #0058b0;
    text-decoration: none;
    font-weight: 600;
  }

  /* TYPOGRAPHY */
  .eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #0058b0;
    margin-bottom: 3mm;
    display: block;
  }
  .page-title {
    font-family: 'Sora', sans-serif;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.22;
    color: #091e36;
    margin: 0 0 3mm;
    letter-spacing: -0.02em;
  }
  .page-title em {
    font-style: italic;
    color: #0058b0;
    font-weight: 700;
  }
  .page-subtitle {
    font-size: 12.5px;
    line-height: 1.5;
    color: #475569;
    margin: 0 0 5mm;
  }

  /* COVER PAGE */
  .cover-page {
    background: #091e36;
    color: #ffffff;
    padding: 24mm 22mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cover-brand {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .cover-logo-text {
    font-family: 'Sora', sans-serif;
    font-size: 34px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  .cover-logo-sub {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    color: #38bdf8;
    text-transform: uppercase;
    margin-top: 4px;
  }
  .cover-badge {
    background: rgba(56, 189, 248, 0.15);
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 8px;
    padding: 6px 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .cover-main {
    margin: 10mm 0;
  }
  .cover-audience {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin-bottom: 5mm;
  }
  .cover-title {
    font-family: 'Sora', sans-serif;
    font-size: 40px;
    font-weight: 800;
    line-height: 1.14;
    letter-spacing: -0.03em;
    color: #ffffff;
    margin-bottom: 5mm;
  }
  .cover-desc {
    font-size: 15px;
    line-height: 1.6;
    color: #cbd5e1;
    max-width: 160mm;
    margin-bottom: 6mm;
  }
  .cover-box {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 14px 18px;
    margin-bottom: 8mm;
  }
  .cover-box strong {
    color: #38bdf8;
    font-size: 13px;
    display: block;
    margin-bottom: 4px;
  }
  .cover-box p {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.45;
    color: #e2e8f0;
  }
  .cover-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 6mm;
  }
  .cover-stat-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .cover-stat-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 4px;
  }
  .cover-stat-val {
    font-family: 'Sora', sans-serif;
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.1;
  }
  .cover-stat-sub {
    font-size: 10.5px;
    color: #cbd5e1;
    margin-top: 4px;
    line-height: 1.3;
  }
  .cover-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 4mm;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #94a3b8;
  }

  /* 2-COLUMN & 3-COLUMN GRIDS */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  .grid-6 {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  /* CARDS */
  .card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
    position: relative;
  }
  .card.blue-top { border-top: 3px solid #0058b0; }
  .card.teal-top { border-top: 3px solid #0d9488; }
  .card.green-top { border-top: 3px solid #16a34a; }
  .card.amber-top { border-top: 3px solid #d97706; }
  .card.navy-top { border-top: 3px solid #091e36; }

  .card-num-box {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
  }
  .class-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #0058b0;
    color: #ffffff;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
  }
  .class-circle.green { background: #16a34a; }
  .class-circle.teal { background: #0d9488; }
  .class-circle.amber { background: #d97706; }

  .card-num-content h4 {
    font-family: 'Sora', sans-serif;
    font-size: 12.5px;
    font-weight: 700;
    color: #091e36;
    margin: 0 0 3px;
  }
  .card-num-content p {
    font-size: 11px;
    line-height: 1.4;
    color: #475569;
    margin: 0;
  }

  /* CALLOUT BOXES */
  .navy-callout {
    background: #091e36;
    color: #ffffff;
    border-radius: 10px;
    padding: 12px 16px;
    margin: 3mm 0;
  }
  .navy-callout .nc-tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: block;
    margin-bottom: 2px;
  }
  .navy-callout h4 {
    font-family: 'Sora', sans-serif;
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 4px;
    color: #ffffff;
  }
  .navy-callout p {
    font-size: 11.5px;
    line-height: 1.45;
    color: #cbd5e1;
    margin: 0;
  }

  .highlight-strip {
    background: #f0f7ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 11px;
    line-height: 1.4;
    color: #0369a1;
    margin: 2mm 0;
  }
  .highlight-strip strong {
    color: #0284c7;
  }

  .lab-box {
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 11px;
    line-height: 1.4;
    color: #334155;
    margin-top: 2mm;
  }
  .lab-box strong {
    color: #0058b0;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
  }

  /* TIMELINE SUMMARY FOOTER */
  .timeline-footer {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 3mm;
  }
  .tf-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 10px;
  }
  .tf-card strong {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    color: #0058b0;
    display: block;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .tf-card p {
    font-size: 10.5px;
    line-height: 1.35;
    color: #475569;
    margin: 0;
  }

  /* LISTS & CHIPS */
  ul.clean-list {
    margin: 0;
    padding-left: 14px;
    font-size: 11px;
    line-height: 1.45;
    color: #475569;
  }
  ul.clean-list li {
    margin-bottom: 3px;
  }
</style>
</head>
<body>

  <!-- PAGE 1: COVER -->
  <div class="page cover-page">
    <div class="cover-brand">
      <div>
        <div class="cover-logo-text">RPA Vault</div>
        <div class="cover-logo-sub">Professional Career Training</div>
      </div>
      <div class="cover-badge">Live Online Course</div>
    </div>

    <div class="cover-main">
      <div class="cover-audience">For Fresh Graduates &amp; Career Starters</div>
      <div class="cover-title">Build useful automations<br>from day one.</div>
      <div class="cover-desc">
        Learn how everyday business work becomes repeatable workflows—and build evidence you can explain in a portfolio, interview, or career conversation.
      </div>

      <div class="cover-box">
        <strong>New to IT or automation?</strong>
        <p>Start with the building blocks. Progress through guided projects. You do not need to arrive as a programmer or an expert.</p>
      </div>

      <div class="cover-stats-grid">
        <div class="cover-stat-card">
          <div class="cover-stat-label">You Will Build</div>
          <div class="cover-stat-val">15–25</div>
          <div class="cover-stat-sub">Mini projects for your portfolio</div>
        </div>
        <div class="cover-stat-card">
          <div class="cover-stat-label">Structure</div>
          <div class="cover-stat-val">33</div>
          <div class="cover-stat-sub">Named practical classes</div>
        </div>
        <div class="cover-stat-card">
          <div class="cover-stat-label">Pace</div>
          <div class="cover-stat-val">45</div>
          <div class="cover-stat-sub">Days of guided learning</div>
        </div>
        <div class="cover-stat-card">
          <div class="cover-stat-label">Programme Fee</div>
          <div class="cover-stat-val">₹16,999</div>
          <div class="cover-stat-sub">Complete job-ready curriculum</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>Advanced RPA Career Pathway · UiPath · Power Automate · Agentic AI</div>
      <div>rpavault.com</div>
    </div>
  </div>

  <!-- PAGE 2: PROGRAMME SNAPSHOT -->
  <div class="page">
    <div>
      <div class="doc-header">
        <span class="dh-left">RPA VAULT · PROGRAMME SNAPSHOT</span>
        <span class="dh-right">PAGE 01</span>
      </div>

      <span class="eyebrow">WHAT STUDENTS NEED TO SEE FIRST</span>
      <h2 class="page-title">A clear route from <em>first workflow</em> to professional evidence.</h2>
      <p class="page-subtitle">The programme combines foundations, business automation, advanced frameworks, agentic concepts, and project delivery into one structured learning journey.</p>

      <div class="grid-2" style="margin-bottom:3mm;">
        <div class="card blue-top">
          <h4 style="font-family:'Sora',sans-serif; font-size:13px; margin:0 0 4px; color:#091e36;">Who this is for</h4>
          <p style="font-size:11.5px; line-height:1.45; color:#475569; margin:0;">Fresh graduates, career starters, and learners moving toward automation roles who want a guided path from first workflow to portfolio evidence.</p>
        </div>

        <div class="card teal-top">
          <h4 style="font-family:'Sora',sans-serif; font-size:13px; margin:0 0 4px; color:#091e36;">Practise by doing</h4>
          <p style="font-size:11.5px; line-height:1.45; color:#475569; margin:0;">Follow guided class tasks, build workflows, work through RPA Challenge-style practice, and turn each topic into a demonstrable automation example.</p>
        </div>

        <div class="card green-top">
          <h4 style="font-family:'Sora',sans-serif; font-size:13px; margin:0 0 4px; color:#091e36;">Build a portfolio</h4>
          <p style="font-size:11.5px; line-height:1.45; color:#475569; margin:0;">Document the business problem, workflow logic, inputs, outputs, exception strategy, and result so your work can be explained in a portfolio or interview.</p>
        </div>

        <div class="card amber-top">
          <h4 style="font-family:'Sora',sans-serif; font-size:13px; margin:0 0 4px; color:#091e36;">Prepare for the next role</h4>
          <p style="font-size:11.5px; line-height:1.45; color:#475569; margin:0;">Use project explanations, interview preparation, profile support, and structured learning progress to present a stronger automation-career story.</p>
        </div>
      </div>

      <div class="navy-callout">
        <span class="nc-tag">STUDENT PROMISE</span>
        <h4>Students do not only finish lessons. They leave with workflows they can explain.</h4>
        <p>Learn the concept · practise the tool · build the project · show the evidence.</p>
      </div>

      <div class="highlight-strip">
        <strong>How the learning experience works:</strong> Live, interactive delivery is supported by recordings, daily tasks, guided practice, project discussions, and a step-by-step progression from beginner concepts to advanced automation.
      </div>
    </div>

    <div class="doc-footer">
      <div>Explore the complete curriculum</div>
      <div>rpavault.com · 02</div>
    </div>
  </div>

  <!-- PAGE 3: CLASSES 01-06 (FOUNDATION) -->
  <div class="page">
    <div>
      <div class="doc-header">
        <span class="dh-left">CLASSES 01–06 · FOUNDATION</span>
        <span class="dh-right">PAGE 02</span>
      </div>

      <span class="eyebrow">PHASE 01 · START WITH THE BUILDING BLOCKS</span>
      <h2 class="page-title">Foundation skills that make the <em>first automation</em> possible.</h2>
      <p class="page-subtitle">Begin with the Studio environment, workflow thinking, variables, selectors, and the first reusable automation patterns.</p>

      <div class="grid-6">
        <div class="card-num-box">
          <span class="class-circle">01</span>
          <div class="card-num-content">
            <h4>UiPath Studio Explanation</h4>
            <p>Understand the Studio interface, projects, panels, activities, and the working environment used to create automations.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">02</span>
          <div class="card-num-content">
            <h4>Introduction to Variables</h4>
            <p>Learn how variables hold values, support workflow logic, and help move information between activities.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle green">03</span>
          <div class="card-num-content">
            <h4>Introduction to Arguments</h4>
            <p>Use arguments to pass information between workflows and create more reusable automation components.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">04</span>
          <div class="card-num-content">
            <h4>Selectors</h4>
            <p>Recognise how UiPath identifies interface elements and how reliable selectors support stable automation.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">05</span>
          <div class="card-num-content">
            <h4>Selectors &amp; Excel Automation</h4>
            <p>Connect interface targeting with structured spreadsheet work and practise a repeatable business workflow.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle green">06</span>
          <div class="card-num-content">
            <h4>Excel &amp; Workbook Automation</h4>
            <p>Read, write, update, and organise Excel data using workbook and application-based automation patterns.</p>
          </div>
        </div>
      </div>

      <div class="timeline-footer">
        <div class="tf-card">
          <strong>Student Result</strong>
          <p>Explain Studio, variables, arguments, and selectors without relying on memorised steps.</p>
        </div>
        <div class="tf-card">
          <strong>Practice Evidence</strong>
          <p>A first workflow that reads structured input and produces a visible output.</p>
        </div>
        <div class="tf-card">
          <strong>Key Language</strong>
          <p>Projects · activities · variables · arguments · selectors · workbook.</p>
        </div>
      </div>

      <div class="lab-box">
        <strong>PRACTICE LAB &amp; EXIT CHECK:</strong> Build a first workflow that reads structured input, uses variables and selectors, and returns a visible output. Explain where each value is stored and how the target is identified before extending the workflow.
      </div>
    </div>

    <div class="doc-footer">
      <div>Foundation Phase · Classes 01–06</div>
      <div>rpavault.com · 03</div>
    </div>
  </div>

  <!-- PAGE 4: CLASSES 07-12 (CORE AUTOMATION) -->
  <div class="page">
    <div>
      <div class="doc-header">
        <span class="dh-left">CLASSES 07–12 · CORE AUTOMATION</span>
        <span class="dh-right">PAGE 03</span>
      </div>

      <span class="eyebrow">PHASE 01 · TURN FOUNDATIONS INTO WORKFLOWS</span>
      <h2 class="page-title">Build useful automations across <em>business applications</em>.</h2>
      <p class="page-subtitle">Move from basic building blocks into web interaction, data capture, workflow logic, and practical business scenarios.</p>

      <div class="grid-6">
        <div class="card-num-box">
          <span class="class-circle">07</span>
          <div class="card-num-content">
            <h4>Word Automation</h4>
            <p>Generate, update, and organise business documents through structured automation steps.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">08</span>
          <div class="card-num-content">
            <h4>Web Automation</h4>
            <p>Work with browser-based applications using reliable interaction patterns and visible workflow logic.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle green">09</span>
          <div class="card-num-content">
            <h4>Web Data Extraction</h4>
            <p>Capture information from web pages and turn it into structured, reusable business data.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">10</span>
          <div class="card-num-content">
            <h4>Web Recording &amp; Scraping</h4>
            <p>Use recording and scraping approaches to accelerate repeatable browser-based data workflows.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">11</span>
          <div class="card-num-content">
            <h4>UiDemo Application Project</h4>
            <p>Apply the early topics in a guided UiDemo application project that connects interaction, data, and process steps.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle green">12</span>
          <div class="card-num-content">
            <h4>Directory Search Application Project</h4>
            <p>Practise a realistic application scenario and explain the workflow from input through output.</p>
          </div>
        </div>
      </div>

      <div class="timeline-footer">
        <div class="tf-card">
          <strong>Student Result</strong>
          <p>Build workflows that interact with documents, browsers, and structured business data.</p>
        </div>
        <div class="tf-card">
          <strong>Project Evidence</strong>
          <p>UiDemo and Directory Search scraper examples that can be discussed in a portfolio.</p>
        </div>
        <div class="tf-card">
          <strong>Core Promise</strong>
          <p>Learn how a business process becomes a repeatable, resilient automation.</p>
        </div>
      </div>

      <div class="lab-box">
        <strong>PRACTICE LAB &amp; EXIT CHECK:</strong> Automate a small browser-to-document flow using web interaction, extraction, and a clear output step. Identify the input, interaction, data captured, and business result produced.
      </div>
    </div>

    <div class="doc-footer">
      <div>Core Automation Phase · Classes 07–12</div>
      <div>rpavault.com · 04</div>
    </div>
  </div>

  <!-- PAGE 5: CLASSES 13-18 (DATA & WORKFLOW CONTROL) -->
  <div class="page">
    <div>
      <div class="doc-header">
        <span class="dh-left">CLASSES 13–18 · DATA &amp; WORKFLOW CONTROL</span>
        <span class="dh-right">PAGE 04</span>
      </div>

      <span class="eyebrow">PHASE 02 · WORK WITH BUSINESS INFORMATION</span>
      <h2 class="page-title">Data, documents, and <em>workflow logic</em> that stand up to real work.</h2>
      <p class="page-subtitle">Develop data-handling habits: clean inputs, controlled flow, readable strings, date operations, and practical file movement.</p>

      <div class="grid-6">
        <div class="card-num-box">
          <span class="class-circle">13</span>
          <div class="card-num-content">
            <h4>Variables Continued</h4>
            <p>Deepen variable usage across workflows and choose suitable data structures for business scenarios.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">14</span>
          <div class="card-num-content">
            <h4>Programming &amp; Control Flow</h4>
            <p>Use conditions, loops, switches, and workflow decisions to create predictable automation behaviour.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle green">15</span>
          <div class="card-num-content">
            <h4>String Manipulation</h4>
            <p>Clean, split, join, compare, and transform text so automations can handle everyday business inputs.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">16</span>
          <div class="card-num-content">
            <h4>Report Mover Bot</h4>
            <p>Build a practical file-processing pattern for moving, organising, and routing reports dynamically.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">17</span>
          <div class="card-num-content">
            <h4>DateTime Operations</h4>
            <p>Work with dates, times, formats, and calculations that support operational automation.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle green">18</span>
          <div class="card-num-content">
            <h4>Debugging &amp; Logging</h4>
            <p>Use breakpoints, output, and logs to understand workflow behaviour and troubleshoot efficiently.</p>
          </div>
        </div>
      </div>

      <div class="navy-callout" style="margin:2.5mm 0;">
        <span class="nc-tag">DOCUMENT UNDERSTANDING &amp; AUTOMATION HUB</span>
        <h4>Extend document-focused workflows with structured extraction.</h4>
        <p>Build a clearer path from captured information to downstream business automation and enterprise workflows.</p>
      </div>

      <div class="timeline-footer">
        <div class="tf-card">
          <strong>Think Like an Automator</strong>
          <p>Ask what data enters, what changes, what must be checked, and what output proves success.</p>
        </div>
        <div class="tf-card">
          <strong>Useful Practice</strong>
          <p>Transform messy text, move reports, calculate dates, and make decisions in a controlled flow.</p>
        </div>
        <div class="tf-card">
          <strong>Student Result</strong>
          <p>Workflows that are easier to read, test, debug, and explain to technical leads.</p>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>Data &amp; Workflow Control · Classes 13–18</div>
      <div>rpavault.com · 05</div>
    </div>
  </div>

  <!-- PAGE 6: CLASSES 19-24 (RELIABILITY & FRAMEWORKS) -->
  <div class="page">
    <div>
      <div class="doc-header">
        <span class="dh-left">CLASSES 19–24 · RELIABILITY &amp; FRAMEWORKS</span>
        <span class="dh-right">PAGE 05</span>
      </div>

      <span class="eyebrow">PHASE 02 · BUILD FOR REPEATABILITY</span>
      <h2 class="page-title">Make automation <em>robust</em>, connected, and maintainable.</h2>
      <p class="page-subtitle">Move from one-off workflows toward data structures, exception strategy, enterprise patterns, and controlled automation delivery.</p>

      <div class="grid-6">
        <div class="card-num-box">
          <span class="class-circle">19</span>
          <div class="card-num-content">
            <h4>Exception Handling</h4>
            <p>Anticipate failure, handle exceptions deliberately (Try/Catch/Finally), and keep the workflow understandable.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">20</span>
          <div class="card-num-content">
            <h4>OS Automation</h4>
            <p>Use operating-system interactions to support file, folder, application, and desktop process automation.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle green">21</span>
          <div class="card-num-content">
            <h4>DataTables</h4>
            <p>Store and work with tabular information inside workflows for filtering, looping, and business processing.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">22</span>
          <div class="card-num-content">
            <h4>Excel Automation</h4>
            <p>Extend spreadsheet automation with structured workbook actions and repeatable data-processing patterns.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">23</span>
          <div class="card-num-content">
            <h4>REFramework</h4>
            <p>Understand the reusable enterprise framework approach for transaction-based, resilient automations.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle green">24</span>
          <div class="card-num-content">
            <h4>Assets &amp; BOT Deployments</h4>
            <p>Connect automation design with deployment thinking, reusable configuration, and operational readiness.</p>
          </div>
        </div>
      </div>

      <div class="timeline-footer">
        <div class="tf-card">
          <strong>Why It Matters</strong>
          <p>Reliability is what separates a demo workflow from an automation people can trust.</p>
        </div>
        <div class="tf-card">
          <strong>Framework Lens</strong>
          <p>Input · transaction · exception · retry · output · deployment.</p>
        </div>
        <div class="tf-card">
          <strong>Student Result</strong>
          <p>Explain how an automation should behave beyond the happy path.</p>
        </div>
      </div>

      <div class="lab-box">
        <strong>PRACTICE LAB &amp; EXIT CHECK:</strong> Design a transaction flow with tabular input, exception handling, and a reusable framework view. Explain the difference between a happy-path demo and an automation designed for repeatable operation.
      </div>
    </div>

    <div class="doc-footer">
      <div>Reliability &amp; Frameworks · Classes 19–24</div>
      <div>rpavault.com · 06</div>
    </div>
  </div>

  <!-- PAGE 7: CLASSES 25-29 (INTEGRATIONS & DELIVERY) -->
  <div class="page">
    <div>
      <div class="doc-header">
        <span class="dh-left">CLASSES 25–29 · INTEGRATIONS &amp; DELIVERY</span>
        <span class="dh-right">PAGE 06</span>
      </div>

      <span class="eyebrow">PHASE 03 · CONNECT THE AUTOMATION ECOSYSTEM</span>
      <h2 class="page-title">From framework thinking to <em>connected delivery</em>.</h2>
      <p class="page-subtitle">Learn the integration and delivery topics that help students understand how automations connect to business systems and cloud platforms.</p>

      <div class="grid-6">
        <div class="card-num-box">
          <span class="class-circle">25</span>
          <div class="card-num-content">
            <h4>Power Automate Cloud</h4>
            <p>Explore cloud-based workflow automation and how it supports broader business process connections.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">26</span>
          <div class="card-num-content">
            <h4>Power Automate Desktop</h4>
            <p>Understand desktop automation patterns and how they complement UiPath-oriented workflow thinking.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle green">27</span>
          <div class="card-num-content">
            <h4>API Automation</h4>
            <p>Work with service connections and API-based thinking to move beyond screen-only automation.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">28</span>
          <div class="card-num-content">
            <h4>Regex &amp; Integrations</h4>
            <p>Use pattern matching and integration concepts to handle structured text and connected business scenarios.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">29</span>
          <div class="card-num-content">
            <h4>Debugging &amp; Control Flows</h4>
            <p>Bring troubleshooting, flow design, and system thinking together in more complex automations.</p>
          </div>
        </div>

        <div class="card-num-box" style="background:#f0fdf4; border-color:#86efac;">
          <span class="class-circle green">+</span>
          <div class="card-num-content">
            <h4 style="color:#166534;">Delivery Mindset</h4>
            <p style="color:#14532d;">Learn to describe not only what the bot does, but how it connects, fails, recovers, and is maintained.</p>
          </div>
        </div>
      </div>

      <div class="timeline-footer">
        <div class="tf-card">
          <strong>Tools In View</strong>
          <p>UiPath · Power Automate Cloud · Power Automate Desktop · APIs · Regex.</p>
        </div>
        <div class="tf-card">
          <strong>Student Result</strong>
          <p>Understand multiple automation surfaces and when each is most useful.</p>
        </div>
        <div class="tf-card">
          <strong>Portfolio Angle</strong>
          <p>Explain the integration choice behind a project, not only the final screen.</p>
        </div>
      </div>

      <div class="lab-box">
        <strong>PRACTICE LAB &amp; EXIT CHECK:</strong> Choose the right automation surface—desktop, cloud, API, or Regex—for a connected business workflow. Explain why the selected tool or integration is appropriate and how it will be maintained.
      </div>
    </div>

    <div class="doc-footer">
      <div>Integrations &amp; Delivery · Classes 25–29</div>
      <div>rpavault.com · 07</div>
    </div>
  </div>

  <!-- PAGE 8: CLASSES 30-33 (AGENTIC & PROJECT DELIVERY) -->
  <div class="page">
    <div>
      <div class="doc-header">
        <span class="dh-left">CLASSES 30–33 · AGENTIC &amp; PROJECT DELIVERY</span>
        <span class="dh-right">PAGE 07</span>
      </div>

      <span class="eyebrow">PHASE 03 · SHOW WHAT YOU CAN BUILD</span>
      <h2 class="page-title">Finish with <em>agentic concepts</em>, real projects &amp; a professional story.</h2>
      <p class="page-subtitle">The final classes connect platform knowledge, project thinking, and future-facing automation concepts into a clear next step.</p>

      <div class="grid-2" style="margin-bottom:3mm;">
        <div class="card-num-box">
          <span class="class-circle teal">30</span>
          <div class="card-num-content">
            <h4>Agentic Automation &amp; Real-Time Projects</h4>
            <p>Explore agentic automation concepts and connect learning to real-time, project-oriented practice.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle">31</span>
          <div class="card-num-content">
            <h4>Microsoft PAD &amp; Automation Anywhere</h4>
            <p>Gain interface-level exposure to adjacent automation tools and broaden your multi-platform awareness.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle green">32</span>
          <div class="card-num-content">
            <h4>Portfolio Track</h4>
            <p>Organise project examples around problem, process, tools, logic, testing, exceptions, and outcome.</p>
          </div>
        </div>

        <div class="card-num-box">
          <span class="class-circle amber">33</span>
          <div class="card-num-content">
            <h4>Advanced Automation Readiness</h4>
            <p>Bring together frameworks, cloud, integrations, projects, and communication for the next interview.</p>
          </div>
        </div>
      </div>

      <div class="navy-callout">
        <span class="nc-tag">CAPSTONE EVIDENCE</span>
        <h4>What students should be able to show:</h4>
        <p>A working automation, a clear project explanation, a reasoned tool choice, an approach to testing and exceptions, and the confidence to discuss what they built.</p>
      </div>

      <div class="timeline-footer">
        <div class="tf-card">
          <strong>Build</strong>
          <p>Turn classes into working project evidence.</p>
        </div>
        <div class="tf-card">
          <strong>Explain</strong>
          <p>Describe the workflow and technical choices clearly.</p>
        </div>
        <div class="tf-card">
          <strong>Show</strong>
          <p>Present the result in a portfolio or interview.</p>
        </div>
      </div>

      <div class="lab-box">
        <strong>CAPSTONE CHECKPOINT:</strong> Present the project problem, tool choice, workflow logic, testing approach, exception plan, and result. Leave with a project story that can be explained in an interview or career conversation.
      </div>
    </div>

    <div class="doc-footer">
      <div>Agentic &amp; Project Delivery · Classes 30–33</div>
      <div>rpavault.com · 08</div>
    </div>
  </div>

  <!-- PAGE 9: PROJECTS & CAREER SUPPORT -->
  <div class="page">
    <div>
      <div class="doc-header">
        <span class="dh-left">PROJECTS · CAREER SUPPORT · EVIDENCE</span>
        <span class="dh-right">PAGE 08</span>
      </div>

      <span class="eyebrow">THE DIFFERENCE BETWEEN LEARNING AND BEING READY</span>
      <h2 class="page-title">Build work you can <em>talk about</em>.</h2>
      <p class="page-subtitle">Students get a structured route to convert class topics into practical tasks, project examples, and a clearer professional profile.</p>

      <div class="grid-2" style="margin-bottom:3mm;">
        <div class="card blue-top">
          <h4 style="font-family:'Sora',sans-serif; font-size:13px; color:#091e36; margin:0 0 6px;">Project and Learning Support</h4>
          <ul class="clean-list">
            <li>Step-by-step topic guidance across all 33 classes.</li>
            <li>Daily recordings for revision and continued reference.</li>
            <li>Progress tracking, daily tasks, and guided practice.</li>
            <li>30–40 guided tasks plus 15–25 mini projects.</li>
            <li>RPA Challenge-style practice and real-time project explanations.</li>
            <li>UiPath Academy certification guidance and progress tracking.</li>
          </ul>
        </div>

        <div class="card teal-top">
          <h4 style="font-family:'Sora',sans-serif; font-size:13px; color:#091e36; margin:0 0 6px;">Portfolio &amp; Career Support</h4>
          <div style="margin-bottom:8px;">
            <strong style="font-size:11.5px; color:#0058b0; display:block;">Portfolio Direction:</strong>
            <p style="font-size:11px; color:#475569; margin:2px 0 0; line-height:1.4;">Document business problem, input, output, workflow logic, tools used, exception strategy, testing approach, and improvement.</p>
          </div>
          <div>
            <strong style="font-size:11.5px; color:#0d9488; display:block;">Career Support:</strong>
            <p style="font-size:11px; color:#475569; margin:2px 0 0; line-height:1.4;">Mock interviews, resume preparation, LinkedIn and Naukri profile setup, job-application support, interview questions, and portfolio development.</p>
          </div>
        </div>
      </div>

      <div class="grid-4" style="margin-bottom:3mm;">
        <div class="card" style="text-align:center; padding:10px 8px;">
          <div style="font-family:'IBM Plex Mono',monospace; font-size:16px; font-weight:700; color:#0058b0;">01</div>
          <strong style="font-size:12px; display:block; margin:2px 0;">Build</strong>
          <p style="font-size:10px; color:#64748b; margin:0; line-height:1.3;">Turn class topics into working workflows.</p>
        </div>
        <div class="card" style="text-align:center; padding:10px 8px;">
          <div style="font-family:'IBM Plex Mono',monospace; font-size:16px; font-weight:700; color:#0d9488;">02</div>
          <strong style="font-size:12px; display:block; margin:2px 0;">Test</strong>
          <p style="font-size:10px; color:#64748b; margin:0; line-height:1.3;">Review inputs, outputs, and exceptions.</p>
        </div>
        <div class="card" style="text-align:center; padding:10px 8px;">
          <div style="font-family:'IBM Plex Mono',monospace; font-size:16px; font-weight:700; color:#16a34a;">03</div>
          <strong style="font-size:12px; display:block; margin:2px 0;">Explain</strong>
          <p style="font-size:10px; color:#64748b; margin:0; line-height:1.3;">Describe the process and design decisions.</p>
        </div>
        <div class="card" style="text-align:center; padding:10px 8px;">
          <div style="font-family:'IBM Plex Mono',monospace; font-size:16px; font-weight:700; color:#d97706;">04</div>
          <strong style="font-size:12px; display:block; margin:2px 0;">Show</strong>
          <p style="font-size:10px; color:#64748b; margin:0; line-height:1.3;">Present the project in your portfolio.</p>
        </div>
      </div>

      <div class="navy-callout">
        <span class="nc-tag">NEXT CONVERSATION</span>
        <h4>Ready for a more structured automation-career story?</h4>
        <p>Use your course progress, project evidence, and practical explanations to start the next conversation with greater clarity.</p>
      </div>
    </div>

    <div class="doc-footer">
      <div>Projects · Career Support · Evidence</div>
      <div>rpavault.com · 09</div>
    </div>
  </div>

  <!-- PAGE 10: FAQ & NEXT STEPS -->
  <div class="page">
    <div>
      <div class="doc-header">
        <span class="dh-left">FAQ · NEXT STEPS</span>
        <span class="dh-right">PAGE 09</span>
      </div>

      <span class="eyebrow">BEFORE YOU BEGIN</span>
      <h2 class="page-title">The curriculum is detailed. Your next step can be <em>simple</em>.</h2>
      <p class="page-subtitle">Use the questions below to decide whether the delivery model, learning support, and course depth fit your goal.</p>

      <div class="grid-2" style="margin-bottom:3mm;">
        <div class="card" style="border-left:3px solid #0058b0;">
          <strong style="font-size:12px; color:#091e36; display:block; margin-bottom:3px;">Is the training online or offline?</strong>
          <p style="font-size:11px; line-height:1.4; color:#475569; margin:0;">It is a live online programme delivered through interactive video-conferencing sessions.</p>
        </div>

        <div class="card" style="border-left:3px solid #16a34a;">
          <strong style="font-size:12px; color:#091e36; display:block; margin-bottom:3px;">Do I need programming experience?</strong>
          <p style="font-size:11px; line-height:1.4; color:#475569; margin:0;">No. The course starts with foundations and builds gradually toward advanced automation topics.</p>
        </div>

        <div class="card" style="border-left:3px solid #0058b0;">
          <strong style="font-size:12px; color:#091e36; display:block; margin-bottom:3px;">Are recordings included?</strong>
          <p style="font-size:11px; line-height:1.4; color:#475569; margin:0;">Class recordings are provided for revision and continued reference with lifetime access.</p>
        </div>

        <div class="card" style="border-left:3px solid #16a34a;">
          <strong style="font-size:12px; color:#091e36; display:block; margin-bottom:3px;">Is certification support included?</strong>
          <p style="font-size:11px; line-height:1.4; color:#475569; margin:0;">The curriculum includes course-completion certification and UiPath Academy guidance.</p>
        </div>

        <div class="card" style="border-left:3px solid #0058b0;">
          <strong style="font-size:12px; color:#091e36; display:block; margin-bottom:3px;">When are batches held?</strong>
          <p style="font-size:11px; line-height:1.4; color:#475569; margin:0;">The curriculum describes weekday morning batches designed for focused, consistent learning.</p>
        </div>

        <div class="card" style="border-left:3px solid #16a34a;">
          <strong style="font-size:12px; color:#091e36; display:block; margin-bottom:3px;">How do I ask about enrolment?</strong>
          <p style="font-size:11px; line-height:1.4; color:#475569; margin:0;">Use the RPA Vault contact page to discuss course fit, batch options, and your learning goal.</p>
        </div>
      </div>

      <div class="grid-2">
        <div class="navy-callout" style="margin:0;">
          <span class="nc-tag">EXPLORE</span>
          <h4>Explore the full course</h4>
          <p>Review the detailed 33-class curriculum, platform coverage, projects, and support model at rpavault.com.</p>
        </div>
        <div class="navy-callout" style="background:#0058b0; margin:0;">
          <span class="nc-tag" style="color:#bae6fd;">CONNECT</span>
          <h4>Start a conversation</h4>
          <p>Share your background and goals with RPA Vault to discuss the right next step for your career.</p>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>FAQ · Next Step</div>
      <div>rpavault.com · 10</div>
    </div>
  </div>

  <!-- PAGE 11: CLOSING -->
  <div class="page cover-page">
    <div class="cover-brand">
      <div>
        <div class="cover-logo-text">RPA Vault</div>
        <div class="cover-logo-sub">Professional Career Training</div>
      </div>
      <div class="cover-badge">Career Pathway</div>
    </div>

    <div class="cover-main" style="text-align:center; max-width:140mm; margin:0 auto;">
      <div class="cover-audience">Your Next Practical Step</div>
      <div class="cover-title" style="font-size:38px;">Learn the tools.<br>Build the evidence.</div>
      <div class="cover-desc" style="font-size:14px; margin:0 auto 8mm;">
        Explore the complete course, review the class topics, and connect with RPA Vault to plan your automation-learning journey.
      </div>

      <div class="grid-2" style="text-align:left;">
        <div class="cover-box" style="margin-bottom:0;">
          <strong>Explore the complete course</strong>
          <p>See the full curriculum, learning model, project path, and course details.</p>
        </div>
        <div class="cover-box" style="margin-bottom:0;">
          <strong>Talk to RPA Vault</strong>
          <p>Discuss your background, course fit, batch options, and next step.</p>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>RPA Vault · Advanced RPA · UiPath · Power Automate · Agentic Automation</div>
      <div>rpavault.com/contact/</div>
    </div>
  </div>

</body>
</html>`;

(async () => {
  try {
    const tempHtmlPath = path.join(__dirname, 'temp_rpa_agentic.html');
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

    console.log('Launching browser to generate RPA Agentic syllabus PDF...');
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const browser = await puppeteer.launch({
      executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.goto('file://' + tempHtmlPath, { waitUntil: 'load' });

    const outputPath = path.join(__dirname, '../assets/docs/rpa-agentic-syllabus.pdf');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    // Also copy to _site if _site/assets/docs exists
    const siteDocsDir = path.join(__dirname, '../_site/assets/docs');
    if (fs.existsSync(siteDocsDir)) {
      fs.copyFileSync(outputPath, path.join(siteDocsDir, 'rpa-agentic-syllabus.pdf'));
    }

    await browser.close();
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }

    const stats = fs.statSync(outputPath);
    console.log(`Successfully generated RPA Agentic syllabus PDF at: ${outputPath} (${stats.size} bytes)`);
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
})();
