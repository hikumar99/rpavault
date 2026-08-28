const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SQL Server & T-SQL Training - Course Guide - RPA Vault</title>
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
    color: #0058b0;
    text-transform: uppercase;
    margin-bottom: 5mm;
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
    color: #0058b0;
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
    color: #0058b0;
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

  /* CARDS & GRIDS */
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3.5mm;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm;
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

  /* DARK NAVY CALLOUTS */
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

  /* PRACTICAL BUILD CALLOUT */
  .build-box {
    background: #f0fdf4;
    border: 1.2px solid #bbf7d0;
    border-radius: 3mm;
    padding: 3mm 4mm;
    font-size: 9.5px;
    line-height: 1.5;
    color: #14532d;
    margin: 3.5mm 0;
  }
  .build-box strong {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    color: #166534;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: inline-block;
    margin-right: 2mm;
  }

  /* STEP BOXES */
  .step-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(30mm, 1fr));
    gap: 3mm;
  }
  .step-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 3mm;
    padding: 3mm 3.5mm;
  }
  .step-card h4 {
    font-family: 'Sora', sans-serif;
    font-size: 10.5px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 1mm 0;
  }
  .step-card p {
    font-size: 9px;
    line-height: 1.4;
    color: #64748b;
    margin: 0;
  }

  /* STAGES LIST & SKILL STACK (PAGE 2) */
  .stages-layout {
    display: grid;
    grid-template-columns: 1.6fr 1fr;
    gap: 4mm;
    margin-bottom: 3.5mm;
  }
  .stage-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 2.5mm;
    padding: 2.5mm 3.5mm;
    margin-bottom: 2mm;
  }
  .stage-item:last-child {
    margin-bottom: 0;
  }
  .stage-item h4 {
    font-family: 'Sora', sans-serif;
    font-size: 10.5px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 1mm 0;
  }
  .stage-item h4 span {
    color: #0058b0;
    font-family: 'IBM Plex Mono', monospace;
  }
  .stage-item p {
    font-size: 9px;
    line-height: 1.4;
    color: #64748b;
    margin: 0;
  }

  .skill-stack {
    background: linear-gradient(145deg, #091e36 0%, #031326 100%);
    border-radius: 3mm;
    padding: 4mm;
    color: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .skill-stack h3 {
    font-family: 'Sora', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 3mm 0;
  }
  .stack-row {
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 2mm;
    margin-bottom: 2mm;
  }
  .stack-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 0;
  }
  .stack-row strong {
    display: block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    color: #38bdf8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5mm;
  }
  .stack-row span {
    font-size: 8.5px;
    color: #cbd5e1;
  }

  .pipeline-bar {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2mm;
    margin: 3mm 0;
  }
  .pipeline-col {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 2mm;
    padding: 2mm 2.5mm;
  }
  .pipeline-col strong {
    display: block;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    color: #0058b0;
    margin-bottom: 1mm;
  }
  .pipeline-col p {
    font-size: 8px;
    line-height: 1.35;
    color: #475569;
    margin: 0;
  }

  /* OUTCOME CALLOUT WITH BLUE ACCENT */
  .outcome-bar {
    border-left: 3px solid #0058b0;
    background: #f0f9ff;
    padding: 2.5mm 3.5mm;
    border-radius: 0 2mm 2mm 0;
    font-size: 9.5px;
    line-height: 1.45;
    color: #0f172a;
    margin-top: 3mm;
  }
  .outcome-bar strong {
    color: #004182;
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
    font-size: 44px;
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
    background: #0058b0;
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
      <div class="cover-badge">100% PRACTICAL SQL SERVER TRAINING</div>
      <h1>SQL Server<br>&amp; T-SQL<br>Training</h1>
      <p class="lead">Build the database foundation, query fluency, and programming discipline required to work confidently with relational data.</p>
      
      <div class="series-txt">
        <strong>RPA Vault Learning Series</strong>
        SQL Server · T-SQL · Query Design · Database Programming
      </div>

      <div class="cover-btn-row">
        <span class="cover-btn cover-btn-primary">Explore RPA Vault →</span>
        <span class="cover-btn cover-btn-outline">Talk to an Expert →</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 2: OVERVIEW (01) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT</span>
      <span>CURRICULUM MAP</span>
    </div>

    <div>
      <div class="section-tag">THE COMPLETE SQL AND T-SQL LEARNING PATH</div>
      <h1 class="page-title">From your first SQL connection to reusable database logic.</h1>
      <p class="page-desc">The syllabus is structured as a practical progression. Each stage builds directly on the objects, statements, and query patterns introduced before it.</p>

      <div class="stages-layout">
        <div>
          <div class="stage-item">
            <h4><span>01 —</span> Work inside SQL Server</h4>
            <p>Connect to Server; navigate SQL Server Management Studio, Object Explorer, Object Explorer Details, and Query Editor.</p>
          </div>
          <div class="stage-item">
            <h4><span>02 —</span> Define reliable structures</h4>
            <p>Learn T-SQL foundations, DDL, database and table creation, alteration and deletion, data types, constraints, primary keys, and foreign keys.</p>
          </div>
          <div class="stage-item">
            <h4><span>03 —</span> Create and retrieve records</h4>
            <p>Use INSERT, IDENTITY, INSERT…SELECT, UPDATE, DELETE, TRUNCATE, SELECT, WHERE, ORDER BY, DISTINCT, aliases, and common filters.</p>
          </div>
          <div class="stage-item">
            <h4><span>04 —</span> Analyze relationships and results</h4>
            <p>Use functions, groups, HAVING, OVER/PARTITION BY, ranking, CTEs, TOP, operators, subqueries, set operators, and joins.</p>
          </div>
          <div class="stage-item">
            <h4><span>05 —</span> Package database capability</h4>
            <p>Understand clustered/nonclustered indexes, views, cursors, stored procedures, user-defined functions, and triggers.</p>
          </div>
        </div>

        <div class="skill-stack">
          <h3>Skill stack</h3>
          <div class="stack-row">
            <strong>Design</strong>
            <span>Database · Table · Types · Keys</span>
          </div>
          <div class="stack-row">
            <strong>Manipulate</strong>
            <span>Insert · Update · Delete · Truncate</span>
          </div>
          <div class="stack-row">
            <strong>Query</strong>
            <span>Select · Filter · Group · Join</span>
          </div>
          <div class="stack-row">
            <strong>Program</strong>
            <span>View · Procedure · Function · Trigger</span>
          </div>
        </div>
      </div>

      <div class="grid-3" style="margin-bottom: 3mm;">
        <div class="card-soft">
          <h4>Database objects</h4>
          <p>Database creation, alteration, deletion, tables, and data types.</p>
        </div>
        <div class="card-soft">
          <h4>Integrity rules</h4>
          <p>Constraints, primary keys, and foreign-key relationships.</p>
        </div>
        <div class="card-soft">
          <h4>Data changes</h4>
          <p>INSERT, IDENTITY, INSERT…SELECT, UPDATE, DELETE, and TRUNCATE.</p>
        </div>
        <div class="card-soft">
          <h4>Result filtering</h4>
          <p>SELECT, WHERE, BETWEEN, IN, LIKE, IS NULL, aliases, DISTINCT, and ORDER BY.</p>
        </div>
        <div class="card-soft">
          <h4>Analytical queries</h4>
          <p>Functions, GROUP BY, HAVING, window functions, ranking, CTEs, and TOP.</p>
        </div>
        <div class="card-soft">
          <h4>Reusable programming</h4>
          <p>Indexes, views, cursors, procedures, functions, and triggers.</p>
        </div>
      </div>

      <div class="pipeline-bar">
        <div class="pipeline-col">
          <strong>Workspace</strong>
          <p>SSMS, Object Explorer, Query Editor</p>
        </div>
        <div class="pipeline-col">
          <strong>DDL</strong>
          <p>Databases, tables, types, constraints</p>
        </div>
        <div class="pipeline-col">
          <strong>DML &amp; DQL</strong>
          <p>Insert, update, select, filters, sorting</p>
        </div>
        <div class="pipeline-col">
          <strong>Analysis</strong>
          <p>Functions, groups, windows, CTEs, joins</p>
        </div>
        <div class="pipeline-col">
          <strong>Programming</strong>
          <p>Indexes, views, cursors, procedures, UDFs, triggers</p>
        </div>
      </div>

      <div style="margin-top:2mm;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5mm;">
          <strong style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#0f172a; text-transform:uppercase;">Applied learning sequence:</strong>
        </div>
        <div class="step-grid">
          <div class="step-card">
            <h4 style="color:#0058b0;">Model</h4>
            <p>Create tables, choose data types, and enforce integrity with primary and foreign keys.</p>
          </div>
          <div class="step-card">
            <h4 style="color:#0058b0;">Populate</h4>
            <p>Insert and update records, then move data between tables through INSERT…SELECT.</p>
          </div>
          <div class="step-card">
            <h4 style="color:#0058b0;">Query</h4>
            <p>Filter, group, join, rank, and package results into reusable database components.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/courses/">Discuss the SQL learning pathway with RPA Vault →</a>
      <span>01</span>
    </div>
  </div>

  <!-- ==================== PAGE 3: MODULE 01 (01) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">MODULE 01</span>
      <span>SQL SERVER FOUNDATION · DDL + DML</span>
    </div>

    <div>
      <div class="section-tag">ENVIRONMENT, OBJECTS &amp; DATA MANIPULATION</div>
      <h1 class="page-title">Build the structure before you query the data.</h1>
      <p class="page-desc">Establish the environment, database objects, data types, and integrity rules that make later SQL work reliable and understandable. This module covers both database design and maintenance statements.</p>

      <div class="grid-2" style="margin-bottom: 3.5mm;">
        <div class="card-soft">
          <h4>SQL Server workspace</h4>
          <p>Connect to the server, navigate Object Explorer, inspect details, and use Query Editor to create, run, and refine T-SQL statements.</p>
        </div>
        <div class="card-soft">
          <h4>Database and table DDL</h4>
          <p>Create, alter, and delete databases and tables. Select data types that fit the information being stored.</p>
        </div>
        <div class="card-soft">
          <h4>Constraints and integrity</h4>
          <p>Use a primary key to identify a record and a foreign key to enforce the relationship between related tables.</p>
        </div>
        <div class="card-soft">
          <h4>Insert and identity</h4>
          <p>Add records with INSERT, use IDENTITY when an automatically generated value is appropriate, and create/populate a table from another table.</p>
        </div>
        <div class="card-soft">
          <h4>Change and remove rows</h4>
          <p>Use UPDATE for targeted modification. Compare DELETE and TRUNCATE so the scope and effect of a removal action is understood.</p>
        </div>
        <div class="card-soft">
          <h4>Move data between tables</h4>
          <p>Use INSERT…SELECT patterns to add rows from one table to another with a clear source and destination.</p>
        </div>
      </div>

      <div class="build-box">
        <strong>PRACTICAL BUILD:</strong> Create two related tables &rarr; define types, primary key, and foreign key &rarr; insert records &rarr; copy selected records to a second table &rarr; update one value &rarr; explain the difference between DELETE and TRUNCATE.
      </div>

      <div class="step-grid" style="margin-top: 3mm;">
        <div class="step-card">
          <h4>1. Design</h4>
          <p>Name tables and columns, assign data types, and identify the field that must stay unique.</p>
        </div>
        <div class="step-card">
          <h4>2. Relate</h4>
          <p>Use a foreign key to connect the two tables and test the integrity rule with valid and invalid values.</p>
        </div>
        <div class="step-card">
          <h4>3. Maintain</h4>
          <p>Populate rows, update a selected record, create a copy using INSERT…SELECT, and explain a safe deletion decision.</p>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/course/sql-server-masterclass/">Learn SQL Server with RPA Vault →</a>
      <span>01</span>
    </div>
  </div>

  <!-- ==================== PAGE 4: MODULE 02 (02) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT</span>
      <span>MODULE 02 · DQL &amp; ANALYTICS</span>
    </div>

    <div>
      <div class="section-tag">QUERY WITH PRECISION</div>
      <h1 class="page-title">Retrieve, refine, summarize, and compare.</h1>
      <p class="page-desc">This phase turns table data into useful information through filters, grouping, analytical functions, reusable query logic, and relational joins.</p>

      <div class="grid-2" style="margin-bottom: 3.5mm;">
        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0058b0; display:block; margin-bottom:1mm;">01 · SELECT &amp; FILTER</span>
          <h4>Shape the right result set</h4>
          <ul>
            <li>SELECT and column aliases</li>
            <li>WHERE and SQL operators</li>
            <li>BETWEEN…AND, IN, LIKE, IS NULL</li>
            <li>DISTINCT and ORDER BY</li>
          </ul>
        </div>

        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0058b0; display:block; margin-bottom:1mm;">02 · GROUP &amp; ANALYZE</span>
          <h4>Find the pattern in the data</h4>
          <ul>
            <li>Aggregate functions</li>
            <li>GROUP BY and HAVING</li>
            <li>OVER (PARTITION BY …)</li>
            <li>Ranking functions and TOP n</li>
          </ul>
        </div>

        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0058b0; display:block; margin-bottom:1mm;">03 · REUSE LOGIC</span>
          <h4>Break a complex question into steps</h4>
          <ul>
            <li>Common Table Expressions</li>
            <li>Subqueries</li>
            <li>Operators inside expressions</li>
            <li>Intermediate query results</li>
          </ul>
        </div>

        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0058b0; display:block; margin-bottom:1mm;">04 · CONNECT &amp; COMPARE</span>
          <h4>Work across tables and result sets</h4>
          <ul>
            <li>INNER, OUTER, LEFT, RIGHT, FULL, CROSS joins</li>
            <li>UNION and UNION ALL</li>
            <li>INTERSECT and EXCEPT</li>
            <li>Join keys and null-aware output</li>
          </ul>
        </div>
      </div>

      <div class="build-box">
        <strong>PRACTICAL BUILD:</strong> Write a SELECT query &rarr; filter with WHERE, LIKE, and IS NULL &rarr; group and apply HAVING &rarr; rank rows within a partition &rarr; move the logic into a CTE &rarr; join a second table &rarr; compare results with UNION ALL or EXCEPT.
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/contact/">Talk to RPA Vault about structured SQL learning →</a>
      <span>02</span>
    </div>
  </div>

  <!-- ==================== PAGE 5: MODULE 03 (03) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT</span>
      <span>MODULE 03 · SQL PROGRAMMING</span>
    </div>

    <div>
      <div class="section-tag">PERFORMANCE, REUSE &amp; CONTROL</div>
      <h1 class="page-title">Move beyond one-off queries.</h1>
      <p class="page-desc">The final technical stage covers objects that support controlled data access, reusable logic, and well-organized database behavior.</p>

      <div class="grid-2" style="margin-bottom: 3.5mm;">
        <div class="navy-callout" style="margin:0; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <h4 style="font-size:14px; margin-bottom:2mm;">Build a database layer that can be understood and reused.</h4>
            <p style="margin-bottom:3mm;">Students learn the role of indexes, views, procedures, functions, cursors, and triggers—then connect those components into a clear database project narrative.</p>
          </div>
          <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); border-radius:2mm; padding:2.5mm 3mm;">
            <strong style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#38bdf8; text-transform:uppercase; display:block; margin-bottom:1mm;">CAPSTONE DIRECTION</strong>
            <p style="font-size:8.5px; line-height:1.4; color:#cbd5e1; margin:0;">Create a small database; populate it; build joined reporting queries; add a view or stored procedure; and explain how the object design supports reliable access and maintenance.</p>
          </div>
        </div>

        <div class="card-soft" style="display:flex; flex-direction:column; gap:2mm;">
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">Clustered &amp; NonClustered Index</strong>
            <span style="font-size:8.5px; color:#64748b;">Understand table data organization vs separate query access paths.</span>
          </div>
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">Views</strong>
            <span style="font-size:8.5px; color:#64748b;">Create reusable query-based representations of data for simplified access or reporting.</span>
          </div>
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">Stored Procedures</strong>
            <span style="font-size:8.5px; color:#64748b;">Package repeatable database actions behind a named interface.</span>
          </div>
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">User Defined Functions</strong>
            <span style="font-size:8.5px; color:#64748b;">Create reusable logic that returns a single value or table result.</span>
          </div>
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">Cursors &amp; Triggers</strong>
            <span style="font-size:8.5px; color:#64748b;">Understand row-by-row processing and event-driven behavior.</span>
          </div>
        </div>
      </div>

      <div class="grid-3" style="margin-bottom: 3.5mm;">
        <div class="card-soft">
          <h4 style="color:#0058b0;">Read</h4>
          <p>Use indexes and well-structured queries to consider how data is accessed and retrieved.</p>
        </div>
        <div class="card-soft">
          <h4 style="color:#0058b0;">Reuse</h4>
          <p>Use views, stored procedures, and user-defined functions to package logic for later use.</p>
        </div>
        <div class="card-soft">
          <h4 style="color:#0058b0;">Respond</h4>
          <p>Use cursors and triggers with intent when row-by-row or event-driven behavior is required.</p>
        </div>
      </div>

      <div class="grid-3" style="margin-bottom: 3.5mm;">
        <div class="card-soft">
          <h4>Design discipline</h4>
          <p>Keep object names, data relationships, and query intent clear for the next reviewer.</p>
        </div>
        <div class="card-soft">
          <h4>Performance awareness</h4>
          <p>Consider indexes alongside query design when choosing how data will be retrieved.</p>
        </div>
        <div class="card-soft">
          <h4>Reusable delivery</h4>
          <p>Use views, procedures, functions, and triggers to package logic intentionally.</p>
        </div>
      </div>

      <div>
        <strong style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#0f172a; text-transform:uppercase; display:block; margin-bottom:1.5mm;">Project delivery brief:</strong>
        <div class="step-grid">
          <div class="step-card">
            <h4 style="color:#0058b0;">Model the data</h4>
            <p>Create related tables and apply primary-key and foreign-key integrity.</p>
          </div>
          <div class="step-card">
            <h4 style="color:#0058b0;">Answer questions</h4>
            <p>Use joins, groups, rankings, or subqueries to produce useful output.</p>
          </div>
          <div class="step-card">
            <h4 style="color:#0058b0;">Package the logic</h4>
            <p>Add a view, stored procedure, or user-defined function and explain its purpose.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/courses/">Explore RPA Vault learning pathways →</a>
      <span>03</span>
    </div>
  </div>

  <!-- ==================== PAGE 6: OUTCOMES (04) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT</span>
      <span>OUTCOMES &amp; NEXT STEPS</span>
    </div>

    <div>
      <div class="section-tag">FROM SYLLABUS TO DEMONSTRABLE SKILL</div>
      <h1 class="page-title">What you will be ready to demonstrate.</h1>
      <p class="page-desc">The course connects essential database design to advanced analysis and database programming, producing a practical, explainable SQL project outcome.</p>

      <div class="grid-2" style="margin-bottom: 3.5mm;">
        <div class="grid-2" style="grid-column: 1 / 2; gap: 3mm;">
          <div class="card-soft">
            <h4>Workspace confidence</h4>
            <p>Connect to SQL Server, use SQL Server Management Studio, navigate Object Explorer, and work productively in Query Editor.</p>
          </div>
          <div class="card-soft">
            <h4>Database design</h4>
            <p>Create databases and tables; choose data types; and apply primary/foreign-key constraints that protect relational integrity.</p>
          </div>
          <div class="card-soft">
            <h4>Query fluency</h4>
            <p>Write DML and DQL statements, manage data changes carefully, and create readable SELECT output with targeted filtering and sorting.</p>
          </div>
          <div class="card-soft">
            <h4>Analysis &amp; programming</h4>
            <p>Use functions, groups, windows, CTEs, joins, indexes, views, procedures, functions, cursors, and triggers in a structured project context.</p>
          </div>
        </div>

        <div class="navy-callout" style="margin:0; display:flex; flex-direction:column; justify-content:center;">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; color:#38bdf8; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:2mm;">YOUR NEXT MOVE</span>
          <h4 style="font-size:16px; margin-bottom:2.5mm;">Build a portfolio-ready SQL narrative.</h4>
          <p style="margin-bottom:4mm;">Plan a relational database. Populate it with meaningful records. Query it to answer reporting questions. Package selected logic for reuse. Then explain the design and results clearly.</p>
          <div class="cover-btn-row">
            <span class="cover-btn cover-btn-primary" style="font-size:9.5px; padding:2mm 4mm;">Explore RPA Vault →</span>
            <span class="cover-btn cover-btn-outline" style="font-size:9.5px; padding:2mm 4mm;">Contact Us →</span>
          </div>
        </div>
      </div>

      <div class="step-grid" style="margin-bottom: 3.5mm;">
        <div class="step-card">
          <h4>1. Design</h4>
          <p>Create a database, tables, types, and integrity rules that model a business situation.</p>
        </div>
        <div class="step-card">
          <h4>2. Populate</h4>
          <p>Insert, update, copy, and maintain records while making deliberate change decisions.</p>
        </div>
        <div class="step-card">
          <h4>3. Analyze</h4>
          <p>Filter, group, rank, join, and compare data to answer a focused reporting question.</p>
        </div>
        <div class="step-card">
          <h4>4. Package</h4>
          <p>Use a view or programmable object to present a reusable database solution.</p>
        </div>
      </div>

      <div class="card-soft" style="background:#f0f9ff; border-color:#bae6fd; display:flex; justify-content:space-between; align-items:center; padding:3mm 4.5mm;">
        <div>
          <strong style="font-size:10.5px; color:#004182; display:block; margin-bottom:0.5mm;">Ready to start?</strong>
          <span style="font-size:9px; color:#475569;">Explore RPA Vault learning pathways or contact the team to discuss the SQL Server &amp; T-SQL course.</span>
        </div>
        <div style="display:flex; gap:2mm;">
          <span class="cover-btn cover-btn-primary" style="font-size:9px; padding:1.5mm 3.5mm;">Explore RPA Vault →</span>
          <span class="cover-btn cover-btn-outline" style="font-size:9px; padding:1.5mm 3.5mm; border-color:#0058b0; color:#0058b0;">Contact RPA Vault →</span>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/contact">rpavault.com/contact</a>
      <span>04</span>
    </div>
  </div>

  <!-- ==================== PAGE 7: CLOSING ==================== -->
  <div class="page page-closing">
    <div>
      <div class="brand-logo-txt">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        RPA Vault
      </div>

      <div class="section-tag" style="color:#38bdf8;">RPA VAULT LEARNING SERIES</div>
      <h1 style="font-family:'Sora',sans-serif; font-size:36px; font-weight:800; color:#ffffff; line-height:1.2; margin:0 0 4mm 0;">Build the language behind reliable data decisions.</h1>
      <p style="font-size:14px; color:#cbd5e1; line-height:1.6; max-width:140mm; margin:0 0 10mm 0;">Explore practical technology learning pathways and connect with RPA Vault to discuss the next step in your SQL Server and T-SQL journey.</p>

      <div class="closing-card">
        <h3>Ready to build practical SQL skills?</h3>
        <p>Review RPA Vault learning options, discuss your course requirements, and choose a structured pathway for your technical goals.</p>
        <div class="cover-btn-row">
          <span class="cover-btn cover-btn-primary">Explore RPA Vault →</span>
          <span class="cover-btn cover-btn-outline">Contact RPA Vault →</span>
        </div>
      </div>
    </div>

    <div class="doc-footer" style="border-top-color:rgba(255,255,255,0.15); color:#94a3b8;">
      <span>rpavault.com</span>
      <span>rpavault.com/contact</span>
    </div>
  </div>

</body>
</html>`;

const puppeteer = require('puppeteer');

async function generatePdf() {
  const tempHtmlPath = path.join(__dirname, 'temp_sql_syllabus.html');
  const sqlServerPdfPath = path.join(__dirname, '..', 'assets', 'docs', 'sql-server-syllabus.pdf');
  const sqlPdfPath = path.join(__dirname, '..', 'assets', 'docs', 'sql-syllabus.pdf');
  const siteSqlServerPdfPath = path.join(__dirname, '..', '_site', 'assets', 'docs', 'sql-server-syllabus.pdf');
  const siteSqlPdfPath = path.join(__dirname, '..', '_site', 'assets', 'docs', 'sql-syllabus.pdf');

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  console.log('[SQL PDF Generator] Launching browser...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto('file://' + tempHtmlPath, { waitUntil: 'networkidle0' });

  console.log('[SQL PDF Generator] Printing to PDF...');
  await page.pdf({
    path: sqlServerPdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  // Copy to sql-syllabus.pdf and _site folders
  fs.copyFileSync(sqlServerPdfPath, sqlPdfPath);
  if (fs.existsSync(path.dirname(siteSqlServerPdfPath))) {
    fs.copyFileSync(sqlServerPdfPath, siteSqlServerPdfPath);
    fs.copyFileSync(sqlServerPdfPath, siteSqlPdfPath);
  }

  await browser.close();
  fs.unlinkSync(tempHtmlPath);

  const stats = fs.statSync(sqlServerPdfPath);
  console.log(`[SQL PDF Generator] Success! Generated ${sqlServerPdfPath} (${stats.size} bytes).`);
}

generatePdf().catch(err => {
  console.error('[SQL PDF Generator] Error generating PDF:', err);
  process.exit(1);
});
