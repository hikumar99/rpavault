const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Azure Data Engineering Course Guide - RPA Vault</title>
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
    color: #0078d4;
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
    color: #0078d4;
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
    color: #0078d4;
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

  /* FLOW PIPELINE BOXES */
  .flow-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    gap: 2mm;
    align-items: center;
    margin: 3mm 0;
  }
  .flow-card {
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 3mm;
    padding: 3mm 3.5mm;
  }
  .flow-card h4 {
    font-family: 'Sora', sans-serif;
    font-size: 11px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 1mm 0;
  }
  .flow-card p {
    font-size: 8.5px;
    line-height: 1.35;
    color: #64748b;
    margin: 0;
  }
  .flow-arrow {
    font-size: 14px;
    color: #0078d4;
    font-weight: 700;
    text-align: center;
  }

  /* OUTCOME CALLOUT WITH BLUE ACCENT */
  .outcome-bar {
    border-left: 3px solid #0078d4;
    background: #f0f9ff;
    padding: 2.5mm 3.5mm;
    border-radius: 0 2mm 2mm 0;
    font-size: 9.5px;
    line-height: 1.45;
    color: #0f172a;
    margin-top: 3mm;
  }
  .outcome-bar strong {
    color: #005a9e;
  }

  /* SERVICE BADGES (SQL, ST, DL) */
  .badge-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    color: #0078d4;
    background: #e0f2fe;
    margin-bottom: 2mm;
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
  .page-cover .top-meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6mm;
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
  }
  .page-cover .time-badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 700;
    color: #cbd5e1;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 2mm 4mm;
    border-radius: 99px;
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
    background: #0078d4;
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

      <div class="top-meta-row">
        <div class="cover-badge">AZURE DATA ENGINEERING</div>
        <div class="time-badge">40 DAYS · 1 HOUR / DAY</div>
      </div>

      <h1>Design the data<br>systems behind<br>better decisions.</h1>
      <p class="lead">A focused Azure Data Engineering program covering the platform, the pipeline, and the analytical layer—from SQL and data lakes to Data Factory, Databricks, Synapse, and Power BI.</p>
      
      <div class="series-txt">
        <strong>RPA Vault Learning Series</strong>
        Azure · SQL · Data Factory · Databricks · Synapse · Power BI
      </div>

      <div class="cover-btn-row">
        <span class="cover-btn cover-btn-primary">Talk to a Course Advisor →</span>
        <span class="cover-btn cover-btn-outline">Explore RPA Vault →</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 2: BLUEPRINT (01) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · AZURE DATA ENGINEERING</span>
      <span>PROGRAM BLUEPRINT</span>
    </div>

    <div>
      <div class="section-tag">THE COMPLETE LEARNING SEQUENCE</div>
      <h1 class="page-title">Follow the data, from source to insight</h1>
      <p class="page-desc">The curriculum is organized around how modern data systems are planned, built, operated, and analyzed. Each phase brings together platform concepts and applied labs.</p>

      <div class="grid-2" style="margin-bottom: 4mm;">
        <div class="card-soft" style="border-top: 3px solid #0078d4;">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0078d4; display:block; margin-bottom:1mm;">01 · FOUNDATIONS</span>
          <h4 style="font-size:13px;">Model the data</h4>
          <p>Build data-warehouse and SQL fluency before working in the cloud.</p>
        </div>

        <div class="card-soft" style="border-top: 3px solid #107c41;">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#107c41; display:block; margin-bottom:1mm;">02 · DATA PLATFORM</span>
          <h4 style="font-size:13px;">Store &amp; govern it</h4>
          <p>Learn the core services that host, protect, and organize enterprise data.</p>
        </div>

        <div class="card-soft" style="border-top: 3px solid #0078d4;">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0078d4; display:block; margin-bottom:1mm;">03 · ORCHESTRATION</span>
          <h4 style="font-size:13px;">Move &amp; transform it</h4>
          <p>Design Data Factory pipelines with activities, triggers, runtime options, and production controls.</p>
        </div>

        <div class="card-soft" style="border-top: 3px solid #107c41;">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#107c41; display:block; margin-bottom:1mm;">04 · ANALYTICS</span>
          <h4 style="font-size:13px;">Scale &amp; analyze it</h4>
          <p>Complete the platform with Databricks, Synapse Analytics, Power BI, and career readiness.</p>
        </div>
      </div>

      <div class="card-soft" style="background:#f1f5f9; border-color:#cbd5e1; margin-bottom:3.5mm;">
        <div style="display:grid; grid-template-columns:1fr auto 1fr auto 1fr auto 1fr; gap:2mm; align-items:center;">
          <div>
            <strong style="font-family:'IBM Plex Mono',monospace; font-size:10px; color:#0078d4; display:block;">Model</strong>
            <span style="font-size:8.5px; color:#475569;">Warehouse architecture, SQL, and business rules.</span>
          </div>
          <div style="color:#0078d4; font-weight:700;">&rarr;</div>
          <div>
            <strong style="font-family:'IBM Plex Mono',monospace; font-size:10px; color:#0078d4; display:block;">Store</strong>
            <span style="font-size:8.5px; color:#475569;">Azure SQL, Storage, secure access, and Data Lake Gen2.</span>
          </div>
          <div style="color:#0078d4; font-weight:700;">&rarr;</div>
          <div>
            <strong style="font-family:'IBM Plex Mono',monospace; font-size:10px; color:#0078d4; display:block;">Orchestrate</strong>
            <span style="font-size:8.5px; color:#475569;">ADF, Databricks, activities, triggers, and production control.</span>
          </div>
          <div style="color:#0078d4; font-weight:700;">&rarr;</div>
          <div>
            <strong style="font-family:'IBM Plex Mono',monospace; font-size:10px; color:#0078d4; display:block;">Analyze</strong>
            <span style="font-size:8.5px; color:#475569;">Synapse, Serverless SQL, Power BI, and career readiness.</span>
          </div>
        </div>
      </div>

      <div class="outcome-bar">
        <strong>Applied by design:</strong> The learning path combines labs, quizzes, interface tours, and realistic data scenarios. Students learn how individual Azure services connect into a dependable end-to-end data platform.
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/courses/">Discuss the course pathway with RPA Vault →</a>
      <span>01</span>
    </div>
  </div>

  <!-- ==================== PAGE 3: MODULE 01 (02) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · AZURE DATA ENGINEERING</span>
      <span>FOUNDATIONS</span>
    </div>

    <div>
      <div class="section-tag">01 · DATA WAREHOUSING, SQL &amp; CLOUD</div>
      <h1 class="page-title">Start with the systems that make data useful</h1>
      <p class="page-desc">Before a pipeline can move data, teams need to understand what data is for, how it is modeled, and where each platform component fits.</p>

      <div class="grid-2" style="margin-bottom: 3.5mm;">
        <div>
          <div class="card-soft" style="margin-bottom:3mm; border-left:3px solid #0078d4;">
            <h4 style="color:#0078d4;">Data warehouse fundamentals</h4>
            <ul>
              <li>Data warehouse introduction, definitions, architecture, and schemas.</li>
              <li>Facts and dimensions: identify the measures and descriptive business context that shape analytical models.</li>
              <li>OLTP vs. OLAP: compare transaction processing with analytical workloads.</li>
            </ul>
          </div>

          <div class="card-soft" style="border-left:3px solid #0078d4;">
            <h4 style="color:#0078d4;">SQL essentials for data work</h4>
            <ul>
              <li>SQL introduction and installation.</li>
              <li>DDL, DML, and DRL command families.</li>
              <li>Inner, left outer, right outer, and full outer joins.</li>
              <li>Select, Case, Switch, and If statements for data selection and business-rule logic.</li>
            </ul>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:2.5mm;">
          <div class="card-soft" style="background:#091e36; color:#ffffff; border-color:#1e3a5f;">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#38bdf8; text-transform:uppercase; display:block; margin-bottom:1mm;">Cloud</span>
            <h4 style="color:#ffffff;">Service models</h4>
            <p style="color:#cbd5e1; margin:0;">Understand IaaS, PaaS, SaaS, and serverless, then explore the Azure Management Portal.</p>
          </div>

          <div class="card-soft" style="background:#005a9e; color:#ffffff; border-color:#004578;">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#bae6fd; text-transform:uppercase; display:block; margin-bottom:1mm;">Role</span>
            <h4 style="color:#ffffff;">Data engineering practice</h4>
            <p style="color:#e0f2fe; margin:0;">Review database-engineering responsibilities, DevOps support for data automation, and the broader data-engineering process.</p>
          </div>

          <div class="card-soft" style="background:#107c41; color:#ffffff; border-color:#0b5a2f;">
            <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#bbf7d0; text-transform:uppercase; display:block; margin-bottom:1mm;">Services</span>
            <h4 style="color:#ffffff;">Azure data landscape</h4>
            <p style="color:#dcfce7; margin:0;">Survey relational and NoSQL databases, storage, ETL, Big Data, and Stream Analytics services.</p>
          </div>
        </div>
      </div>

      <div class="outcome-bar">
        <strong>Foundation outcome:</strong> Students can explain how a warehouse model, SQL logic, cloud service choice, and engineering process fit together before they begin building Azure data solutions.
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/course/azure-data-engineer/">Explore career-focused learning at RPAVault.com →</a>
      <span>02</span>
    </div>
  </div>

  <!-- ==================== PAGE 4: MODULE 02 (03) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · AZURE DATA ENGINEERING</span>
      <span>DATA PLATFORM</span>
    </div>

    <div>
      <div class="section-tag">02 · DATABASE, STORAGE &amp; DATA LAKE</div>
      <h1 class="page-title">Build the secure foundation beneath every pipeline</h1>
      <p class="page-desc">This module brings together the database, storage, security, and recovery capabilities that support reliable cloud data workloads.</p>

      <div class="grid-3" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <div class="badge-icon">SQL</div>
          <h4>Azure SQL Database</h4>
          <ul>
            <li>Hosting options for SQL Server workloads in Azure.</li>
            <li>Create Logical SQL Server and SQL Database.</li>
            <li>Compare DTU and vCore tiers; scale capacity up and down.</li>
            <li>Point-in-time recovery and long-term backup retention.</li>
            <li>Geo-replication for disaster recovery.</li>
          </ul>
        </div>

        <div class="card-soft">
          <div class="badge-icon">ST</div>
          <h4>Azure Storage</h4>
          <ul>
            <li>Create a storage account.</li>
            <li>Create containers and blobs.</li>
            <li>Install and explore Azure Storage Explorer.</li>
            <li>Create SAS tokens and understand scoped, time-bound access.</li>
          </ul>
        </div>

        <div class="card-soft">
          <div class="badge-icon">DL</div>
          <h4>Data Lake Gen2</h4>
          <ul>
            <li>Azure Data Lake overview and architecture.</li>
            <li>Create a Data Lake Store Gen2 through the Portal.</li>
            <li>Manage data with Data Lake Store Gen2.</li>
            <li>Position lake storage for downstream integration and analytics.</li>
          </ul>
        </div>
      </div>

      <div class="navy-callout">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#38bdf8; text-transform:uppercase; letter-spacing:0.08em; display:block; margin-bottom:1mm;">SECURITY &amp; ACCESS</span>
        <h4>Protected data access</h4>
        <p>Configure firewall rules to whitelist required IP addresses at server and database level. Manage sensitive data through Dynamic Data Masking and encryption—then connect storage and data-lake patterns to controlled, scalable access.</p>
      </div>

      <div class="outcome-bar">
        <strong>Platform deliverable:</strong> Students can provision an Azure SQL Database, choose a capacity model, plan recovery and geo-replication, configure controlled access, protect sensitive data, create blob storage with scoped SAS access, and organize data in Data Lake Gen2 for downstream engineering workloads.
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/contact/">Ask a Course Advisor about the Azure learning pathway →</a>
      <span>03</span>
    </div>
  </div>

  <!-- ==================== PAGE 5: MODULE 03 (04) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · AZURE DATA ENGINEERING</span>
      <span>AZURE DATA FACTORY</span>
    </div>

    <div>
      <div class="section-tag">03 · ORCHESTRATION FOUNDATIONS</div>
      <h1 class="page-title">Turn disconnected data into a controlled pipeline</h1>
      <p class="page-desc">Azure Data Factory becomes the operating layer: it connects source and target systems, coordinates activity execution, and makes pipeline status observable.</p>

      <div class="grid-3" style="margin-bottom: 4mm;">
        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0078d4; display:block; margin-bottom:1mm;">STAGE 01</span>
          <h4>Define</h4>
          <p style="font-size:9px; margin-bottom:2mm;">Create an ADF instance and tour the Pipeline, Data Flow, Monitor, Debug, Trigger, and Management Hub interfaces.</p>
          <ul>
            <li>Pipelines</li>
            <li>Linked Services</li>
            <li>Datasets</li>
            <li>Integration Runtime: Azure, Self-Hosted &amp; SSIS</li>
          </ul>
        </div>

        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0078d4; display:block; margin-bottom:1mm;">STAGE 02</span>
          <h4>Execute</h4>
          <p style="font-size:9px; margin-bottom:2mm;">Build the first pipeline for a fictional company's data, then copy data from a Storage Account to Azure SQL Database.</p>
          <ul>
            <li>Lookup &amp; Stored Procedure</li>
            <li>Filter &amp; Get Metadata</li>
            <li>ForEach &amp; Set Variable</li>
            <li>If Condition &amp; Fail</li>
          </ul>
        </div>

        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0078d4; display:block; margin-bottom:1mm;">STAGE 03</span>
          <h4>Extend</h4>
          <p style="font-size:9px; margin-bottom:2mm;">Connect related services and reusable logic to make the pipeline responsive and scalable.</p>
          <ul>
            <li>Logic Apps + Outlook email</li>
            <li>Web Activity validation</li>
            <li>Parameters</li>
            <li>Execute Pipeline / nested pipeline</li>
          </ul>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: 3.5mm;">
        <div class="card-soft" style="background:#f0fdf4; border-color:#bbf7d0;">
          <h4 style="color:#166534;">Lab flow</h4>
          <p style="color:#14532d;">Create the service, build a first pipeline, explore the user experience, model a company’s data need, and move data from cloud storage to Azure SQL Database.</p>
        </div>

        <div class="card-soft" style="background:#f0f9ff; border-color:#bae6fd;">
          <h4 style="color:#0369a1;">Control flow</h4>
          <p style="color:#0c4a6e;">Filter records, retrieve storage blobs, iterate through stored-procedure results, assign variables, branch on a flag, and intentionally raise a controlled pipeline failure.</p>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/course/azure-data-engineer/">Explore practical Azure skills at RPAVault.com →</a>
      <span>04</span>
    </div>
  </div>

  <!-- ==================== PAGE 6: MODULE 04 (05) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · AZURE DATA ENGINEERING</span>
      <span>PRODUCTION PIPELINES &amp; DATABRICKS</span>
    </div>

    <div>
      <div class="section-tag">04 · SCALE, TRANSFORM &amp; DEPLOY</div>
      <h1 class="page-title">Move from a working pipeline to a production-grade one</h1>
      <p class="page-desc">Students extend Data Factory into the patterns required for dependable operations, then introduce Databricks as scalable transformation compute.</p>

      <div class="grid-2" style="margin-bottom: 3.5mm;">
        <div class="navy-callout" style="margin:0; display:flex; flex-direction:column; justify-content:center;">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; color:#38bdf8; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:2mm;">DATA FACTORY IN PRODUCTION</span>
          <h4 style="font-size:16px; margin-bottom:2.5mm;">Trigger, transform, operate &amp; promote.</h4>
          <p>Trigger the right workload, transform it correctly, see what happened, and move it safely between environments.</p>
        </div>

        <div class="card-soft" style="display:flex; flex-direction:column; gap:2mm;">
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">Schedule</strong>
            <span style="font-size:8.5px; color:#64748b;">Use scheduled jobs, Tumbling Window vs standard Schedule triggers, and blob-creation events.</span>
          </div>
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">Transform</strong>
            <span style="font-size:8.5px; color:#64748b;">Mapping Data Flows &amp; Power Query: remove nulls, handle error rows, and shape data.</span>
          </div>
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">Operate</strong>
            <span style="font-size:8.5px; color:#64748b;">Monitor pipeline behavior, optimize performance, and multi-file ingestion into Azure SQL.</span>
          </div>
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">Promote</strong>
            <span style="font-size:8.5px; color:#64748b;">Prepare Data Factory pipelines for multiple environments for repeatable deployments.</span>
          </div>
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">Compute (Databricks)</strong>
            <span style="font-size:8.5px; color:#64748b;">Create Azure Databricks, launch a Spark cluster, transform data using Scala, and develop ETL notebooks.</span>
          </div>
          <div>
            <strong style="font-size:9.5px; color:#0f172a; display:block;">Orchestrate</strong>
            <span style="font-size:8.5px; color:#64748b;">Parameterize Databricks pipelines and invoke them directly from Azure Data Factory.</span>
          </div>
        </div>
      </div>

      <div class="card-soft" style="background:#f1f5f9; border-color:#cbd5e1; padding:3mm 4mm;">
        <strong style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#0078d4; text-transform:uppercase; display:block; margin-bottom:1mm;">Lab progression:</strong>
        <p style="font-size:9px; line-height:1.45; color:#334155; margin:0;">Event-driven pipeline execution &rarr; Data Flow transformations &rarr; error handling &rarr; multi-file ingestion &rarr; performance improvement &rarr; environment promotion &rarr; Databricks ETL integration.</p>
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/courses/">Discuss your data-engineering learning plan with RPA Vault →</a>
      <span>05</span>
    </div>
  </div>

  <!-- ==================== PAGE 7: MODULE 05 (06) ==================== -->
  <div class="page">
    <div class="doc-header">
      <span class="dh-left">RPA VAULT · AZURE DATA ENGINEERING</span>
      <span>SYNAPSE, POWER BI &amp; CAREER PREPARATION</span>
    </div>

    <div>
      <div class="section-tag">05 · ANALYZE, REPORT &amp; EXPLAIN YOUR WORK</div>
      <h1 class="page-title">Bring the data platform together with Azure Synapse Analytics</h1>
      <p class="page-desc">The final technical module connects Lakehouse concepts, serverless analysis, pipeline orchestration, business reporting, and career preparation.</p>

      <div class="grid-2" style="margin-bottom: 3.5mm;">
        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0078d4; display:block; margin-bottom:1mm;">01 · SYNAPSE FOUNDATION</span>
          <h4>Understand the workspace</h4>
          <ul>
            <li>Explore traditional analytics vs Data Lakehouse concepts.</li>
            <li>Dedicated, Serverless &amp; Spark pools.</li>
            <li>Synapse Workspace lab &amp; RBAC permissions.</li>
            <li>Control Node, Compute Node, DMS &amp; sharding patterns.</li>
          </ul>
        </div>

        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0078d4; display:block; margin-bottom:1mm;">02 · SERVERLESS SQL</span>
          <h4>Analyze the lake</h4>
          <ul>
            <li>Overview of SQL Serverless Pools.</li>
            <li>Database and External Tables lab.</li>
            <li>Explore &amp; analyze data with Serverless SQL.</li>
            <li>Build Power BI reports connected to Serverless SQL &amp; Data Lakes.</li>
          </ul>
        </div>

        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0078d4; display:block; margin-bottom:1mm;">03 · SYNAPSE PIPELINES</span>
          <h4>Transform &amp; monitor</h4>
          <ul>
            <li>Overview of Synapse Pipelines and components.</li>
            <li>Transform data with Mapping Data Flows.</li>
            <li>Orchestrate, run &amp; monitor pipelines.</li>
            <li>Quizzes reinforce each technical stage.</li>
          </ul>
        </div>

        <div class="card-soft">
          <span style="font-family:'IBM Plex Mono',monospace; font-size:9.5px; font-weight:700; color:#0078d4; display:block; margin-bottom:1mm;">04 · POWER BI &amp; CAREER</span>
          <h4>Make the work visible</h4>
          <ul>
            <li>Power BI basics, DB/Excel connections &amp; publishing.</li>
            <li>CV preparation and sample role explanation.</li>
            <li>Interview-question preparation.</li>
            <li>Explain an end-to-end project with confidence.</li>
          </ul>
        </div>
      </div>

      <div class="navy-callout">
        <span style="font-family:'IBM Plex Mono',monospace; font-size:9px; color:#38bdf8; text-transform:uppercase; letter-spacing:0.08em; display:block; margin-bottom:1mm;">INSIGHT ROUTE</span>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:3mm;">
          <div>
            <strong style="font-size:9.5px; color:#ffffff; display:block;">Query the lake</strong>
            <p style="font-size:8.5px; color:#cbd5e1; margin:0;">Use serverless SQL, external tables, and Data Lake data to investigate information without first moving it into a traditional database.</p>
          </div>
          <div>
            <strong style="font-size:9.5px; color:#ffffff; display:block;">Make it useful</strong>
            <p style="font-size:8.5px; color:#cbd5e1; margin:0;">Build and publish Power BI reports, then use project stories, CV preparation, and interview practice to communicate the work.</p>
          </div>
        </div>
      </div>

      <div class="outcome-bar">
        <strong>Final outcome:</strong> Students can describe how data is stored, moved, transformed, analyzed, and reported across Azure—and explain the role they played in that solution during CV and interview discussions.
      </div>
    </div>

    <div class="doc-footer">
      <a href="https://rpavault.com/contact/">Explore RPA Vault learning pathways →</a>
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

      <div class="section-tag" style="color:#38bdf8;">YOUR NEXT DATA ENGINEERING MILESTONE</div>
      <h1 style="font-family:'Sora',sans-serif; font-size:36px; font-weight:800; color:#ffffff; line-height:1.2; margin:0 0 4mm 0;">Turn your learning into an Azure data-engineering path.</h1>
      <p style="font-size:14px; color:#cbd5e1; line-height:1.6; max-width:140mm; margin:0 0 10mm 0;">Explore the RPA Vault learning ecosystem or speak with a course advisor about your technical background, goals, and the best next step.</p>

      <div class="closing-card">
        <h3>Ready to start building?</h3>
        <p>Get course guidance, understand the learning pathway, and move closer to practical Azure Data Engineering capability.</p>
        <div class="cover-btn-row">
          <span class="cover-btn cover-btn-primary">Explore RPA Vault →</span>
          <span class="cover-btn cover-btn-outline">Contact a Course Advisor →</span>
        </div>
      </div>
    </div>

    <div class="doc-footer" style="border-top-color:rgba(255,255,255,0.15); color:#94a3b8;">
      <span>RPAVault.com</span>
      <span>rpavault.com/contact</span>
    </div>
  </div>

</body>
</html>`;

async function generatePdf() {
  const tempHtmlPath = path.join(__dirname, 'temp_azure_syllabus.html');
  const azurePdfPath = path.join(__dirname, '..', 'assets', 'docs', 'azure-data-engineer-syllabus.pdf');
  const siteAzurePdfPath = path.join(__dirname, '..', '_site', 'assets', 'docs', 'azure-data-engineer-syllabus.pdf');

  fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

  console.log('[Azure PDF Generator] Launching browser...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.goto('file://' + tempHtmlPath, { waitUntil: 'networkidle0' });

  console.log('[Azure PDF Generator] Printing to PDF...');
  await page.pdf({
    path: azurePdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  if (fs.existsSync(path.dirname(siteAzurePdfPath))) {
    fs.copyFileSync(azurePdfPath, siteAzurePdfPath);
  }

  await browser.close();
  fs.unlinkSync(tempHtmlPath);

  const stats = fs.statSync(azurePdfPath);
  console.log(`[Azure PDF Generator] Success! Generated ${azurePdfPath} (${stats.size} bytes).`);
}

generatePdf().catch(err => {
  console.error('[Azure PDF Generator] Error generating PDF:', err);
  process.exit(1);
});
