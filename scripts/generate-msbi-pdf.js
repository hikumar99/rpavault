const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>MSBI Training Course Syllabus - RPA Vault</title>
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
    letter-spacing: 0.12em;
    color: #0d9488;
    text-transform: uppercase;
    margin-bottom: 5mm;
  }
  .doc-header .dh-left {
    color: #0f172a;
    letter-spacing: 0.08em;
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
    color: #0d9488;
    text-decoration: none;
    font-weight: 600;
  }

  /* HEADINGS */
  .section-tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #0d9488;
    margin-bottom: 2mm;
  }

  h1.page-title {
    font-family: 'Sora', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.22;
    margin: 0 0 2.5mm 0;
    letter-spacing: -0.02em;
  }

  p.page-desc {
    font-size: 11px;
    line-height: 1.55;
    color: #475569;
    margin: 0 0 5mm 0;
  }

  /* GRIDS & CARDS */
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3.5mm;
  }
  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 3mm;
  }

  .card-soft {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 3.5mm;
    padding: 3.5mm 4mm;
  }
  .card-soft h4 {
    font-family: 'Sora', sans-serif;
    font-size: 11.5px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 1.5mm 0;
  }
  .card-soft p, .card-soft li {
    font-size: 9.5px;
    line-height: 1.45;
    color: #475569;
  }
  .card-soft ul {
    margin: 0;
    padding-left: 3.5mm;
  }
  .card-soft li {
    margin-bottom: 1mm;
  }

  /* CALLOUTS */
  .navy-callout {
    background: linear-gradient(135deg, #091e36, #003666);
    border-radius: 3.5mm;
    padding: 4mm 5mm;
    color: #ffffff;
    margin: 3.5mm 0;
  }
  .navy-callout h4 {
    font-family: 'Sora', sans-serif;
    font-size: 11.5px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 1.5mm 0;
  }
  .navy-callout p {
    font-size: 9.5px;
    line-height: 1.5;
    color: #cbd5e1;
    margin: 0;
  }

  .dark-bar {
    background: #091e36;
    border-radius: 3mm;
    padding: 3mm 4mm;
    color: #ffffff;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    font-weight: 700;
    text-align: center;
    letter-spacing: 0.1em;
    margin-top: 3.5mm;
  }

  /* COVER PAGE */
  .page-cover {
    background: linear-gradient(160deg, #091e36 0%, #031326 100%);
    color: #ffffff;
    padding: 28mm 24mm;
    justify-content: center;
  }
  .brand-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #0d9488;
    color: #ffffff;
    margin-bottom: 6mm;
  }
  .cover-pill {
    display: inline-block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #2dd4bf;
    text-transform: uppercase;
    margin-bottom: 4mm;
  }
  .cover-h1 {
    font-family: 'Sora', sans-serif;
    font-size: 48px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1;
    margin: 0 0 4mm 0;
    letter-spacing: -0.03em;
  }
  .cover-sub {
    font-family: 'Sora', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8mm;
  }
  .cover-desc {
    font-size: 14px;
    color: #cbd5e1;
    line-height: 1.6;
    max-width: 130mm;
    margin-bottom: 8mm;
  }
  .tag-practical {
    display: inline-block;
    background: #f97316;
    color: #ffffff;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
    padding: 2mm 5mm;
    border-radius: 99px;
    margin-bottom: 8mm;
  }
  .cover-stack-card {
    border-radius: 3.5mm;
    padding: 3mm 4mm;
    margin-bottom: 2.5mm;
    max-width: 80mm;
  }
  .cover-stack-card.ssis { background: #0d9488; color: #fff; }
  .cover-stack-card.ssas { background: #eab308; color: #000; }
  .cover-stack-card.ssrs { background: #f87171; color: #fff; }
  .cover-stack-card strong { display: block; font-size: 11px; }
  .cover-stack-card span { font-size: 9px; opacity: 0.9; }

  /* TIMELINE LIST (PAGE 2) */
  .timeline-item {
    display: flex;
    gap: 3.5mm;
    margin-bottom: 3.5mm;
    align-items: flex-start;
  }
  .circle-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: #ffffff;
    flex-shrink: 0;
  }
  .c-teal { background: #0d9488; }
  .c-navy { background: #0f172a; }
  .c-coral { background: #f87171; }
  .c-yellow { background: #eab308; }

  /* TOPIC TABLE */
  .topic-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
  }
  .topic-table th {
    font-family: 'IBM Plex Mono', monospace;
    font-weight: 700;
    text-align: left;
    padding: 2mm 2.5mm;
    border-bottom: 1.5px solid #cbd5e1;
    color: #0f172a;
  }
  .topic-table td {
    padding: 2.5mm 2.5mm;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }
  .topic-table tr:hover td {
    background: #f8fafc;
  }

  /* LIST CHIPS */
  .chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5mm;
    margin-top: 2mm;
  }
  .chip {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 8.5px;
    font-weight: 600;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 1.5mm;
    padding: 1mm 2.5mm;
    color: #334155;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1: COVER ==================== -->
  <div class="page page-cover">
    <div>
      <div class="brand-badge">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
      </div>

      <div class="cover-pill">MICROSOFT BUSINESS INTELLIGENCE</div>
      <div class="cover-h1">MSBI</div>
      <div class="cover-sub">TRAINING COURSE SYLLABUS</div>
      <p class="cover-desc">A topic-complete practical path through SSIS, SSAS, and SSRS.</p>

      <div class="tag-practical">100% PRACTICAL CLASSES</div>

      <div style="margin-bottom: 8mm;">
        <div class="cover-stack-card ssis">
          <strong>SSIS</strong>
          <span>Integration &amp; ETL</span>
        </div>
        <div class="cover-stack-card ssas">
          <strong>SSAS</strong>
          <span>Analytical services</span>
        </div>
        <div class="cover-stack-card ssrs">
          <strong>SSRS</strong>
          <span>Report services</span>
        </div>
      </div>

      <div class="navy-callout" style="max-width: 140mm; margin:0;">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block; margin-bottom:1mm;">TRAINING DOCUMENT</span>
        <p>Complete syllabus coverage, organized for practical classes.</p>
      </div>
    </div>

    <div class="doc-footer" style="border-top-color:rgba(255,255,255,0.15); color:#94a3b8;">
      <span>MSBI / A4 TRAINING COURSE SYLLABUS</span>
      <span>RPAVault.com</span>
    </div>
  </div>

  <!-- ==================== PAGE 2: ORIENTATION (02) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>02 / COURSE ORIENTATION</span>
    </div>

    <div>
      <div class="section-tag">COURSE ORIENTATION</div>
      <h1 class="page-title">How to use this syllabus</h1>
      <p class="page-desc">This is a training-course blueprint: each page exposes the actual topics to be covered in class.</p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div>
          <div class="timeline-item">
            <div class="circle-num c-teal">01</div>
            <div>
              <strong style="font-family:'Sora',sans-serif; font-size:12px; display:block;">SSIS</strong>
              <span style="font-size:9.5px; color:#64748b;">Build integration and ETL fluency.</span>
            </div>
          </div>
          <div class="timeline-item">
            <div class="circle-num c-navy">02</div>
            <div>
              <strong style="font-family:'Sora',sans-serif; font-size:12px; display:block;">SSAS</strong>
              <span style="font-size:9.5px; color:#64748b;">Build analytical models and explore them.</span>
            </div>
          </div>
          <div class="timeline-item">
            <div class="circle-num c-coral">03</div>
            <div>
              <strong style="font-family:'Sora',sans-serif; font-size:12px; display:block;">SSRS</strong>
              <span style="font-size:9.5px; color:#64748b;">Build reports and reporting interactions.</span>
            </div>
          </div>
          <div class="timeline-item">
            <div class="circle-num c-yellow">04</div>
            <div>
              <strong style="font-family:'Sora',sans-serif; font-size:12px; color:#0f172a; display:block;">PROJECTS</strong>
              <span style="font-size:9.5px; color:#64748b;">Apply the connected BI path.</span>
            </div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:2.5mm;">
          <div class="card-soft" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:#0d9488;">SSIS</strong>
              <span style="font-size:9px; color:#64748b; display:block;">12 syllabus sections</span>
            </div>
            <span style="font-family:'Sora',sans-serif; font-size:18px; font-weight:800; color:#0d9488;">75</span>
          </div>

          <div class="card-soft" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:#0f172a;">SSAS</strong>
              <span style="font-size:9px; color:#64748b; display:block;">2 syllabus sections</span>
            </div>
            <span style="font-family:'Sora',sans-serif; font-size:18px; font-weight:800; color:#0f172a;">15</span>
          </div>

          <div class="card-soft" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:#f87171;">SSRS</strong>
              <span style="font-size:9px; color:#64748b; display:block;">1 syllabus section</span>
            </div>
            <span style="font-family:'Sora',sans-serif; font-size:18px; font-weight:800; color:#f87171;">8</span>
          </div>

          <div class="card-soft" style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong style="font-family:'IBM Plex Mono',monospace; font-size:11px; color:#d97706;">PROJECTS</strong>
              <span style="font-size:9px; color:#64748b; display:block;">Source project section</span>
            </div>
            <span style="font-family:'Sora',sans-serif; font-size:14px; font-weight:800; color:#d97706;">Full Stack</span>
          </div>
        </div>
      </div>

      <div class="navy-callout">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block; margin-bottom:1mm;">TRAINING-FIRST FORMAT</span>
        <h4 style="font-size:12px;">The course document shows the complete topic path—not just the headline technologies.</h4>
        <p>Use the section labels to move from foundations through advanced topics, then into the project thread.</p>
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>02</span>
    </div>
  </div>

  <!-- ==================== PAGE 3: SSIS MODULE 01 (03) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>03 / SSIS / MODULE 01</span>
    </div>

    <div>
      <div class="section-tag">03 / SSIS / MODULE 01</div>
      <h1 class="page-title">Foundations and data flow</h1>
      <p class="page-desc">Introduction to SSIS, data warehousing, package architecture, ETL entities, and the data-flow model.</p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div style="display:flex; flex-direction:column; gap:2.5mm;">
          <div class="card-soft" style="background:#091e36; color:#fff; border-color:#1e3a5f;">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block;">PACKAGE</span>
            <h4 style="color:#fff;">Architecture &amp; Tools</h4>
            <p style="color:#cbd5e1; margin:0;">Architecture, ETL entities, and management tools.</p>
          </div>
          <div class="card-soft" style="background:#0d9488; color:#fff; border-color:#0f766e;">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#ccfbf1; text-transform:uppercase; display:block;">FLOW</span>
            <h4 style="color:#fff;">Data Flow Model</h4>
            <p style="color:#e0f2fe; margin:0;">Sources, destinations, transformations, viewers.</p>
          </div>
          <div class="card-soft" style="background:#f87171; color:#fff; border-color:#ef4444;">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#fee2e2; text-transform:uppercase; display:block;">PRACTICE</span>
            <h4 style="color:#fff;">Execution Trace</h4>
            <p style="color:#fff; margin:0;">Trace a record end-to-end through the package.</p>
          </div>
        </div>

        <div>
          <div class="card-soft" style="margin-bottom:3mm; border-left:3px solid #0d9488;">
            <h4 style="color:#0d9488;">Introduction to SSIS</h4>
            <ul>
              <li>SSIS Package Architecture Overview</li>
              <li>Introduction to SSIS &amp; Data Warehouse</li>
              <li>Basic ETL Entities in SSIS</li>
              <li>Data and Management Tools</li>
            </ul>
          </div>
          <div class="card-soft" style="border-left:3px solid #f87171;">
            <h4 style="color:#f87171;">Introduction to Data Flow</h4>
            <ul>
              <li>Data Flow Overview</li>
              <li>Data Sources</li>
              <li>Data Destinations</li>
              <li>Data Flow Transformations</li>
              <li>Data Viewers</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="navy-callout">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block; margin-bottom:1mm;">CLASS FOCUS</span>
        <h4>Understand how a package is organized and how data moves through a flow.</h4>
        <p>The next modules build directly on this source &rarr; flow &rarr; destination model.</p>
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>03</span>
    </div>
  </div>

  <!-- ==================== PAGE 4: SSIS MODULE 02 (04) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>04 / SSIS / MODULE 02</span>
    </div>

    <div>
      <div class="section-tag">04 / SSIS / MODULE 02</div>
      <h1 class="page-title">Sources, transformations, destinations</h1>
      <p class="page-desc">A complete component register for building and shaping a data flow.</p>

      <div class="grid-2" style="margin-bottom: 3.5mm;">
        <div class="card-soft" style="border-top:3px solid #091e36;">
          <h4 style="color:#091e36;">DATA SOURCES</h4>
          <ul>
            <li>Excel Source</li>
            <li>Flat File Source</li>
            <li>OLE DB Source</li>
            <li>XML Source</li>
          </ul>
        </div>

        <div class="card-soft" style="border-top:3px solid #f87171;">
          <h4 style="color:#f87171;">DATA FLOW DESTINATIONS</h4>
          <ul>
            <li>Data Reader Destination</li>
            <li>Excel Destination</li>
            <li>Flat File Destination</li>
            <li>OLE DB Destination</li>
          </ul>
        </div>
      </div>

      <div class="card-soft" style="border-top:3px solid #0d9488; margin-bottom:3.5mm;">
        <h4 style="color:#0d9488; margin-bottom:2mm;">DATA FLOW TRANSFORMATIONS</h4>
        <div class="grid-3">
          <ul>
            <li>Aggregate Transformation</li>
            <li>Audit Transformation</li>
            <li>Character Map Transformation</li>
            <li>Conditional Split Transformation</li>
            <li>Copy Column Transformation</li>
          </ul>
          <ul>
            <li>Derived Column Transformation</li>
            <li>Data Conversion Transformation</li>
            <li>Multicast Transformation</li>
            <li>OLE DB Command Transformation</li>
          </ul>
          <ul>
            <li>Percentage Sampling Transformation</li>
            <li>Row Count Transformation</li>
            <li>Sort Transformation</li>
            <li>Union All Transformation</li>
          </ul>
        </div>
      </div>

      <div class="dark-bar">
        SOURCE &rarr; TRANSFORM &rarr; DESTINATION
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>04</span>
    </div>
  </div>

  <!-- ==================== PAGE 5: SSIS MODULE 03 (05) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>05 / SSIS / MODULE 03</span>
    </div>

    <div>
      <div class="section-tag">05 / SSIS / MODULE 03</div>
      <h1 class="page-title">Advanced data flow</h1>
      <p class="page-desc">Matching, merging, dimensional preparation, reshaping, and text intelligence.</p>

      <div class="grid-4" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <div class="circle-num c-teal" style="width:22px; height:22px; font-size:9.5px; margin-bottom:1.5mm;">01</div>
          <strong style="font-size:10px; color:#0d9488; display:block;">MATCH</strong>
          <ul>
            <li>Lookup</li>
            <li>Merge</li>
            <li>Merge Join</li>
          </ul>
        </div>

        <div class="card-soft">
          <div class="circle-num c-navy" style="width:22px; height:22px; font-size:9.5px; margin-bottom:1.5mm;">02</div>
          <strong style="font-size:10px; color:#0f172a; display:block;">DIMENSION</strong>
          <ul>
            <li>Slowly Changing Dimension (SCD)</li>
          </ul>
        </div>

        <div class="card-soft">
          <div class="circle-num c-coral" style="width:22px; height:22px; font-size:9.5px; margin-bottom:1.5mm;">03</div>
          <strong style="font-size:10px; color:#f87171; display:block;">RESHAPE</strong>
          <ul>
            <li>Pivot</li>
            <li>Export</li>
            <li>Import</li>
            <li>Unpivot</li>
          </ul>
        </div>

        <div class="card-soft">
          <div class="circle-num c-yellow" style="width:22px; height:22px; font-size:9.5px; margin-bottom:1.5mm;">04</div>
          <strong style="font-size:10px; color:#d97706; display:block;">TEXT</strong>
          <ul>
            <li>Term Extraction</li>
            <li>Term Lookup</li>
            <li>Fuzzy Lookup</li>
            <li>Fuzzy Grouping</li>
          </ul>
        </div>
      </div>

      <div class="card-soft" style="margin-bottom:3.5mm;">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#0d9488; text-transform:uppercase; font-weight:700; display:block; margin-bottom:1.5mm;">COMPLETE ADVANCED REGISTER</span>
        <div class="grid-2">
          <ul>
            <li>Lookup Transformation</li>
            <li>Merge Transformation</li>
            <li>Merge Join Transformation</li>
            <li>Slowly Changing Dimension Transformation</li>
            <li>Pivot Transformation</li>
            <li>Export Transformation</li>
          </ul>
          <ul>
            <li>Import Transformation</li>
            <li>Unpivot Transformation</li>
            <li>Term Extraction Transformation</li>
            <li>Term Lookup Transformation</li>
            <li>Fuzzy Lookup Transformation</li>
            <li>Fuzzy Grouping Transformation</li>
          </ul>
        </div>
      </div>

      <div class="dark-bar">
        MATCH &bull; MERGE &bull; RESHAPE &bull; ENRICH
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>05</span>
    </div>
  </div>

  <!-- ==================== PAGE 6: SSIS MODULE 04 (06) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>06 / SSIS / MODULE 04</span>
    </div>

    <div>
      <div class="section-tag">06 / SSIS / MODULE 04</div>
      <h1 class="page-title">Control flow and tasks</h1>
      <p class="page-desc">Orchestrate package execution through control flow, precedence constraints, and package tasks.</p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div style="display:flex; flex-direction:column; gap:2.5mm;">
          <div class="card-soft">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:700; color:#0d9488;">01 · CONTROL FLOW OVERVIEW</span>
            <p style="margin:1mm 0 0;">Package execution tree and precedence logic.</p>
          </div>
          <div class="card-soft">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:700; color:#0d9488;">02 · PRECEDENCE CONSTRAINTS</span>
            <p style="margin:1mm 0 0;">Success, failure, completion, and expression branching.</p>
          </div>
          <div class="card-soft">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:700; color:#0d9488;">03 · TASK EXECUTION</span>
            <p style="margin:1mm 0 0;">Data manipulation, bulk loads, file and system operations.</p>
          </div>
          <div class="card-soft">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:700; color:#0d9488;">04 · PACKAGE PROCESSING</span>
            <p style="margin:1mm 0 0;">Trigger SSAS processing and cross-system tasks.</p>
          </div>
        </div>

        <div class="card-soft" style="border-left:3px solid #0d9488;">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#0d9488; text-transform:uppercase; font-weight:700; display:block; margin-bottom:2mm;">CONTROL FLOW TOPIC REGISTER</span>
          <div class="grid-2">
            <ul>
              <li>Control Flow Overview</li>
              <li>Precedence Constraints</li>
              <li>Execute SQL Task</li>
              <li>Bulk Insert Task</li>
              <li>File System Task</li>
              <li>FTP Task</li>
              <li>Send Mail Task</li>
            </ul>
            <ul>
              <li>Data Flow Task</li>
              <li>Execute Package Task</li>
              <li>Execute Process Task</li>
              <li>Web Service Task</li>
              <li>Backup Database Task</li>
              <li>Analysis Services Processing Task</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="navy-callout">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block; margin-bottom:1mm;">CLASS FOCUS</span>
        <h4>Connect control-flow decisions with the tasks that perform work inside an SSIS package.</h4>
        <p>Control Flow Overview &bull; Precedence Constraints &bull; Task execution &bull; Package processing</p>
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>06</span>
    </div>
  </div>

  <!-- ==================== PAGE 7: SSIS MODULE 05 (07) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>07 / SSIS / MODULE 05</span>
    </div>

    <div>
      <div class="section-tag">07 / SSIS / MODULE 05</div>
      <h1 class="page-title">Containers, variables, configurations, and logging</h1>
      <p class="page-desc">The topics that make package behavior reusable, configurable, diagnosable, and easier to manage.</p>

      <div class="card-soft" style="border-left:3px solid #091e36; margin-bottom:3.5mm;">
        <h4 style="color:#091e36;">ADVANCED CONTROL FLOW</h4>
        <div class="grid-3">
          <p><strong>For Loop Container:</strong> Standard counting loops.</p>
          <p><strong>For Each Loop Container:</strong> Multi-file &amp; dataset enumeration.</p>
          <p><strong>Sequence Container:</strong> Grouping tasks &amp; transaction boundaries.</p>
        </div>
      </div>

      <div class="card-soft" style="border-left:3px solid #0d9488; margin-bottom:3.5mm;">
        <h4 style="color:#0d9488;">VARIABLES AND CONFIGURATIONS</h4>
        <div class="grid-3">
          <ul>
            <li>Variables Overview</li>
            <li>Variable scope</li>
            <li>SSIS system variables</li>
          </ul>
          <ul>
            <li>Using variables in control flow</li>
            <li>Using variables in data flow</li>
            <li>Property expressions</li>
          </ul>
          <ul>
            <li>Configuration Overview</li>
            <li>Configuration options</li>
            <li>Configuration discipline</li>
          </ul>
        </div>
      </div>

      <div class="card-soft" style="border-left:3px solid #f87171; margin-bottom:3.5mm;">
        <h4 style="color:#f87171;">ERROR HANDLING AND LOGGING</h4>
        <div class="grid-2">
          <ul>
            <li>Control Flow: The On Error event handler</li>
            <li>Data Flow: Error data flow</li>
          </ul>
          <ul>
            <li>Built-in log providers (SQL, Text, XML, Event Log)</li>
          </ul>
        </div>
      </div>

      <div class="navy-callout">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block; margin-bottom:1mm;">OPERATING PRINCIPLE</span>
        <h4>A training course must cover both the happy path and the behavior when a package needs to loop, change, fail, or log.</h4>
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>07</span>
    </div>
  </div>

  <!-- ==================== PAGE 8: SSIS MODULE 06 (08) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>08 / SSIS / MODULE 06</span>
    </div>

    <div>
      <div class="section-tag">08 / SSIS / MODULE 06</div>
      <h1 class="page-title">Deployment and package management</h1>
      <p class="page-desc">Finish the SSIS track with deployment options, service management, SSMS, and SQL Server Agent.</p>

      <div class="grid-4" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <div class="circle-num c-teal" style="width:22px; height:22px; font-size:9.5px; margin-bottom:1.5mm;">01</div>
          <strong style="font-size:10px; color:#0d9488; display:block;">CONFIGURE</strong>
          <p>Configurations and deployment setup.</p>
        </div>
        <div class="card-soft">
          <div class="circle-num c-coral" style="width:22px; height:22px; font-size:9.5px; margin-bottom:1.5mm;">02</div>
          <strong style="font-size:10px; color:#f87171; display:block;">DEPLOY</strong>
          <p>Project &amp; package deployment options.</p>
        </div>
        <div class="card-soft">
          <div class="circle-num c-navy" style="width:22px; height:22px; font-size:9.5px; margin-bottom:1.5mm;">03</div>
          <strong style="font-size:10px; color:#0f172a; display:block;">MANAGE</strong>
          <p>The SSIS Service &amp; SSMS management.</p>
        </div>
        <div class="card-soft">
          <div class="circle-num c-yellow" style="width:22px; height:22px; font-size:9.5px; margin-bottom:1.5mm;">04</div>
          <strong style="font-size:10px; color:#d97706; display:block;">SCHEDULE</strong>
          <p>Scheduling packages with SQL Server Agent.</p>
        </div>
      </div>

      <div class="navy-callout">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block; margin-bottom:1mm;">PACKAGE MANAGEMENT TOPICS</span>
        <h4>The SSIS Service &bull; Managing packages with SQL Server Management Studio &bull; Scheduling packages with SQL Server Agent</h4>
        <p>Configurations and deployment &bull; Deployment options</p>
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>08</span>
    </div>
  </div>

  <!-- ==================== PAGE 9: SSAS MODULE 01 (09) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>09 / SSAS / MODULE 01</span>
    </div>

    <div>
      <div class="section-tag">09 / SSAS / MODULE 01</div>
      <h1 class="page-title">Microsoft BI and SSAS foundations</h1>
      <p class="page-desc">Move from prepared data into data sources, data source views, cubes, tabular models, and Excel exploration.</p>

      <div class="grid-4" style="margin-bottom: 4mm;">
        <div class="card-soft" style="background:#091e36; color:#fff;">
          <span style="font-size:9px; color:#2dd4bf; font-weight:700;">DATA SOURCES</span>
          <h4 style="color:#fff; font-size:11px; margin-top:1mm;">Create Data Sources</h4>
        </div>
        <div class="card-soft" style="background:#0d9488; color:#fff;">
          <span style="font-size:9px; color:#ccfbf1; font-weight:700;">VIEWS</span>
          <h4 style="color:#fff; font-size:11px; margin-top:1mm;">Create Data Source Views</h4>
        </div>
        <div class="card-soft" style="background:#005a9e; color:#fff;">
          <span style="font-size:9px; color:#bae6fd; font-weight:700;">MODEL</span>
          <h4 style="color:#fff; font-size:11px; margin-top:1mm;">Cubes / TabularModel</h4>
        </div>
        <div class="card-soft" style="background:#f87171; color:#fff;">
          <span style="font-size:9px; color:#fee2e2; font-weight:700;">EXPLORE</span>
          <h4 style="color:#fff; font-size:11px; margin-top:1mm;">View via Excel</h4>
        </div>
      </div>

      <div class="card-soft" style="border-left:3px solid #0d9488; margin-bottom:3.5mm;">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#0d9488; font-weight:700; text-transform:uppercase; display:block; margin-bottom:2mm;">SSAS FOUNDATION TOPICS</span>
        <div class="grid-2">
          <ul>
            <li>Defining Microsoft Business Intelligence</li>
            <li>Viewing a Cube Using Excel</li>
            <li>Using SSAS in SSDT</li>
            <li>Understanding SSDT</li>
          </ul>
          <ul>
            <li>Creating Data Sources</li>
            <li>Creating Data Source Views</li>
            <li>Creating a multidimensional cube</li>
            <li>Creating a TabularModel</li>
          </ul>
        </div>
      </div>

      <div class="navy-callout">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block; margin-bottom:1mm;">TRAINING THREAD</span>
        <h4>Define Microsoft Business Intelligence, work in SSDT, create the model, and view the result.</h4>
        <p>The analytical layer begins with the source and view definitions above.</p>
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>09</span>
    </div>
  </div>

  <!-- ==================== PAGE 10: SSAS MODULE 02 (10) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>10 / SSAS / MODULE 02</span>
    </div>

    <div>
      <div class="section-tag">10 / SSAS / MODULE 02</div>
      <h1 class="page-title">Intermediate analytical modeling</h1>
      <p class="page-desc">Explicit topics for extending the model with KPIs, actions, aggregations, perspectives, translations, and multi-fact scenarios.</p>

      <table class="topic-table" style="margin-bottom: 4mm;">
        <thead>
          <tr>
            <th style="width: 35%;">TOPIC</th>
            <th>TRAINING FOCUS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color:#0d9488;">KPI</strong></td>
            <td>Add a visible performance indicator.</td>
          </tr>
          <tr>
            <td><strong style="color:#f87171;">Action</strong></td>
            <td>Add a business-facing action.</td>
          </tr>
          <tr>
            <td><strong style="color:#eab308;">Aggregation</strong></td>
            <td>Create a summarized analytical path.</td>
          </tr>
          <tr>
            <td><strong style="color:#091e36;">Creating Perspectives</strong></td>
            <td>Create focused views of the model.</td>
          </tr>
          <tr>
            <td><strong style="color:#0d9488;">Creating Translations</strong></td>
            <td>Add alternate labels and language context.</td>
          </tr>
          <tr>
            <td><strong style="color:#f87171;">Working with Multiple Fact Tables</strong></td>
            <td>Work with multiple fact structures.</td>
          </tr>
          <tr>
            <td><strong style="color:#091e36;">Using the Business Intelligence Wizard</strong></td>
            <td>Apply BI modeling patterns through the wizard.</td>
          </tr>
        </tbody>
      </table>

      <div class="navy-callout">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block; margin-bottom:1mm;">SSAS INTERMEDIATE REGISTER</span>
        <h4>KPI &bull; Action &bull; Aggregation &bull; Perspectives &bull; Translations</h4>
        <p>Working with Multiple Fact Tables &bull; Using the Business Intelligence Wizard</p>
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>10</span>
    </div>
  </div>

  <!-- ==================== PAGE 11: SSRS MODULE 01 (11) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>11 / SSRS / MODULE 01</span>
    </div>

    <div>
      <div class="section-tag">11 / SSRS / MODULE 01</div>
      <h1 class="page-title">Report formats and report construction</h1>
      <p class="page-desc">Build the report layer with the complete set of basic formats and data-foundation topics in the source syllabus.</p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div>
          <div class="card-soft" style="margin-bottom:3mm;">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#0d9488; text-transform:uppercase;">DATA SOURCE + DATASET</span>
            <h4 style="font-size:13px; margin:1mm 0 2mm;">Build the report from its data foundation.</h4>
            <p style="font-size:9.5px; margin:0;">Construct data sources and datasets before designing visual components.</p>
          </div>

          <div class="grid-2">
            <div class="card-soft" style="background:#0d9488; color:#fff; text-align:center; padding:2.5mm;">
              <strong style="font-size:10px;">TABULAR</strong>
            </div>
            <div class="card-soft" style="background:#0f172a; color:#fff; text-align:center; padding:2.5mm;">
              <strong style="font-size:10px;">LIST</strong>
            </div>
            <div class="card-soft" style="background:#f87171; color:#fff; text-align:center; padding:2.5mm;">
              <strong style="font-size:10px;">MATRIX</strong>
            </div>
            <div class="card-soft" style="background:#eab308; color:#000; text-align:center; padding:2.5mm;">
              <strong style="font-size:10px;">CHART</strong>
            </div>
          </div>
        </div>

        <div class="card-soft" style="border-left:3px solid #f87171;">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#f87171; text-transform:uppercase; font-weight:700; display:block; margin-bottom:2mm;">SSRS TOPIC REGISTER</span>
          <ul>
            <li>Tabular Reports</li>
            <li>List Reports</li>
            <li>Matrix Reports</li>
            <li>Chart Reports</li>
            <li>Parameterized Reports</li>
            <li>Drilldown Reports</li>
            <li>DrillThrough Reports</li>
            <li>Constructing data sources and Datasets</li>
          </ul>
        </div>
      </div>

      <div class="navy-callout">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block; margin-bottom:1mm;">REPORTING THREAD</span>
        <h4>Construct data sources and datasets, then build reports that support scanning, comparison, parameters, and navigation.</h4>
        <p>Tabular &bull; List &bull; Matrix &bull; Chart &bull; Parameterized &bull; Drilldown &bull; DrillThrough</p>
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>11</span>
    </div>
  </div>

  <!-- ==================== PAGE 12: COMPLETE REGISTER (12) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>12 / COMPLETE REGISTER</span>
    </div>

    <div>
      <div class="section-tag">12 / COMPLETE REGISTER</div>
      <h1 class="page-title">Topic coverage at a glance</h1>
      <p class="page-desc">A compact cross-track index showing how the training syllabus moves from platform fundamentals to practical delivery.</p>

      <table class="topic-table" style="margin-bottom: 4mm;">
        <thead>
          <tr>
            <th style="width: 18%;">MODULE</th>
            <th style="width: 32%;">FOCUS</th>
            <th style="width: 15%;">TOPICS</th>
            <th>HIGHLIGHTS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong style="color:#0d9488;">SSIS 01</strong></td>
            <td>Foundations + data flow</td>
            <td><strong>9 topics</strong></td>
            <td>SSIS Architecture, Data Warehouse, ETL entities, tools…</td>
          </tr>
          <tr>
            <td><strong style="color:#f87171;">SSIS 02</strong></td>
            <td>Sources + transformations</td>
            <td><strong>21 topics</strong></td>
            <td>Excel, Flat File, OLE DB, Multicast, Derived Column…</td>
          </tr>
          <tr>
            <td><strong style="color:#005a9e;">SSIS 03</strong></td>
            <td>Advanced data flow</td>
            <td><strong>12 topics</strong></td>
            <td>Lookup, Merge, SCD, Pivot, Fuzzy Lookup/Grouping…</td>
          </tr>
          <tr>
            <td><strong style="color:#d97706;">SSIS 04</strong></td>
            <td>Control flow + tasks</td>
            <td><strong>13 topics</strong></td>
            <td>Execute SQL, Bulk Insert, File System, Precedence…</td>
          </tr>
          <tr>
            <td><strong style="color:#107c41;">SSIS 05</strong></td>
            <td>Containers + resilience</td>
            <td><strong>15 topics</strong></td>
            <td>For Loop, ForEach Loop, Sequence, Variables, Logging…</td>
          </tr>
          <tr>
            <td><strong style="color:#091e36;">SSIS 06</strong></td>
            <td>Deployment + management</td>
            <td><strong>5 topics</strong></td>
            <td>Configurations, SSIS Service, SSMS, SQL Agent…</td>
          </tr>
          <tr>
            <td><strong style="color:#0078d4;">SSAS</strong></td>
            <td>Foundations + intermediate</td>
            <td><strong>15 topics</strong></td>
            <td>Cubes, TabularModel, SSDT, KPIs, Perspectives, Translations…</td>
          </tr>
          <tr>
            <td><strong style="color:#e11d48;">SSRS</strong></td>
            <td>Basic reports</td>
            <td><strong>8 topics</strong></td>
            <td>Tabular, List, Matrix, Chart, Drilldown, Parameters…</td>
          </tr>
        </tbody>
      </table>

      <div class="dark-bar" style="font-size:8.5px;">
        SOURCE TOPICS RETAINED &bull; TRUE DUPLICATES CONSOLIDATED &bull; NO UNSUPPORTED CLAIMS ADDED
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>12</span>
    </div>
  </div>

  <!-- ==================== PAGE 13: PROJECTS (13) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · MSBI</span>
      <span>13 / PROJECTS / PRACTICAL THREAD</span>
    </div>

    <div>
      <div class="section-tag">13 / PROJECTS / PRACTICAL THREAD</div>
      <h1 class="page-title">Use the full stack</h1>
      <p class="page-desc">The source syllabus closes with Projects. This page positions the supplied SSIS, SSAS, and SSRS topics as one connected training path.</p>

      <div class="grid-3" style="margin-bottom: 4mm;">
        <div class="card-soft" style="text-align:center; border-top:3px solid #0d9488;">
          <div class="circle-num c-teal" style="margin:0 auto 2mm;">01</div>
          <strong style="font-size:12px; color:#0d9488; display:block;">SSIS</strong>
          <span style="font-size:9.5px; color:#64748b;">Integration topics</span>
        </div>
        <div class="card-soft" style="text-align:center; border-top:3px solid #0f172a;">
          <div class="circle-num c-navy" style="margin:0 auto 2mm;">02</div>
          <strong style="font-size:12px; color:#0f172a; display:block;">SSAS</strong>
          <span style="font-size:9.5px; color:#64748b;">Analytical topics</span>
        </div>
        <div class="card-soft" style="text-align:center; border-top:3px solid #f87171;">
          <div class="circle-num c-coral" style="margin:0 auto 2mm;">03</div>
          <strong style="font-size:12px; color:#f87171; display:block;">SSRS</strong>
          <span style="font-size:9.5px; color:#64748b;">Reporting topics</span>
        </div>
      </div>

      <div class="card-soft" style="margin-bottom:3.5mm;">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#0d9488; font-weight:700; text-transform:uppercase; display:block; margin-bottom:2mm;">TRAINING THREAD</span>
        <div style="display:flex; flex-direction:column; gap:2mm;">
          <div style="display:grid; grid-template-columns:auto 1fr; gap:3mm; align-items:flex-start;">
            <strong style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; color:#0d9488; min-width:22mm;">INTEGRATE</strong>
            <span style="font-size:9.5px; color:#475569;">SSIS topics: sources, transformations, data flow, control flow, variables, logging, deployment.</span>
          </div>
          <div style="display:grid; grid-template-columns:auto 1fr; gap:3mm; align-items:flex-start;">
            <strong style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; color:#0f172a; min-width:22mm;">MODEL</strong>
            <span style="font-size:9.5px; color:#475569;">SSAS topics: data sources, views, cubes, tabular models, KPIs, actions, perspectives, and more.</span>
          </div>
          <div style="display:grid; grid-template-columns:auto 1fr; gap:3mm; align-items:flex-start;">
            <strong style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; color:#f87171; min-width:22mm;">REPORT</strong>
            <span style="font-size:9.5px; color:#475569;">SSRS topics: tabular, list, matrix, chart, parameters, drilldown, drillthrough, data sources, datasets.</span>
          </div>
        </div>
      </div>

      <div class="dark-bar">
        PROJECTS / SSIS &rarr; SSAS &rarr; SSRS
      </div>
    </div>

    <div class="doc-footer">
      <span>MSBI / TRAINING COURSE SYLLABUS</span>
      <span>13</span>
    </div>
  </div>

  <!-- ==================== PAGE 14: CLOSING (14) ==================== -->
  <div class="page page-cover">
    <div>
      <div class="brand-badge">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
      </div>

      <div class="cover-pill">MSBI / TOPIC-COMPLETE TRAINING COURSE</div>
      <div class="cover-h1">Ready to build<br>the stack.</div>
      
      <p class="cover-desc" style="font-size:16px;">
        SSIS for integration.<br>
        SSAS for analysis.<br>
        SSRS for reporting.
      </p>

      <div class="tag-practical">100% PRACTICAL CLASSES</div>

      <div style="display:flex; gap:3mm; margin-bottom: 8mm;">
        <div class="cover-stack-card ssis" style="min-width:32mm; text-align:center;">
          <strong>SSIS</strong>
          <span>Integration</span>
        </div>
        <div class="cover-stack-card ssas" style="min-width:32mm; text-align:center;">
          <strong>SSAS</strong>
          <span>Analysis</span>
        </div>
        <div class="cover-stack-card ssrs" style="min-width:32mm; text-align:center;">
          <strong>SSRS</strong>
          <span>Reporting</span>
        </div>
      </div>

      <div class="navy-callout" style="max-width: 140mm; margin:0;">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#2dd4bf; text-transform:uppercase; display:block; margin-bottom:1mm;">COURSE DOCUMENT CLOSE</span>
        <p>A complete training syllabus built from the supplied MSBI topics.</p>
      </div>
    </div>

    <div class="doc-footer" style="border-top-color:rgba(255,255,255,0.15); color:#94a3b8;">
      <span>Source coverage retained; duplicate entries consolidated only where they repeated.</span>
      <span>RPAVault.com</span>
    </div>
  </div>

</body>
</html>`;

async function generatePdf() {
  const tempHtmlPath = path.join(__dirname, 'temp_msbi_syllabus.html');
  const msbiPdfPath = path.join(__dirname, '..', 'assets', 'docs', 'msbi-syllabus.pdf');
  const siteMsbiPdfPath = path.join(__dirname, '..', '_site', 'assets', 'docs', 'msbi-syllabus.pdf');

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  console.log('[MSBI PDF Generator] Launching browser...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto('file://' + tempHtmlPath, { waitUntil: 'networkidle0' });

  console.log('[MSBI PDF Generator] Printing to PDF...');
  await page.pdf({
    path: msbiPdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  if (fs.existsSync(path.dirname(siteMsbiPdfPath))) {
    fs.copyFileSync(msbiPdfPath, siteMsbiPdfPath);
  }

  await browser.close();
  fs.unlinkSync(tempHtmlPath);

  const stats = fs.statSync(msbiPdfPath);
  console.log(`[MSBI PDF Generator] Success! Generated ${msbiPdfPath} (${stats.size} bytes).`);
}

generatePdf().catch(err => {
  console.error('[MSBI PDF Generator] Error generating PDF:', err);
  process.exit(1);
});
