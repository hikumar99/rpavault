const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const logoWhitePath = path.join(__dirname, '../assets/images/logo-rpavault-white.png');
const logoWhiteBase64 = fs.existsSync(logoWhitePath)
  ? `data:image/png;base64,${fs.readFileSync(logoWhitePath).toString('base64')}`
  : '';

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MSBI Masterclass Curriculum Guide - SSIS, SSAS, SSRS - RPA Vault</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700;800&family=Sora:wght@600;700;800&display=swap');

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
    color: #0f172a;
    background: #ffffff;
    -webkit-font-smoothing: antialiased;
  }

  .page {
    width: 210mm;
    height: 297mm;
    page-break-after: always;
    page-break-inside: avoid;
    position: relative;
    padding: 16mm 18mm 14mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
    box-sizing: border-box;
    overflow: hidden;
  }

  .page-main {
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: space-between;
    min-height: 0;
    gap: 7px;
    margin: 2mm 0;
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
    color: #0d9488;
    text-transform: uppercase;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 2.5mm;
  }
  .doc-header .dh-left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #0f172a;
    font-weight: 800;
  }
  .doc-header .dh-right {
    color: #0d9488;
    background: #f0fdfa;
    border: 1px solid #ccfbf1;
    padding: 2.5px 8px;
    border-radius: 4px;
  }

  .doc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    color: #64748b;
    border-top: 1.5px solid #e2e8f0;
    padding-top: 2.5mm;
  }
  .doc-footer a {
    color: #0d9488;
    text-decoration: none;
    font-weight: 700;
  }

  /* TYPOGRAPHY */
  .eyebrow {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #0d9488;
    margin-bottom: 1.5mm;
    display: inline-block;
  }
  .page-title {
    font-family: 'Sora', sans-serif;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.2;
    color: #0f172a;
    margin: 0 0 2mm;
    letter-spacing: -0.02em;
  }
  .page-title em {
    font-style: italic;
    color: #0d9488;
    font-weight: 800;
  }
  .page-subtitle {
    font-size: 12px;
    line-height: 1.5;
    color: #475569;
    margin: 0;
  }

  /* PREMIUM DARK CYBER COVER & CLOSING PAGES */
  .cover-page {
    background: radial-gradient(circle at 85% 15%, rgba(13, 148, 136, 0.3), transparent 45%),
                radial-gradient(circle at 15% 85%, rgba(2, 132, 199, 0.22), transparent 45%),
                linear-gradient(165deg, #040914 0%, #061e24 50%, #030712 100%);
    color: #ffffff;
    padding: 22mm 22mm 18mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cover-brand {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding-bottom: 5mm;
  }
  .cover-logo-img {
    height: 44px;
    width: auto;
    object-fit: contain;
  }
  .cover-badge {
    background: rgba(13, 148, 136, 0.15);
    border: 1px solid rgba(13, 148, 136, 0.4);
    border-radius: 99px;
    padding: 7px 18px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: #2dd4bf;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .cover-main {
    margin: 4mm 0;
  }
  .cover-audience {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    color: #38bdf8;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 4mm;
  }
  .cover-title {
    font-family: 'Sora', sans-serif;
    font-size: 38px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.03em;
    color: #ffffff;
    margin-bottom: 5mm;
  }
  .cover-desc {
    font-size: 14.5px;
    line-height: 1.65;
    color: #cbd5e1;
    max-width: 168mm;
    margin-bottom: 6mm;
  }
  .cover-box {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 12px;
    padding: 15px 20px;
    margin-bottom: 6mm;
  }
  .cover-box strong {
    color: #2dd4bf;
    font-size: 13px;
    display: block;
    margin-bottom: 4px;
    font-family: 'Sora', sans-serif;
  }
  .cover-box p {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.5;
    color: #e2e8f0;
  }
  .cover-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 6mm;
  }
  .cover-stat-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 13px 15px;
    position: relative;
    overflow: hidden;
  }
  .cover-stat-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 3px;
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
    margin-top: 3px;
    line-height: 1.35;
  }
  .cover-cta-row {
    display: flex;
    gap: 14px;
    margin-top: 5mm;
  }
  .cover-cta-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
    color: #ffffff;
    text-decoration: none;
    font-family: 'Sora', sans-serif;
    font-size: 12.5px;
    font-weight: 700;
    padding: 11px 22px;
    border-radius: 8px;
    box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);
  }
  .cover-cta-btn.secondary {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: none;
  }
  .cover-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
    padding-top: 4mm;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: #94a3b8;
  }

  /* GHOSTED WATERMARKS */
  .ghost-num {
    position: absolute;
    top: 8px;
    right: 14px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 34px;
    font-weight: 800;
    line-height: 1;
    opacity: 0.12;
    pointer-events: none;
    color: #0f172a;
  }
  .ghost-num.teal { color: #0d9488; opacity: 0.16; }
  .ghost-num.cyan { color: #0284c7; opacity: 0.16; }
  .ghost-num.purple { color: #7c3aed; opacity: 0.16; }
  .ghost-num.gold { color: #d97706; opacity: 0.18; }

  /* CARDS & GRIDS */
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
    gap: 9px;
  }

  .card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    padding: 12px 14px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .card.teal { border: 1.5px solid #99f6e4; }
  .card.cyan { border: 1.5px solid #bae6fd; }
  .card.purple { border: 1.5px solid #e9d5ff; }
  .card.gold { border: 1.5px solid #fde68a; }

  .card-tag {
    display: inline-flex;
    align-items: center;
    padding: 2.5px 8px;
    border-radius: 4px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 5px;
    width: fit-content;
  }
  .card-tag.teal { background: #ccfbf1; color: #0f766e; }
  .card-tag.cyan { background: #e0f2fe; color: #0369a1; }
  .card-tag.purple { background: #f3e8ff; color: #7e22ce; }
  .card-tag.gold { background: #fef3c7; color: #b45309; }

  .card-title {
    font-family: 'Sora', sans-serif;
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 5px;
    line-height: 1.3;
  }
  .card-desc {
    font-size: 11.5px;
    line-height: 1.48;
    color: #475569;
    margin: 0 0 6px;
  }

  /* BULLET LIST */
  .bullet-list {
    margin: 3px 0 0;
    padding-left: 15px;
  }
  .bullet-list li {
    font-size: 11px;
    line-height: 1.45;
    color: #334155;
    margin-bottom: 2.5px;
  }
  .bullet-list li strong {
    color: #0f172a;
  }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 5px;
  }
  .pill-tag {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 2px 7px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 600;
    color: #334155;
  }

  /* MINI CHECKLIST CARDS */
  .mini-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 8px 10px;
  }
  .mini-card h5 {
    font-family: 'Sora', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 3px;
  }
  .mini-card p {
    font-size: 10px;
    line-height: 1.35;
    color: #64748b;
    margin: 0;
  }

  /* CALLOUT BOXES */
  .callout-box {
    background: #f8fafc;
    border-left: 3.5px solid #0d9488;
    border-radius: 0 8px 8px 0;
    padding: 9px 13px;
    font-size: 11px;
    line-height: 1.45;
    color: #334155;
  }
  .callout-box strong { color: #0d9488; }

  .callout-box.cyan { border-left-color: #0284c7; }
  .callout-box.cyan strong { color: #0284c7; }
  .callout-box.purple { border-left-color: #7c3aed; }
  .callout-box.purple strong { color: #7c3aed; }

  .navy-callout {
    background: linear-gradient(145deg, #041f24, #0f404a);
    border-radius: 10px;
    padding: 11px 15px;
    color: #ffffff;
  }
  .navy-callout .tn-tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #2dd4bf;
    text-transform: uppercase;
    display: block;
    margin-bottom: 2px;
  }
  .navy-callout h4 {
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 700;
    margin: 0 0 3px;
    color: #ffffff;
  }
  .navy-callout p {
    font-size: 10.5px;
    line-height: 1.45;
    color: #cbd5e1;
    margin: 0;
  }

  /* PAGE FOOTER CTA BAR */
  .page-cta-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    padding: 7px 12px;
    font-size: 10.5px;
  }
  .page-cta-bar a {
    color: #0d9488;
    text-decoration: none;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
</style>
</head>
<body>

  <!-- ================= PAGE 1: COVER PAGE ================= -->
  <div class="page cover-page">
    <div class="cover-brand">
      <img src="${logoWhiteBase64}" alt="RPA Vault" class="cover-logo-img" />
      <div class="cover-badge">Microsoft Data Stack</div>
    </div>

    <div class="cover-main">
      <div class="cover-audience">DATA ENGINEERING · BUSINESS INTELLIGENCE</div>
      <div class="cover-title">MSBI Masterclass:<br>SSIS, SSAS &amp; SSRS</div>
      <div class="cover-desc">
        A topic-complete practical masterclass through SQL Server Integration Services (SSIS), Analysis Services (SSAS), and Reporting Services (SSRS). Build enterprise ETL pipelines, multidimensional analytical cubes, tabular models, and paginated dashboards.
      </div>

      <div class="cover-box">
        <strong>THE COMPLETE MICROSOFT DATA PLATFORM</strong>
        <p>Master the end-to-end flow: Ingest and clean messy transactional data with SSIS ETL, structure analytical cubes with SSAS, and distribute parameterized executive reports with SSRS.</p>
      </div>

      <div class="cover-stats-grid">
        <div class="cover-stat-card">
          <div class="cover-stat-label">SSIS ETL</div>
          <div class="cover-stat-val">75+</div>
          <div class="cover-stat-sub">Transformations &amp; tasks</div>
        </div>
        <div class="cover-stat-card">
          <div class="cover-stat-label">SSAS CUBES</div>
          <div class="cover-stat-val">15+</div>
          <div class="cover-stat-sub">Multidimensional &amp; Tabular</div>
        </div>
        <div class="cover-stat-card">
          <div class="cover-stat-label">SSRS REPORTS</div>
          <div class="cover-stat-val">08+</div>
          <div class="cover-stat-sub">Enterprise report types</div>
        </div>
        <div class="cover-stat-card">
          <div class="cover-stat-label">FORMAT</div>
          <div class="cover-stat-val">100%</div>
          <div class="cover-stat-sub">Practical live coding</div>
        </div>
      </div>

      <div class="cover-cta-row">
        <a href="https://rpavault.com/course/msbi-masterclass/" class="cover-cta-btn">
          Explore Course Webpage &rarr;
        </a>
        <a href="https://rpavault.com/contact/" class="cover-cta-btn secondary">
          Talk to MSBI Mentors &rarr;
        </a>
      </div>
    </div>

    <div class="cover-footer">
      <div>RPA Vault · Microsoft BI Career Track · Hyderabad / Global Online</div>
      <div>rpavault.com</div>
    </div>
  </div>

  <!-- ================= PAGE 2: ARCHITECTURE & TRACK BLUEPRINT ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">RPA VAULT · MSBI MASTERCLASS</div>
      <div class="dh-right">TRACK BLUEPRINT</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">END-TO-END PIPELINE ARCHITECTURE</span>
        <h2 class="page-title">The Enterprise <em>Microsoft BI Ecosystem</em></h2>
        <p class="page-subtitle">Understand how raw transactional databases are extracted, transformed, modeled, and visualized through the unified Microsoft BI stack.</p>
      </div>

      <!-- 3 Core Tiers -->
      <div class="grid-3">
        <div class="card teal" style="border-top: 3.5px solid #0d9488;">
          <span class="ghost-num teal">01</span>
          <span class="card-tag teal">TIER 1 · ETL</span>
          <h4 class="card-title">SSIS (Integration Services)</h4>
          <p class="card-desc">High-throughput data extraction, cleansing, transformation, and warehouse loading:</p>
          <ul class="bullet-list">
            <li><strong>Control Flow:</strong> Loop containers, Execute SQL.</li>
            <li><strong>Data Flow:</strong> 20+ built-in transformations.</li>
            <li><strong>SCD Engine:</strong> Type 1 &amp; Type 2 historical data.</li>
            <li><strong>Deployment:</strong> SSISDB &amp; SQL Agent automation.</li>
          </ul>
        </div>

        <div class="card cyan" style="border-top: 3.5px solid #0284c7;">
          <span class="ghost-num cyan">02</span>
          <span class="card-tag cyan">TIER 2 · MODELING</span>
          <h4 class="card-title">SSAS (Analysis Services)</h4>
          <p class="card-desc">Multidimensional cubes and modern in-memory Tabular analytical models:</p>
          <ul class="bullet-list">
            <li><strong>Cubes &amp; DSVs:</strong> Star and Snowflake schemas.</li>
            <li><strong>Hierarchies &amp; KPIs:</strong> Drill-downs &amp; status trends.</li>
            <li><strong>Tabular Models:</strong> VertiPaq memory engine.</li>
            <li><strong>DAX &amp; MDX:</strong> Calculated measures &amp; time intelligence.</li>
          </ul>
        </div>

        <div class="card purple" style="border-top: 3.5px solid #7c3aed;">
          <span class="ghost-num purple">03</span>
          <span class="card-tag purple">TIER 3 · REPORTING</span>
          <h4 class="card-title">SSRS (Reporting Services)</h4>
          <p class="card-desc">Pixel-perfect paginated reports, dynamic charts, and automated distribution:</p>
          <ul class="bullet-list">
            <li><strong>Layout Types:</strong> Table, Matrix pivot &amp; Charts.</li>
            <li><strong>Parameters:</strong> Cascading &amp; multi-select filters.</li>
            <li><strong>Drill-Through:</strong> Master-detail subreports.</li>
            <li><strong>Subscriptions:</strong> Scheduled email &amp; file share.</li>
          </ul>
        </div>
      </div>

      <!-- 4 Strategic Pillars -->
      <div class="grid-2">
        <div class="card teal">
          <span class="card-tag teal">AUDIENCE</span>
          <h4 class="card-title">Who This Is Designed For</h4>
          <p class="card-desc">SQL Developers, Database Administrators, Data Analysts, and QA Engineers wanting to transition to Microsoft BI &amp; Data Engineering.</p>
          <div class="tags-row">
            <span class="pill-tag">SQL Developers</span>
            <span class="pill-tag">Data Analysts</span>
            <span class="pill-tag">ETL Engineers</span>
          </div>
        </div>

        <div class="card cyan">
          <span class="card-tag cyan">PREREQUISITES</span>
          <h4 class="card-title">What You Need Before Starting</h4>
          <p class="card-desc">Basic SQL querying (SELECT, JOIN, GROUP BY). All SSIS, SSAS, SSRS, Data Warehousing, and SSDT concepts are taught from scratch.</p>
          <div class="tags-row">
            <span class="pill-tag">Basic SQL</span>
            <span class="pill-tag">SSDT Tools</span>
            <span class="pill-tag">No Prior BI Required</span>
          </div>
        </div>
      </div>

      <div class="navy-callout">
        <span class="tn-tag">THE ENTERPRISE ADVANTAGE</span>
        <h4>Master the data platform powering Fortune 500 decision systems.</h4>
        <p>Learn Data Warehousing · Build SSIS Pipelines · Design Multidimensional Cubes · Publish Paginated SSRS Reports with automated distribution.</p>
      </div>

      <div class="page-cta-bar">
        <span>Ready to master the Microsoft BI stack? View batch schedules and enroll</span>
        <a href="https://rpavault.com/course/msbi-masterclass/">View Course Webpage &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · MSBI Masterclass Curriculum</div>
      <div>Page 2 of 6 · <a href="https://rpavault.com/course/msbi-masterclass/">rpavault.com/course/msbi-masterclass/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 3: SSIS DEEP DIVE (CLASSES 1–10) ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">PHASE 01 &amp; 02 · SSIS MODULES</div>
      <div class="dh-right">INTEGRATION SERVICES (ETL)</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">PHASE 01 &amp; 02 · HIGH-THROUGHPUT ETL</span>
        <h2 class="page-title">SSIS Architecture, <em>Control Flow &amp; Transformations</em></h2>
        <p class="page-subtitle">Master Data Warehousing fundamentals, Control Flow tasks, loop containers, 20+ transformations, SCD, and SQL Agent deployment.</p>
      </div>

      <!-- SSIS Section 1: Control Flow & Containers -->
      <div class="grid-2">
        <div class="card teal">
          <span class="ghost-num teal">01</span>
          <span class="card-tag teal">CONTROL FLOW</span>
          <h4 class="card-title">Tasks, Containers &amp; Precedence</h4>
          <p class="card-desc">Orchestrating complex ETL task workflows and looping logic:</p>
          <ul class="bullet-list">
            <li><strong>Core Tasks:</strong> Execute SQL, File System, Send Mail, Script Task (C#), FTP Task.</li>
            <li><strong>Containers:</strong> Sequence Containers, For Loop &amp; Foreach Loop (Files &amp; ADO objects).</li>
            <li><strong>Precedence Constraints:</strong> Success, Failure, Completion, and Expression rules.</li>
          </ul>
        </div>

        <div class="card teal">
          <span class="ghost-num teal">02</span>
          <span class="card-tag teal">DATA FLOW</span>
          <h4 class="card-title">Data Flow Engine &amp; Buffers</h4>
          <p class="card-desc">High-speed in-memory data pipeline execution:</p>
          <ul class="bullet-list">
            <li><strong>Sources &amp; Destinations:</strong> OLE DB, ADO.NET, Flat File, Excel, XML, Raw Files.</li>
            <li><strong>Buffer Tuning:</strong> DefaultBufferMaxRows, DefaultBufferSize, and thread management.</li>
            <li><strong>Data Viewers:</strong> Live pipeline debugging and grid inspection.</li>
          </ul>
        </div>
      </div>

      <!-- SSIS Section 2: Transformations & SCD -->
      <div class="grid-2">
        <div class="card teal">
          <span class="ghost-num teal">03</span>
          <span class="card-tag teal">TRANSFORMATIONS</span>
          <h4 class="card-title">20+ Built-in Transformations</h4>
          <p class="card-desc">Cleansing, shaping, routing, and aggregating streaming data:</p>
          <ul class="bullet-list">
            <li><strong>Row Level:</strong> Data Conversion, Derived Column, Conditional Split, Copy Column.</li>
            <li><strong>Lookups &amp; Joins:</strong> Lookup (Full / Partial / No Cache), Merge, Merge Join (Inner/Left/Full).</li>
            <li><strong>Aggregations &amp; Routing:</strong> Aggregate, Sort, Multicast, Union All.</li>
          </ul>
        </div>

        <div class="card teal">
          <span class="ghost-num teal">04</span>
          <span class="card-tag teal">SCD &amp; DEPLOYMENT</span>
          <h4 class="card-title">Slowly Changing Dimensions &amp; Catalog</h4>
          <p class="card-desc">Managing dimension history and production scheduling:</p>
          <ul class="bullet-list">
            <li><strong>SCD Type 1 &amp; Type 2:</strong> SCD Wizard, custom lookup &amp; historical row tracking.</li>
            <li><strong>Error Handling:</strong> Event Handlers (OnError, OnWarning), Row Redirects, Logging.</li>
            <li><strong>Deployment:</strong> Project Deployment Model, SSISDB Catalog, SQL Agent automation.</li>
          </ul>
        </div>
      </div>

      <div class="callout-box">
        <strong>SSIS PRACTICE LAB &amp; CHECKPOINT:</strong> Build an end-to-end SSIS ETL pipeline extracting raw CSVs, cleansing data via Derived Column &amp; Lookup transformations, implementing SCD Type 2 dimension loads, and scheduling automated runs via SQL Server Agent.
      </div>

      <div class="page-cta-bar">
        <span>Have questions about SSIS packages? Connect with our mentors</span>
        <a href="https://rpavault.com/contact/">Schedule Mentor Call &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · MSBI Masterclass Curriculum</div>
      <div>Page 3 of 6 · <a href="https://rpavault.com/course/msbi-masterclass/">rpavault.com/course/msbi-masterclass/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 4: SSAS DEEP DIVE (CLASSES 11–15) ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">PHASE 03 · SSAS MODULES</div>
      <div class="dh-right">ANALYSIS SERVICES (CUBES)</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">PHASE 03 · ANALYTICAL MODELING</span>
        <h2 class="page-title">SSAS Multidimensional Cubes &amp; <em>Tabular DAX</em></h2>
        <p class="page-subtitle">Design high-performance analytical data models, dimension hierarchies, Key Performance Indicators (KPIs), and in-memory Tabular DAX models.</p>
      </div>

      <!-- SSAS Section 1: Multidimensional Cubes -->
      <div class="grid-2">
        <div class="card cyan">
          <span class="ghost-num cyan">01</span>
          <span class="card-tag cyan">DATA MODELING</span>
          <h4 class="card-title">Data Source Views &amp; Dimensions</h4>
          <p class="card-desc">Structuring Star and Snowflake data schemas in SSDT:</p>
          <ul class="bullet-list">
            <li><strong>DSVs:</strong> Creating Data Sources, Data Source Views, logical primary keys &amp; calculations.</li>
            <li><strong>Dimensions:</strong> Standard, Time, and Degenerate dimensions. Key &amp; Name columns.</li>
            <li><strong>Attribute Relationships:</strong> Optimization for query performance and aggregation paths.</li>
          </ul>
        </div>

        <div class="card cyan">
          <span class="ghost-num cyan">02</span>
          <span class="card-tag cyan">CUBE DESIGN</span>
          <h4 class="card-title">Measure Groups &amp; Hierarchies</h4>
          <p class="card-desc">Building and processing multidimensional OLAP cubes:</p>
          <ul class="bullet-list">
            <li><strong>Measure Groups:</strong> Additive, Semi-additive, and Non-additive measures.</li>
            <li><strong>User Hierarchies:</strong> Multi-level drill-down paths (Year &rarr; Quarter &rarr; Month &rarr; Day).</li>
            <li><strong>Cube Processing:</strong> ProcessFull, ProcessData, ProcessIndex, and automated refreshes.</li>
          </ul>
        </div>
      </div>

      <!-- SSAS Section 2: Calculations, KPIs & Tabular -->
      <div class="grid-2">
        <div class="card cyan">
          <span class="ghost-num cyan">03</span>
          <span class="card-tag cyan">CALCULATIONS &amp; KPIS</span>
          <h4 class="card-title">Calculated Members &amp; KPI Metrics</h4>
          <p class="card-desc">Writing custom business metrics and visual performance indicators:</p>
          <ul class="bullet-list">
            <li><strong>MDX Expressions:</strong> Calculated members, growth percentages, and ratios.</li>
            <li><strong>KPIs:</strong> Value, Goal, Status, and Trend graphics (traffic lights, arrows).</li>
            <li><strong>Perspectives &amp; Actions:</strong> Defining focused cube slices and URL/Drill-through actions.</li>
          </ul>
        </div>

        <div class="card cyan">
          <span class="ghost-num cyan">04</span>
          <span class="card-tag cyan">TABULAR &amp; DAX</span>
          <h4 class="card-title">Tabular Models &amp; DAX Measures</h4>
          <p class="card-desc">Modern in-memory column-store analytical modeling:</p>
          <ul class="bullet-list">
            <li><strong>VertiPaq Engine:</strong> In-memory column storage and relationship definitions.</li>
            <li><strong>Calculated Columns vs Measures:</strong> Row context vs Filter context.</li>
            <li><strong>DAX Basics:</strong> CALCULATE, FILTER, RELATED, SUM, and Time Intelligence (YTD/MTD).</li>
          </ul>
        </div>
      </div>

      <div class="callout-box cyan">
        <strong>SSAS PRACTICE LAB &amp; CHECKPOINT:</strong> Build a complete Retail Sales Analysis Cube in SSDT with 3 Dimensions, a Date Hierarchy, 4 Measure Groups, Custom KPI indicators with status graphics, and deploy to an Analysis Services instance.
      </div>

      <div class="page-cta-bar">
        <span>Master Multidimensional &amp; Tabular data modeling</span>
        <a href="https://rpavault.com/course/msbi-masterclass/">Apply on Course Webpage &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · MSBI Masterclass Curriculum</div>
      <div>Page 4 of 6 · <a href="https://rpavault.com/course/msbi-masterclass/">rpavault.com/course/msbi-masterclass/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 5: SSRS & CAPSTONE PROJECT (CLASSES 16–20) ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">PHASE 04 · SSRS &amp; CAPSTONE</div>
      <div class="dh-right">REPORTING SERVICES</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">PHASE 04 · ENTERPRISE VISUALIZATION</span>
        <h2 class="page-title">SSRS Reporting &amp; <em>End-to-End Capstone</em></h2>
        <p class="page-subtitle">Build pixel-perfect paginated reports, dynamic matrix pivots, cascading parameters, automated subscriptions, and connect the end-to-end BI pipeline.</p>
      </div>

      <!-- SSRS Section 1: Report Design & Interactivity -->
      <div class="grid-2">
        <div class="card purple">
          <span class="ghost-num purple">01</span>
          <span class="card-tag purple">REPORT AUTHORING</span>
          <h4 class="card-title">Datasets, Tables &amp; Matrix Pivots</h4>
          <p class="card-desc">Designing professional enterprise report layouts:</p>
          <ul class="bullet-list">
            <li><strong>Data Sources &amp; Datasets:</strong> Shared vs Embedded data connections.</li>
            <li><strong>Data Regions:</strong> Table, Matrix (Pivot), List, and Chart visualizations.</li>
            <li><strong>Expressions:</strong> Dynamic formatting, IIF logic, conditional background styling.</li>
          </ul>
        </div>

        <div class="card purple">
          <span class="ghost-num purple">02</span>
          <span class="card-tag purple">INTERACTIVITY &amp; DELIVERY</span>
          <h4 class="card-title">Parameters, Drill-Downs &amp; Subscriptions</h4>
          <p class="card-desc">Adding user interactive controls and automated delivery:</p>
          <ul class="bullet-list">
            <li><strong>Parameters:</strong> Multi-value, default values, and Cascading dropdown filters.</li>
            <li><strong>Interactive Navigation:</strong> Drill-down toggle visibility, Document Maps, Subreports.</li>
            <li><strong>Report Manager Portal:</strong> Security roles, Scheduled email &amp; file-share Subscriptions.</li>
          </ul>
        </div>
      </div>

      <!-- Capstone Architecture Project -->
      <div class="card purple" style="border-top: 3.5px solid #7c3aed;">
        <span class="ghost-num purple">03</span>
        <span class="card-tag purple">END-TO-END CAPSTONE PROJECT</span>
        <h4 class="card-title" style="font-size: 14px;">Enterprise Financial &amp; Retail Data Warehouse</h4>
        <p class="card-desc">Connect the full Microsoft BI stack into a production-grade automated analytics pipeline:</p>
        <div class="grid-3" style="margin-top: 4px;">
          <div class="mini-card" style="border-top: 2px solid #0d9488;">
            <h5>1. SSIS ETL Engine</h5>
            <p>Ingest dirty transactional data, clean fields, apply SCD Type 2, and load Star Schema Data Warehouse.</p>
          </div>
          <div class="mini-card" style="border-top: 2px solid #0284c7;">
            <h5>2. SSAS Analytical Cube</h5>
            <p>Model Fact &amp; Dim tables, user hierarchies, custom KPIs, and in-memory Tabular DAX measures.</p>
          </div>
          <div class="mini-card" style="border-top: 2px solid #7c3aed;">
            <h5>3. SSRS Dashboards</h5>
            <p>Publish parameterized Matrix reports with drill-down, charts, and automated executive email subscriptions.</p>
          </div>
        </div>
      </div>

      <div class="callout-box purple">
        <strong>CAPSTONE VERIFICATION &amp; CODE REVIEW:</strong> Deploy the complete automated pipeline on SQL Server, execute automated ETL refreshes, query the SSAS cube with Excel/Power BI, and schedule daily SSRS executive PDF dispatches.
      </div>

      <div class="page-cta-bar">
        <span>The complete end-to-end Microsoft BI portfolio project</span>
        <a href="https://rpavault.com/course/msbi-masterclass/">View Capstone Details &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · MSBI Masterclass Curriculum</div>
      <div>Page 5 of 6 · <a href="https://rpavault.com/course/msbi-masterclass/">rpavault.com/course/msbi-masterclass/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 6: CLOSING & NEXT STEPS ================= -->
  <div class="page cover-page">
    <div class="cover-brand">
      <img src="${logoWhiteBase64}" alt="RPA Vault" class="cover-logo-img" />
      <div class="cover-badge">Career Pathway</div>
    </div>

    <div class="cover-main" style="text-align:center; max-width:155mm; margin:0 auto;">
      <div class="cover-audience">YOUR PRACTICAL DATA BI PATHWAY</div>
      <div class="cover-title" style="font-size:38px;">Master the tools.<br>Build the evidence.</div>
      <div class="cover-desc" style="font-size:14.5px; margin:0 auto 6mm;">
        Explore the complete MSBI masterclass, review live batch timings, and connect with RPA Vault mentors to accelerate your data engineering career.
      </div>

      <div class="grid-2" style="text-align:left; margin-bottom:6mm;">
        <div class="cover-box" style="margin-bottom:0;">
          <strong>Explore the complete course</strong>
          <p>See the full curriculum, learning model, project path, and course details online.</p>
          <a href="https://rpavault.com/course/msbi-masterclass/" style="color:#2dd4bf; font-weight:700; font-size:12px; text-decoration:none; display:inline-block; margin-top:5px;">rpavault.com/course/msbi-masterclass/ &rarr;</a>
        </div>
        <div class="cover-box" style="margin-bottom:0;">
          <strong>Talk to RPA Vault Mentors</strong>
          <p>Discuss your background, course fit, batch options, and enrollment steps.</p>
          <a href="https://rpavault.com/contact/" style="color:#2dd4bf; font-weight:700; font-size:12px; text-decoration:none; display:inline-block; margin-top:5px;">rpavault.com/contact/ &rarr;</a>
        </div>
      </div>

      <div class="cover-cta-row" style="justify-content:center; margin-top:4mm;">
        <a href="https://rpavault.com/course/msbi-masterclass/" class="cover-cta-btn">
          Explore Course Webpage &rarr;
        </a>
        <a href="https://rpavault.com/contact/" class="cover-cta-btn secondary">
          Talk to RPA Vault Mentors &rarr;
        </a>
      </div>
    </div>

    <div class="cover-footer">
      <div>RPA Vault · MSBI Masterclass · SSIS · SSAS · SSRS · Data Warehousing</div>
      <div><a href="https://rpavault.com/contact/" style="color:#94a3b8; text-decoration:none;">rpavault.com/contact/</a></div>
    </div>
  </div>

</body>
</html>`;

(async () => {
  try {
    const tempHtmlPath = path.join(__dirname, 'temp_msbi.html');
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

    console.log('Launching browser to generate MSBI syllabus PDF...');
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const browser = await puppeteer.launch({
      executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.goto('file://' + tempHtmlPath, { waitUntil: 'load' });

    const outputPath = path.join(__dirname, '../assets/docs/msbi-syllabus.pdf');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    // Also copy to _site if _site/assets/docs exists
    const siteDocsDir = path.join(__dirname, '../_site/assets/docs');
    if (fs.existsSync(siteDocsDir)) {
      fs.copyFileSync(outputPath, path.join(siteDocsDir, 'msbi-syllabus.pdf'));
    }

    await browser.close();
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }

    const stats = fs.statSync(outputPath);
    console.log(`Successfully generated MSBI syllabus PDF at: ${outputPath} (${stats.size} bytes)`);
  } catch (err) {
    console.error('Error generating MSBI PDF:', err);
    process.exit(1);
  }
})();
