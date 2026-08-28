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
<title>Beyond RPA - Advance Agentic UiPath Curriculum - RPA Vault</title>
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
    color: #ea580c;
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
    color: #ea580c;
    background: #fff7ed;
    border: 1px solid #ffedd5;
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
    color: #0284c7;
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
    color: #ea580c;
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
    color: #ea580c;
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
    background: radial-gradient(circle at 85% 15%, rgba(234, 88, 12, 0.25), transparent 45%),
                radial-gradient(circle at 15% 85%, rgba(2, 132, 199, 0.22), transparent 45%),
                linear-gradient(165deg, #040914 0%, #081226 50%, #030712 100%);
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
    background: rgba(234, 88, 12, 0.15);
    border: 1px solid rgba(234, 88, 12, 0.4);
    border-radius: 99px;
    padding: 7px 18px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: #fb923c;
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
    color: #fb923c;
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
    background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%);
    color: #ffffff;
    text-decoration: none;
    font-family: 'Sora', sans-serif;
    font-size: 12.5px;
    font-weight: 700;
    padding: 11px 22px;
    border-radius: 8px;
    box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4);
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
    opacity: 0.10;
    pointer-events: none;
    color: #0f172a;
  }
  .ghost-num.amber { color: #ea580c; opacity: 0.14; }
  .ghost-num.cyan { color: #0284c7; opacity: 0.16; }
  .ghost-num.emerald { color: #059669; opacity: 0.16; }
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
  .card.amber { border: 1.5px solid #fed7aa; }
  .card.cyan { border: 1.5px solid #bae6fd; }
  .card.emerald { border: 1.5px solid #bbf7d0; }
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
  .card-tag.amber { background: #ffedd5; color: #c2410c; }
  .card-tag.cyan { background: #e0f2fe; color: #0369a1; }
  .card-tag.emerald { background: #dcfce7; color: #15803d; }
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

  /* DAY LIST & PILLS */
  .day-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin: 0;
  }
  .day-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    padding: 8px 12px;
  }
  .day-header {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 3px;
  }
  .day-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 7px;
    border-radius: 4px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.03em;
  }
  .day-pill.amber { background: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
  .day-pill.cyan { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  .day-pill.emerald { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
  .day-pill.purple { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }

  .day-title {
    font-family: 'Sora', sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
  }
  .day-desc {
    font-size: 11px;
    line-height: 1.42;
    color: #475569;
    margin: 0;
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
    border-left: 3.5px solid #ea580c;
    border-radius: 0 8px 8px 0;
    padding: 9px 13px;
    font-size: 11px;
    line-height: 1.45;
    color: #334155;
  }
  .callout-box strong { color: #ea580c; }

  .callout-box.cyan { border-left-color: #0284c7; }
  .callout-box.cyan strong { color: #0284c7; }
  .callout-box.emerald { border-left-color: #059669; }
  .callout-box.emerald strong { color: #059669; }
  .callout-box.purple { border-left-color: #7c3aed; }
  .callout-box.purple strong { color: #7c3aed; }

  .navy-callout {
    background: linear-gradient(145deg, #091e36, #003666);
    border-radius: 10px;
    padding: 11px 15px;
    color: #ffffff;
  }
  .navy-callout .tn-tag {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: #38bdf8;
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
    color: #0284c7;
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
      <div class="cover-badge">Flagship Advanced Track</div>
    </div>

    <div class="cover-main">
      <div class="cover-audience">BEYOND RPA · ADVANCE AGENTIC AUTOMATION</div>
      <div class="cover-title">Advance Agentic RPA &amp;<br>UiPath Architecture</div>
      <div class="cover-desc">
        A 35-session masterclass covering Document Intelligence, AI Center ML pipelines, Studio Autopilot, Self-Healing Selectors, Model Context Protocol (MCP) Servers, Python Coded Agents, and UiPath Maestro Multi-Agent Swarms.
      </div>

      <div class="cover-box">
        <strong>THE PARADIGM SHIFT: BEYOND TRADITIONAL RPA</strong>
        <p>Transition from brittle screen scraping and fixed flowchart bots to autonomous reasoning agents equipped with dynamic tool registries, validation guardrails, and enterprise BPMN orchestration.</p>
      </div>

      <div class="cover-stats-grid">
        <div class="cover-stat-card">
          <div class="cover-stat-label">SESSIONS</div>
          <div class="cover-stat-val">35</div>
          <div class="cover-stat-sub">Live interactive builds</div>
        </div>
        <div class="cover-stat-card">
          <div class="cover-stat-label">MODULES</div>
          <div class="cover-stat-val">12</div>
          <div class="cover-stat-sub">Enterprise architecture</div>
        </div>
        <div class="cover-stat-card">
          <div class="cover-stat-label">PHASES</div>
          <div class="cover-stat-val">3</div>
          <div class="cover-stat-sub">Structured progression</div>
        </div>
        <div class="cover-stat-card">
          <div class="cover-stat-label">FORMAT</div>
          <div class="cover-stat-val">100%</div>
          <div class="cover-stat-sub">Hands-on code repos</div>
        </div>
      </div>

      <div class="cover-cta-row">
        <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/" class="cover-cta-btn">
          Explore Course Webpage &rarr;
        </a>
        <a href="https://rpavault.com/contact/" class="cover-cta-btn secondary">
          Talk to RPA Vault Mentors &rarr;
        </a>
      </div>
    </div>

    <div class="cover-footer">
      <div>RPA Vault · Advanced Automation Track · Hyderabad / Global Online</div>
      <div>rpavault.com</div>
    </div>
  </div>

  <!-- ================= PAGE 2: TRACK OVERVIEW & BLUEPRINT ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">RPA VAULT · ADVANCE AGENTIC UIPATH</div>
      <div class="dh-right">TRACK BLUEPRINT</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">CURRICULUM ARCHITECTURE</span>
        <h2 class="page-title">Beyond RPA: <em>Architecture for the Modern AI Stack</em></h2>
        <p class="page-subtitle">Stop training for the automation platform of two years ago. Master the full stack of intelligent document understanding, reasoning agents, and MCP protocols.</p>
      </div>

      <div class="grid-4">
        <div class="card" style="border-top: 3px solid #ea580c; padding: 9px 11px;">
          <span class="ghost-num" style="font-size:26px;">35</span>
          <div style="font-family:'IBM Plex Mono'; font-size:9.5px; font-weight:700; color:#ea580c;">SESSIONS</div>
          <div style="font-family:'Sora'; font-size:17px; font-weight:800; color:#0f172a;">35 Live</div>
          <div style="font-size:10px; color:#64748b;">Code builds</div>
        </div>
        <div class="card" style="border-top: 3px solid #0f766e; padding: 9px 11px;">
          <span class="ghost-num" style="font-size:26px;">12</span>
          <div style="font-family:'IBM Plex Mono'; font-size:9.5px; font-weight:700; color:#0f766e;">MODULES</div>
          <div style="font-family:'Sora'; font-size:17px; font-weight:800; color:#0f172a;">12 Deep</div>
          <div style="font-size:10px; color:#64748b;">Full stack</div>
        </div>
        <div class="card" style="border-top: 3px solid #0284c7; padding: 9px 11px;">
          <span class="ghost-num" style="font-size:26px;">03</span>
          <div style="font-family:'IBM Plex Mono'; font-size:9.5px; font-weight:700; color:#0284c7;">PHASES</div>
          <div style="font-family:'Sora'; font-size:17px; font-weight:800; color:#0f172a;">3 Stages</div>
          <div style="font-size:10px; color:#64748b;">Zero to agentic</div>
        </div>
        <div class="card" style="border-top: 3px solid #7c3aed; padding: 9px 11px;">
          <span class="ghost-num" style="font-size:26px;">100%</span>
          <div style="font-family:'IBM Plex Mono'; font-size:9.5px; font-weight:700; color:#7c3aed;">BUILDS</div>
          <div style="font-family:'Sora'; font-size:17px; font-weight:800; color:#0f172a;">100% Code</div>
          <div style="font-size:10px; color:#64748b;">Git repos</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card" style="border-top: 3.5px solid #ea580c;">
          <span class="ghost-num amber">01</span>
          <span class="card-tag amber">THE PAST</span>
          <h4 class="card-title" style="color:#ea580c;">Where Most Courses Stop</h4>
          <p class="card-desc">Legacy RPA methodologies causing production maintenance nightmares:</p>
          <ul class="bullet-list">
            <li><strong>Brittle Selectors:</strong> Flows break on DOM updates.</li>
            <li><strong>Hardcoded Regex:</strong> Inflexible rules on variable layouts.</li>
            <li><strong>Manual Try/Catch:</strong> Linear error traps without LLMs.</li>
            <li><strong>Siloed Bots:</strong> Incapable of multi-agent swarm flows.</li>
          </ul>
        </div>

        <div class="card" style="border-top: 3.5px solid #0f766e;">
          <span class="ghost-num emerald">02</span>
          <span class="card-tag emerald">THE FUTURE</span>
          <h4 class="card-title" style="color:#0f766e;">What You Build in This Track</h4>
          <p class="card-desc">Production-grade Agentic systems built for modern enterprise scale:</p>
          <ul class="bullet-list">
            <li><strong>Autonomous LLM Agents:</strong> Grounding &amp; system prompts.</li>
            <li><strong>Model Context Protocol:</strong> Tool APIs for LLMs.</li>
            <li><strong>Self-Healing Selectors:</strong> ScreenPlay vision runtime.</li>
            <li><strong>Maestro BPMN Swarms:</strong> Multi-agent coordination.</li>
          </ul>
        </div>

        <div class="card" style="border-top: 3.5px solid #0284c7;">
          <span class="ghost-num cyan">03</span>
          <span class="card-tag cyan">AUDIENCE</span>
          <h4 class="card-title" style="color:#0284c7;">Who This Is Designed For</h4>
          <p class="card-desc">Tailored specifically for engineers seeking senior career acceleration:</p>
          <ul class="bullet-list">
            <li><strong>UiPath Developers:</strong> Moving past screen scraping.</li>
            <li><strong>RPA Architects:</strong> Designing enterprise AI stacks.</li>
            <li><strong>Senior Engineers:</strong> Targeting ₹12–20L+ packages.</li>
          </ul>
        </div>

        <div class="card" style="border-top: 3.5px solid #7c3aed;">
          <span class="ghost-num purple">04</span>
          <span class="card-tag purple">PREREQUISITES</span>
          <h4 class="card-title" style="color:#7c3aed;">What You Need &amp; Prerequisites</h4>
          <p class="card-desc">Zero AI/ML background needed — all concepts taught from first principles:</p>
          <ul class="bullet-list">
            <li><strong>Studio Basics:</strong> Familiarity with variables &amp; flows.</li>
            <li><strong>Zero ML Required:</strong> AI Center taught from scratch.</li>
            <li><strong>Python FastMCP:</strong> Practical scripting taught step-by-step.</li>
          </ul>
        </div>
      </div>

      <div class="navy-callout">
        <span class="tn-tag">THE AGENTIC ADVANTAGE</span>
        <h4>Build systems that reason, heal, and orchestrate across the modern AI stack.</h4>
        <p>Learn Document Intelligence · Deploy AI Center ML models · Build Python MCP Servers · Orchestrate Multi-Agent Swarms with Maestro.</p>
      </div>

      <div class="page-cta-bar">
        <span>Ready to begin? Explore the complete online syllabus &amp; batch timings</span>
        <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/">View Course Webpage &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · Advance Agentic UiPath Curriculum</div>
      <div>Page 2 of 9 · <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/">rpavault.com/course/advance-agentic-rpa-uipath/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 3: PHASE 01 (PART A) - DU FOUNDATIONS ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">PHASE 01 · DAYS 01–05</div>
      <div class="dh-right">DOCUMENT INTELLIGENCE</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">PHASE 01 · CORE FOUNDATIONS</span>
        <h2 class="page-title">4-Stage Document Understanding <em>Framework</em></h2>
        <p class="page-subtitle">Master document digitization, intelligent taxonomy schemas, and production invoice extraction pipelines.</p>
      </div>

      <div class="day-list">
        <div class="day-item" style="border-left: 3.5px solid #ea580c;">
          <div class="day-header">
            <span class="day-pill amber">Day 01</span>
            <span class="day-title">DU Fundamentals &amp; Enterprise Document Types</span>
          </div>
          <p class="day-desc">Structured, semi-structured, and unstructured document ingestion. OCR digitizer engines comparison (OmniPage, Google Cloud OCR, Microsoft OCR) and enterprise DU ROI.</p>
        </div>

        <div class="day-item" style="border-left: 3.5px solid #ea580c;">
          <div class="day-header">
            <span class="day-pill amber">Day 02</span>
            <span class="day-title">The 4-Stage DU Framework &amp; Taxonomy Manager</span>
          </div>
          <p class="day-desc">Deep dive into Taxonomy Manager schema definitions, document type hierarchies, Digitization OCR engines, Keyword/Intelligent Classifiers, and Extractor orchestration.</p>
        </div>

        <div class="day-item" style="border-left: 3.5px solid #ea580c;">
          <div class="day-header">
            <span class="day-pill amber">Day 03</span>
            <span class="day-title">End-to-End Production Invoice Processing Capstone</span>
            <span class="pill-tag" style="background:#ffedd5; color:#c2410c; font-weight:700;">CAPSTONE BUILD</span>
          </div>
          <p class="day-desc">Full practical build implementing automated invoice processing, line-item table extractions, regex rule validation, exception routing, and enterprise debugging.</p>
        </div>

        <div class="day-item" style="border-left: 3.5px solid #ea580c;">
          <div class="day-header">
            <span class="day-pill amber">Day 04</span>
            <span class="day-title">Studio Document Understanding Framework Template</span>
          </div>
          <p class="day-desc">Understanding and customizing the enterprise Document Understanding framework template inside UiPath Studio, config asset integration, and state machine transitions.</p>
        </div>

        <div class="day-item" style="border-left: 3.5px solid #ea580c;">
          <div class="day-header">
            <span class="day-pill amber">Day 05</span>
            <span class="day-title">Modern DU Architecture &amp; Pre-Trained Models</span>
          </div>
          <p class="day-desc">Comparing traditional DU vs Modern DU, utilizing out-of-the-box pre-trained document models (Invoices, Receipts, Purchase Orders), and establishing new project pipelines.</p>
        </div>
      </div>

      <div class="grid-4">
        <div class="mini-card" style="border-top: 2.5px solid #ea580c;">
          <h5>01 Taxonomy</h5>
          <p>Schema mapping &amp; field grouping JSON.</p>
        </div>
        <div class="mini-card" style="border-top: 2.5px solid #0f766e;">
          <h5>02 Digitization</h5>
          <p>Multi-engine OCR text &amp; DOM parsing.</p>
        </div>
        <div class="mini-card" style="border-top: 2.5px solid #0284c7;">
          <h5>03 Classification</h5>
          <p>Keyword &amp; Intelligent vector routing.</p>
        </div>
        <div class="mini-card" style="border-top: 2.5px solid #7c3aed;">
          <h5>04 Extraction</h5>
          <p>Pre-trained ML &amp; line-item parsing.</p>
        </div>
      </div>

      <div class="callout-box">
        <strong>PRACTICE LAB &amp; CHECKPOINT:</strong> Build a complete Document Understanding pipeline with taxonomy schema definition, OCR digitizer calibration, and fallback regex extraction rules.
      </div>

      <div class="page-cta-bar">
        <span>Have questions about Document Understanding? Connect with our mentors</span>
        <a href="https://rpavault.com/contact/">Schedule Mentor Call &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · Advance Agentic UiPath Curriculum</div>
      <div>Page 3 of 9 · <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/">rpavault.com/course/advance-agentic-rpa-uipath/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 4: PHASE 01 (PART B) - AI CENTER & IXP ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">PHASE 01 · DAYS 06–11</div>
      <div class="dh-right">AI CENTER, HITL &amp; IXP</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">PHASE 01 · ENTERPRISE MODULES</span>
        <h2 class="page-title">AI Center ML Retraining, <em>Action Center &amp; IXP</em></h2>
        <p class="page-subtitle">Deploy ML models, orchestrate human-in-the-loop validation tasks, and extract multi-page unstructured layouts.</p>
      </div>

      <div class="grid-2">
        <div class="card amber">
          <span class="ghost-num amber">06</span>
          <span class="card-tag amber">DAY 06</span>
          <h4 class="card-title">AI Center ML Training &amp; Pipelines</h4>
          <p class="card-desc">Deploying ML packages, building dataset pipelines, retraining models with enterprise domain documents, and consuming ML Skills in Studio.</p>
          <ul class="bullet-list">
            <li>ML Packages &amp; Dataset Pipelines</li>
            <li>Retraining with Domain Documents</li>
            <li>ML Skill Activity Deployment</li>
          </ul>
        </div>

        <div class="card amber">
          <span class="ghost-num amber">07</span>
          <span class="card-tag amber">DAY 07</span>
          <h4 class="card-title">Action Center &amp; Human-in-the-Loop</h4>
          <p class="card-desc">Human-in-the-Loop validation concepts, creating validation tasks, Action Center user routing workflows, and approval orchestration.</p>
          <ul class="bullet-list">
            <li>Creating HITL Validation Tasks</li>
            <li>Action Center Orchestrator Catalogs</li>
            <li>User Routing &amp; Multi-Tier Approvals</li>
          </ul>
        </div>

        <div class="card amber">
          <span class="ghost-num amber">08</span>
          <span class="card-tag amber">DAY 08</span>
          <h4 class="card-title">Validation Station &amp; Thresholds</h4>
          <p class="card-desc">Presenting Validation Station to users, configuring confidence thresholds (&lt;85%), field-level overrides, and validation station best practices.</p>
          <ul class="bullet-list">
            <li>Confidence Threshold Rules (&lt;85%)</li>
            <li>Field-Level Exception Overrides</li>
            <li>Validation Station Best Practices</li>
          </ul>
        </div>

        <div class="card amber">
          <span class="ghost-num amber">09</span>
          <span class="card-tag amber">DAY 09</span>
          <h4 class="card-title">REST API Workflows &amp; Web Services</h4>
          <p class="card-desc">REST API architecture, executing HTTP Request activities, parsing JSON responses, and integrating web services into Document Understanding.</p>
          <ul class="bullet-list">
            <li>HTTP Request &amp; OAuth 2.0 Auth</li>
            <li>JSON Deserialization &amp; Data Tables</li>
            <li>ERP Ingestion Web Services</li>
          </ul>
        </div>

        <div class="card amber">
          <span class="ghost-num amber">10</span>
          <span class="card-tag amber">DAY 10</span>
          <h4 class="card-title">Intelligent Xtraction (IXP) Architecture</h4>
          <p class="card-desc">What Intelligent Xtraction &amp; Processing (IXP) is, why it is required for complex layouts, and IXP vs traditional extraction comparison.</p>
          <ul class="bullet-list">
            <li>IXP Next-Gen Extraction Engine</li>
            <li>Complex Unstructured Layouts</li>
            <li>IXP vs Traditional DU Comparison</li>
          </ul>
        </div>

        <div class="card amber">
          <span class="ghost-num amber">11</span>
          <span class="card-tag amber">DAY 11</span>
          <h4 class="card-title">Live IXP Multi-Page Capstone</h4>
          <p class="card-desc">Real-time production use case implementing IXP on complex unstructured multi-page documents with end-to-end downstream ERP sync.</p>
          <ul class="bullet-list">
            <li>Multi-Page PDF Processing</li>
            <li>Complex Table Reconciliation</li>
            <li>End-to-End Downstream Sync</li>
          </ul>
        </div>
      </div>

      <div class="callout-box">
        <strong>PRACTICE LAB &amp; EXIT CHECK:</strong> Build a complete Document Understanding pipeline with AI Center ML skill integration, Action Center validation triggers on low confidence (&lt;85%), and downstream REST API ERP sync.
      </div>

      <div class="page-cta-bar">
        <span>Want to see a live demo of AI Center &amp; IXP pipelines?</span>
        <a href="https://rpavault.com/contact/">Request Demo Access &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · Advance Agentic UiPath Curriculum</div>
      <div>Page 4 of 9 · <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/">rpavault.com/course/advance-agentic-rpa-uipath/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 5: PHASE 02 - ADVANCED AI INSIDE UIPATH ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">PHASE 02 · DAYS 12–17</div>
      <div class="dh-right">NATIVE AI &amp; AUTOPILOT</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">PHASE 02 · ADVANCED AI</span>
        <h2 class="page-title">Autopilot, <em>Self-Healing Selectors &amp; Vision</em></h2>
        <p class="page-subtitle">Master Generative AI activities, Autopilot in Studio, Clipboard AI, Self-Healing Agents, ScreenPlay, and Semantic Activities.</p>
      </div>

      <div class="grid-2">
        <!-- Card 1: Studio GenAI & Autopilot (Days 12-14) -->
        <div class="card cyan">
          <span class="ghost-num cyan">12–14</span>
          <span class="card-tag cyan">DAYS 12–14</span>
          <h4 class="card-title">Studio Gen AI Activities, Autopilot &amp; Clipboard AI</h4>
          <p class="card-desc">Generating workflows from plain English, controlling LLM parameters, and automating cross-application data flow:</p>

          <div class="day-list">
            <div class="day-item">
              <div class="day-header">
                <span class="day-pill cyan">Day 12</span>
                <span class="day-title">Gen AI Activities in Studio</span>
              </div>
              <p class="day-desc">Prompt grounding, temperature tuning, system instructions, and real-time business summarization.</p>
            </div>

            <div class="day-item">
              <div class="day-header">
                <span class="day-pill cyan">Day 13</span>
                <span class="day-title">Autopilot in Studio &amp; Workflow Synthesis</span>
              </div>
              <p class="day-desc">Generating complex automation workflows from natural language prompts and automated expression building.</p>
            </div>

            <div class="day-item">
              <div class="day-header">
                <span class="day-pill cyan">Day 14</span>
                <span class="day-title">Clipboard AI Cross-App Transfer</span>
              </div>
              <p class="day-desc">Cross-app intelligent copy-paste and autonomous field mapping between spreadsheets, web portals, and legacy desktop apps.</p>
            </div>
          </div>

          <div class="tags-row">
            <span class="pill-tag">Gen AI Activities</span>
            <span class="pill-tag">Autopilot Studio</span>
            <span class="pill-tag">Clipboard AI</span>
            <span class="pill-tag">Prompt Grounding</span>
          </div>
        </div>

        <!-- Card 2: Self-Healing & ScreenPlay (Days 15-17) -->
        <div class="card cyan">
          <span class="ghost-num cyan">15–17</span>
          <span class="card-tag cyan">DAYS 15–17</span>
          <h4 class="card-title">Self-Healing Agents, ScreenPlay Vision &amp; Semantic Actions</h4>
          <p class="card-desc">Building resilient bots that automatically repair broken selectors, see remote desktops with computer vision, and execute business intent:</p>

          <div class="day-list">
            <div class="day-item">
              <div class="day-header">
                <span class="day-pill cyan">Day 15</span>
                <span class="day-title">Self-Healing Agents &amp; Dynamic Recovery</span>
              </div>
              <p class="day-desc">Dynamic selector recovery, self-healing runtime execution, and zero maintenance when web interfaces change.</p>
            </div>

            <div class="day-item">
              <div class="day-header">
                <span class="day-pill cyan">Day 16</span>
                <span class="day-title">ScreenPlay Vision-Based Automation</span>
              </div>
              <p class="day-desc">Next-generation vision-based automation patterns for automating challenging remote desktop environments.</p>
            </div>

            <div class="day-item">
              <div class="day-header">
                <span class="day-pill cyan">Day 17</span>
                <span class="day-title">Semantic Activities &amp; Intent Execution</span>
              </div>
              <p class="day-desc">Executing automation tasks using natural language business intent rather than brittle CSS or XPath selectors.</p>
            </div>
          </div>

          <div class="tags-row">
            <span class="pill-tag">Self-Healing Runtime</span>
            <span class="pill-tag">ScreenPlay Vision</span>
            <span class="pill-tag">Semantic Intent</span>
            <span class="pill-tag">Remote Desktop AI</span>
          </div>
        </div>
      </div>

      <div class="grid-3">
        <div class="mini-card" style="border-top: 2.5px solid #0284c7;">
          <h5>Dynamic UI Healing</h5>
          <p>Fuzzy matching &amp; visual anchor backup recovery.</p>
        </div>
        <div class="mini-card" style="border-top: 2.5px solid #0f766e;">
          <h5>Autopilot Studio</h5>
          <p>Natural language activity &amp; LINQ synthesis.</p>
        </div>
        <div class="mini-card" style="border-top: 2.5px solid #7c3aed;">
          <h5>Semantic Execution</h5>
          <p>Intent-driven actions over brittle DOM selectors.</p>
        </div>
      </div>

      <div class="callout-box cyan">
        <strong>PRACTICE LAB &amp; EXIT CHECK:</strong> Deploy a self-healing bot utilizing ScreenPlay vision that automatically recovers from simulated UI element updates and passes semantic parameters to Gen AI activities.
      </div>

      <div class="page-cta-bar">
        <span>Upgrade your UiPath skillset with Agentic AI and ScreenPlay Vision</span>
        <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/">Apply on Course Webpage &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · Advance Agentic UiPath Curriculum</div>
      <div>Page 5 of 9 · <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/">rpavault.com/course/advance-agentic-rpa-uipath/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 6: PHASE 03 - AGENT BUILDER & EVALUATIONS ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">PHASE 03 · DAYS 18–25</div>
      <div class="dh-right">AGENT BUILDER &amp; EVALUATION</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">PHASE 03 · AUTONOMOUS AGENTS</span>
        <h2 class="page-title">Agent Builder, Guardrails &amp; <em>AgentScore Matrix</em></h2>
        <p class="page-subtitle">Build reasoning agents in UiPath Agent Builder, define system prompt guardrails, and evaluate agent performance with Agent Score.</p>
      </div>

      <div class="grid-2">
        <!-- Card 1: Agent Builder & Guardrails (Days 18-21) -->
        <div class="card emerald">
          <span class="ghost-num emerald">18–21</span>
          <span class="card-tag emerald">DAYS 18–21</span>
          <h4 class="card-title">Agent Builder &amp; Prompt Guardrails Architecture</h4>
          <p class="card-desc">Transitioning from deterministic automation to autonomous decision loops with structured system instructions and memory context:</p>

          <div class="day-list">
            <div class="day-item">
              <div class="day-header">
                <span class="day-pill emerald">Day 18</span>
                <span class="day-title">Agentic AI Fundamentals &amp; Agent Builder</span>
              </div>
              <p class="day-desc">Agent vs traditional automation architecture, autonomous decision loops, and the Agent Builder platform.</p>
            </div>

            <div class="day-item">
              <div class="day-header">
                <span class="day-pill emerald">Day 19</span>
                <span class="day-title">Agent Builder Core Concepts &amp; Memory</span>
              </div>
              <p class="day-desc">Context grounding, system instructions, short/long-term memory, and tool integration.</p>
            </div>

            <div class="day-item">
              <div class="day-header">
                <span class="day-pill emerald">Day 20</span>
                <span class="day-title">Prompt Engineering &amp; Guardrails</span>
              </div>
              <p class="day-desc">Techniques for prompt engineering, system instructions, few-shot prompting, schema validation, and guardrails.</p>
            </div>

            <div class="day-item">
              <div class="day-header">
                <span class="day-pill emerald">Day 21</span>
                <span class="day-title">Build Your First Autonomous Agent</span>
              </div>
              <p class="day-desc">Live production build configuring autonomous agent parameters, input/output schemas, and testing.</p>
            </div>
          </div>

          <div class="tags-row">
            <span class="pill-tag">Agent Builder</span>
            <span class="pill-tag">System Instructions</span>
            <span class="pill-tag">Few-Shot Prompting</span>
            <span class="pill-tag">Guardrails</span>
          </div>
        </div>

        <!-- Card 2: HITL & AgentScore (Days 22-25) -->
        <div class="card emerald">
          <span class="ghost-num emerald">22–25</span>
          <span class="card-tag emerald">DAYS 22–25</span>
          <h4 class="card-title">HITL Escalations &amp; AgentScore Benchmarking</h4>
          <p class="card-desc">Governing agent behavior in production: measuring reasoning accuracy, stress-testing edge cases, and invoking agents from RPA:</p>

          <div class="day-list">
            <div class="day-item">
              <div class="day-header">
                <span class="day-pill emerald">Day 22</span>
                <span class="day-title">Agent Escalations (HITL) &amp; Action Center</span>
              </div>
              <p class="day-desc">Human validation, escalation thresholds, approval workflows, and Action Center integration.</p>
            </div>

            <div class="day-item">
              <div class="day-header">
                <span class="day-pill emerald">Day 23</span>
                <span class="day-title">Agent Evaluations &amp; Agent Score</span>
              </div>
              <p class="day-desc">Evaluation benchmarks, metrics, ground truth datasets, and Agent Score calculation.</p>
            </div>

            <div class="day-item">
              <div class="day-header">
                <span class="day-pill emerald">Day 24</span>
                <span class="day-title">Agent Tools Selection &amp; Edge Cases</span>
              </div>
              <p class="day-desc">Evaluating agent accuracy, testing edge cases, tool selection benchmarks, and continuous monitoring.</p>
            </div>

            <div class="day-item">
              <div class="day-header">
                <span class="day-pill emerald">Day 25</span>
                <span class="day-title">Bidirectional Agent + RPA Integration</span>
              </div>
              <p class="day-desc">Invoking autonomous agents from deterministic RPA workflows and passing structured context bidirectionally.</p>
            </div>
          </div>

          <div class="tags-row">
            <span class="pill-tag">Agent Score</span>
            <span class="pill-tag">Evaluation Datasets</span>
            <span class="pill-tag">Action Center Escalation</span>
            <span class="pill-tag">RPA Invocation</span>
          </div>
        </div>
      </div>

      <div class="grid-3">
        <div class="mini-card" style="border-top: 2.5px solid #059669;">
          <h5>System Guardrails</h5>
          <p>Strict schema validation &amp; hallucination guards.</p>
        </div>
        <div class="mini-card" style="border-top: 2.5px solid #0284c7;">
          <h5>AgentScore Matrix</h5>
          <p>Ground-truth 50-item evaluation benchmarks.</p>
        </div>
        <div class="mini-card" style="border-top: 2.5px solid #7c3aed;">
          <h5>HITL Routing</h5>
          <p>Action Center escalation on low confidence.</p>
        </div>
      </div>

      <div class="callout-box emerald">
        <strong>PRACTICE LAB &amp; EXIT CHECK:</strong> Create an autonomous Customer Escalation Agent with custom prompt guardrails, measure its Agent Score over a 50-item evaluation dataset, and trigger Action Center tasks on uncertainty.
      </div>

      <div class="page-cta-bar">
        <span>Learn how to build production-grade Agent Builder systems</span>
        <a href="https://rpavault.com/contact/">Talk to an RPA Architect &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · Advance Agentic UiPath Curriculum</div>
      <div>Page 6 of 9 · <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/">rpavault.com/course/advance-agentic-rpa-uipath/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 7: PHASE 04 - MCP SERVERS & MAESTRO SWARMS ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">PHASE 04 · DAYS 26–35</div>
      <div class="dh-right">PROTOCOLS &amp; SWARMS</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">PHASE 04 · FLAGSHIP LAYER</span>
        <h2 class="page-title">MCP Servers, Python Coded Agents &amp; <em>Maestro Swarms</em></h2>
        <p class="page-subtitle">Build Model Context Protocol (MCP) servers in Python, code custom agents, and orchestrate multi-agent swarms with UiPath Maestro.</p>
      </div>

      <!-- MCP Suite Card -->
      <div class="card purple">
        <span class="ghost-num purple">26–30</span>
        <span class="card-tag purple">MODULE 01 · DAYS 26–30</span>
        <h4 class="card-title">The Model Context Protocol (MCP) Server Suite</h4>
        <p class="card-desc">Mastering Anthropic's open standard for connecting LLMs to enterprise tools across UiPath, Python, and local CLIs.</p>

        <div class="day-list">
          <div class="day-item">
            <div class="day-header">
              <span class="day-pill purple">Day 26</span>
              <span class="day-title">Introduction to Model Context Protocol (MCP)</span>
            </div>
            <p class="day-desc">What Model Context Protocol is, why it matters for autonomous agents, and client-server tool registration architecture.</p>
          </div>

          <div class="day-item">
            <div class="day-header">
              <span class="day-pill purple">Day 27</span>
              <span class="day-title">UiPath MCP Server Configuration &amp; Tool Registration</span>
            </div>
            <p class="day-desc">Practical demo configuring and registering enterprise automation tools inside the native UiPath MCP Server.</p>
          </div>

          <div class="day-item">
            <div class="day-header">
              <span class="day-pill purple">Day 28</span>
              <span class="day-title">Coded MCP Server Development with Python + UiPath</span>
            </div>
            <p class="day-desc">Practical demo building a custom Coded MCP Server using Python + UiPath to expose custom business logic to LLMs.</p>
          </div>

          <div class="day-item">
            <div class="day-header">
              <span class="day-pill purple">Day 29</span>
              <span class="day-title">Command MCP Server for Local CLI &amp; Process Tools</span>
            </div>
            <p class="day-desc">Local tool execution, process invocation, and command-line Model Context Protocol integration.</p>
          </div>

          <div class="day-item">
            <div class="day-header">
              <span class="day-pill purple">Day 30</span>
              <span class="day-title">Remote MCP Server Enterprise Deployment &amp; Security</span>
            </div>
            <p class="day-desc">Distributed enterprise MCP server deployment, remote endpoint hosting, and network security protocols.</p>
          </div>
        </div>
      </div>

      <!-- Modules 02 & 03 -->
      <div class="grid-2">
        <div class="card purple">
          <span class="ghost-num purple">31–32</span>
          <span class="card-tag purple">MODULE 02 · DAYS 31–32</span>
          <h4 class="card-title">Python Coded Agents &amp; AI Coding</h4>
          <p class="card-desc">Writing pure Python automation scripts, deploying to Orchestrator, and synthesizing workflows using Claude 3.5 Sonnet &amp; Codex.</p>
          <div class="day-list">
            <div class="day-item">
              <div class="day-header">
                <span class="day-pill purple">Day 31</span>
                <span class="day-title">Python Coded Agents</span>
              </div>
              <p class="day-desc">Building a Coded Agent in Python and deploying to Orchestrator.</p>
            </div>
            <div class="day-item">
              <div class="day-header">
                <span class="day-pill purple">Day 32</span>
                <span class="day-title">AI Coding Skills (Claude &amp; Codex)</span>
              </div>
              <p class="day-desc">Synthesizing and optimizing RPA workflows automatically.</p>
            </div>
          </div>
        </div>

        <div class="card purple">
          <span class="ghost-num purple">33–35</span>
          <span class="card-tag purple">MODULE 03 · DAYS 33–35</span>
          <h4 class="card-title">UiPath Maestro &amp; CrewAI Swarms</h4>
          <p class="card-desc">BPMN 2.0 process modeling, state management, event orchestration, and coordinating autonomous CrewAI swarms.</p>
          <div class="day-list">
            <div class="day-item">
              <div class="day-header">
                <span class="day-pill purple">Day 33</span>
                <span class="day-title">Maestro BPMN 2.0 Flows</span>
              </div>
              <p class="day-desc">BPMN standard, tasks, events, and decision gateways.</p>
            </div>
            <div class="day-item">
              <div class="day-header">
                <span class="day-pill purple">Days 34–35</span>
                <span class="day-title">Multi-Agent Swarm Demo</span>
              </div>
              <p class="day-desc">Executing swarms with external CrewAI frameworks.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="callout-box purple">
        <strong>FLAGSHIP CAPSTONE ARCHITECTURE PROJECT:</strong> Architect an end-to-end autonomous enterprise system connecting a Python FastMCP Server, an Agent Builder reasoning agent, and a UiPath Maestro BPMN gateway for end-to-end order fulfillment.
      </div>

      <div class="page-cta-bar">
        <span>The flagship layer separating you from the market</span>
        <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/">View Full Capstone Details &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · Advance Agentic UiPath Curriculum</div>
      <div>Page 7 of 9 · <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/">rpavault.com/course/advance-agentic-rpa-uipath/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 8: DELIVERY, MENTORSHIP & PROOF ================= -->
  <div class="page">
    <div class="doc-header">
      <div class="dh-left">PROGRAM ARCHITECTURE</div>
      <div class="dh-right">DELIVERY &amp; PROOF</div>
    </div>

    <div class="page-main">
      <div>
        <span class="eyebrow">WHAT'S INCLUDED · LIVE DELIVERY</span>
        <h2 class="page-title">Everything you need to master <em>next-generation automation</em></h2>
        <p class="page-subtitle">Live interactive coding, production codebases, 1-on-1 mentor code reviews, and industry-recognized credentials.</p>
      </div>

      <div class="grid-2">
        <div class="card gold">
          <span class="ghost-num gold">01</span>
          <span class="card-tag gold">PILLAR 01</span>
          <h4 class="card-title">Live Instructor-Led Builds</h4>
          <p class="card-desc">Interactive coding sessions in every class — not pre-recorded slides or generic videos. You build real pipelines alongside senior architects.</p>
          <ul class="bullet-list">
            <li>Live step-by-step code walkthroughs</li>
            <li>Real-time debugging &amp; problem solving</li>
          </ul>
        </div>

        <div class="card gold">
          <span class="ghost-num gold">02</span>
          <span class="card-tag gold">PILLAR 02</span>
          <h4 class="card-title">Production-Grade Architecture</h4>
          <p class="card-desc">Build real Document Understanding pipelines, AI Center ML models, Python MCP servers, Coded Agents, and Maestro BPMN flows.</p>
          <ul class="bullet-list">
            <li>Enterprise design patterns &amp; standards</li>
            <li>Production error handling &amp; guardrails</li>
          </ul>
        </div>

        <div class="card gold">
          <span class="ghost-num gold">03</span>
          <span class="card-tag gold">PILLAR 03</span>
          <h4 class="card-title">Lifetime Recording &amp; Code Access</h4>
          <p class="card-desc">Full HD recordings of every class with complete project source code repositories for continuous reference and production reuse.</p>
          <ul class="bullet-list">
            <li>Full HD video recordings &amp; timestamps</li>
            <li>Clean GitHub repositories for all modules</li>
          </ul>
        </div>

        <div class="card gold">
          <span class="ghost-num gold">04</span>
          <span class="card-tag gold">PILLAR 04</span>
          <h4 class="card-title">Direct Mentor Code Review</h4>
          <p class="card-desc">1-on-1 architecture guidance and pull-request reviews on your agent workflows from practicing RPA and AI architects.</p>
          <ul class="bullet-list">
            <li>Personalized 1-on-1 feedback sessions</li>
            <li>Direct Git pull-request code reviews</li>
          </ul>
        </div>

        <div class="card gold">
          <span class="ghost-num gold">05</span>
          <span class="card-tag gold">PILLAR 05</span>
          <h4 class="card-title">Private Practitioner Community</h4>
          <p class="card-desc">Exclusive network of working RPA architects and Agentic AI developers sharing live job openings, project tips, and interview insights.</p>
          <ul class="bullet-list">
            <li>Verified job leads &amp; interview prep</li>
            <li>Architect networking &amp; knowledge base</li>
          </ul>
        </div>

        <div class="card gold">
          <span class="ghost-num gold">06</span>
          <span class="card-tag gold">PILLAR 06</span>
          <h4 class="card-title">Industry-Recognized Credential</h4>
          <p class="card-desc">Official Certificate of Completion recognized across top enterprise employers, consulting firms, and hiring partners.</p>
          <ul class="bullet-list">
            <li>Verifiable digital certificate ID</li>
            <li>Showcase on LinkedIn &amp; resume</li>
          </ul>
        </div>
      </div>

      <div class="navy-callout">
        <span class="tn-tag">READY TO CLOSE THE GAP?</span>
        <h4>Advance your career to the forefront of Agentic Automation.</h4>
        <p>35 sessions. Three phases. One destination: agentic. Connect with RPA Vault mentors to enroll in the next live batch.</p>
      </div>

      <div class="page-cta-bar">
        <span>Limited batch sizes for personalized mentor code reviews</span>
        <a href="https://rpavault.com/contact/">Schedule Admissions Call &rarr;</a>
      </div>
    </div>

    <div class="doc-footer">
      <div>RPA Vault · Advance Agentic UiPath Curriculum</div>
      <div>Page 8 of 9 · <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/">rpavault.com/course/advance-agentic-rpa-uipath/</a></div>
    </div>
  </div>

  <!-- ================= PAGE 9: CLOSING PAGE ================= -->
  <div class="page cover-page">
    <div class="cover-brand">
      <img src="${logoWhiteBase64}" alt="RPA Vault" class="cover-logo-img" />
      <div class="cover-badge">Career Pathway</div>
    </div>

    <div class="cover-main" style="text-align:center; max-width:155mm; margin:0 auto;">
      <div class="cover-audience">YOUR NEXT PRACTICAL STEP</div>
      <div class="cover-title" style="font-size:38px;">Learn the tools.<br>Build the evidence.</div>
      <div class="cover-desc" style="font-size:14.5px; margin:0 auto 6mm;">
        Explore the complete course, review the 35-session curriculum, and connect with RPA Vault mentors to plan your advanced automation journey.
      </div>

      <div class="grid-2" style="text-align:left; margin-bottom:6mm;">
        <div class="cover-box" style="margin-bottom:0;">
          <strong>Explore the complete course</strong>
          <p>See the full curriculum, learning model, project path, and course details online.</p>
          <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/" style="color:#38bdf8; font-weight:700; font-size:12px; text-decoration:none; display:inline-block; margin-top:5px;">rpavault.com/course/advance-agentic-rpa-uipath/ &rarr;</a>
        </div>
        <div class="cover-box" style="margin-bottom:0;">
          <strong>Talk to RPA Vault Mentors</strong>
          <p>Discuss your background, course fit, batch options, and enrollment steps.</p>
          <a href="https://rpavault.com/contact/" style="color:#38bdf8; font-weight:700; font-size:12px; text-decoration:none; display:inline-block; margin-top:5px;">rpavault.com/contact/ &rarr;</a>
        </div>
      </div>

      <div class="cover-cta-row" style="justify-content:center; margin-top:4mm;">
        <a href="https://rpavault.com/course/advance-agentic-rpa-uipath/" class="cover-cta-btn">
          Explore Course Webpage &rarr;
        </a>
        <a href="https://rpavault.com/contact/" class="cover-cta-btn secondary">
          Talk to RPA Vault Mentors &rarr;
        </a>
      </div>
    </div>

    <div class="cover-footer">
      <div>RPA Vault · Advanced Agentic RPA · UiPath · Python MCP · Maestro Swarms</div>
      <div><a href="https://rpavault.com/contact/" style="color:#94a3b8; text-decoration:none;">rpavault.com/contact/</a></div>
    </div>
  </div>

</body>
</html>`;

(async () => {
  try {
    const tempHtmlPath = path.join(__dirname, 'temp_advance_agentic.html');
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

    console.log('Launching browser to generate Advance Agentic RPA syllabus PDF...');
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const browser = await puppeteer.launch({
      executablePath: fs.existsSync(chromePath) ? chromePath : undefined,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    await page.goto('file://' + tempHtmlPath, { waitUntil: 'load' });

    const outputPath = path.join(__dirname, '../assets/docs/advance-agentic-rpa-syllabus.pdf');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    });

    // Also copy to _site if _site/assets/docs exists
    const siteDocsDir = path.join(__dirname, '../_site/assets/docs');
    if (fs.existsSync(siteDocsDir)) {
      fs.copyFileSync(outputPath, path.join(siteDocsDir, 'advance-agentic-rpa-syllabus.pdf'));
    }

    await browser.close();
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }

    const stats = fs.statSync(outputPath);
    console.log(`Successfully generated Advance Agentic RPA syllabus PDF at: ${outputPath} (${stats.size} bytes)`);
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
})();
