/* RPAVault site scripts — v3 */
(function(){
'use strict';

const rpvPageLoadTime = Date.now();

/* ---------- Navigation ---------- */
const navToggle=document.querySelector('[data-nav-toggle]');
const siteNav=document.querySelector('[data-site-nav]');
const services=document.querySelector('[data-services]');
const servicesTrigger=document.querySelector('[data-services-trigger]');
navToggle?.addEventListener('click',()=>{const open=siteNav.classList.toggle('is-open');navToggle.setAttribute('aria-expanded',String(open));});
servicesTrigger?.addEventListener('click',(event)=>{event.preventDefault();services.classList.toggle('is-open');servicesTrigger.setAttribute('aria-expanded',String(services.classList.contains('is-open')));});
document.querySelectorAll('a[href="#"]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));
const yearTarget=document.querySelector('[data-current-year]'); if(yearTarget){yearTarget.textContent=new Date().getFullYear();}
const closeNav=()=>{if(siteNav&&siteNav.classList.contains('is-open')){siteNav.classList.remove('is-open');navToggle?.setAttribute('aria-expanded','false');}services?.classList.remove('is-open');servicesTrigger?.setAttribute('aria-expanded','false');};
document.addEventListener('click',(e)=>{if(services&&services.classList.contains('is-open')&&!services.contains(e.target)){services.classList.remove('is-open');servicesTrigger?.setAttribute('aria-expanded','false');}
if(siteNav&&siteNav.classList.contains('is-open')&&!siteNav.contains(e.target)&&!navToggle.contains(e.target)){closeNav();}});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'){closeNav();closeModal();closeConsultingModal();closeDiscoveryModal();closeCollegeModal();closeCorporateModal();closeGuidanceModal();closeSyllabusModal();}});
siteNav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeNav()));
services?.addEventListener('keydown',(e)=>{if(e.key==='Escape'){services.classList.remove('is-open');servicesTrigger?.setAttribute('aria-expanded','false');servicesTrigger?.focus();}});

/* ---------- Scroll-in reveal ---------- */
const revealEls=document.querySelectorAll('.reveal');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(window.innerWidth <= 980){
  revealEls.forEach((el)=>el.classList.add('is-visible'));
}else if('IntersectionObserver' in window && !reduceMotion){
  const io=new IntersectionObserver((entries)=>{entries.forEach((entry)=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}});},{threshold:0.01});
  revealEls.forEach((el,i)=>{el.style.transitionDelay=((i%3)*90)+'ms';io.observe(el);});
}else{revealEls.forEach((el)=>el.classList.add('is-visible'));}

/* ---------- Callback modal ---------- */
const modal=document.querySelector('[data-callback-modal]');
let lastFocus=null;
function openModal(){if(!modal)return;lastFocus=document.activeElement;modal.classList.add('is-open');document.body.classList.add('modal-open');const first=modal.querySelector('input[name="name"]');setTimeout(()=>first?.focus(),60);}
function closeModal(){if(!modal||!modal.classList.contains('is-open'))return;modal.classList.remove('is-open');document.body.classList.remove('modal-open');lastFocus?.focus();}
window.rpvOpenCallback=openModal;
document.querySelectorAll('[data-open-callback]').forEach(el=>{el.addEventListener('click',(e)=>{if(modal){e.preventDefault();closeNav();const defaultVal=el.getAttribute('data-select');if(defaultVal){const selectEl=modal.querySelector('select[name="topic"]');if(selectEl){selectEl.value=defaultVal;selectEl.dispatchEvent(new Event('change'));}}openModal();}});});
modal?.addEventListener('click',(e)=>{if(e.target===modal||e.target.closest('[data-close-modal]')){closeModal();}});

/* ---------- Consulting modal ---------- */
const cModal=document.querySelector('[data-consulting-modal]');
function openConsultingModal(){if(!cModal)return;lastFocus=document.activeElement;cModal.classList.add('is-open');document.body.classList.add('modal-open');const first=cModal.querySelector('input[name="name"]');setTimeout(()=>first?.focus(),60);}
function closeConsultingModal(){if(!cModal||!cModal.classList.contains('is-open'))return;cModal.classList.remove('is-open');document.body.classList.remove('modal-open');lastFocus?.focus();}
window.rpvOpenConsulting=openConsultingModal;
document.querySelectorAll('[data-open-consulting]').forEach(el=>{el.addEventListener('click',(e)=>{if(cModal){e.preventDefault();closeNav();openConsultingModal();}});});
cModal?.addEventListener('click',(e)=>{if(e.target===cModal||e.target.closest('[data-close-modal]')){closeConsultingModal();}});

/* ---------- Discovery modal ---------- */
const dModal=document.querySelector('[data-discovery-modal]');
function openDiscoveryModal(){if(!dModal)return;lastFocus=document.activeElement;dModal.classList.add('is-open');document.body.classList.add('modal-open');const first=dModal.querySelector('input[name="name"]');setTimeout(()=>first?.focus(),60);}
function closeDiscoveryModal(){if(!dModal||!dModal.classList.contains('is-open'))return;dModal.classList.remove('is-open');document.body.classList.remove('modal-open');lastFocus?.focus();}
window.rpvOpenDiscovery=openDiscoveryModal;
document.querySelectorAll('[data-open-discovery]').forEach(el=>{el.addEventListener('click',(e)=>{if(dModal){e.preventDefault();closeNav();openDiscoveryModal();}});});
dModal?.addEventListener('click',(e)=>{if(e.target===dModal||e.target.closest('[data-close-modal]')){closeDiscoveryModal();}});

/* ---------- College modal ---------- */
const colModal=document.querySelector('[data-college-modal]');
function openCollegeModal(){if(!colModal)return;lastFocus=document.activeElement;colModal.classList.add('is-open');document.body.classList.add('modal-open');const first=colModal.querySelector('input[name="name"]');setTimeout(()=>first?.focus(),60);}
function closeCollegeModal(){if(!colModal||!colModal.classList.contains('is-open'))return;colModal.classList.remove('is-open');document.body.classList.remove('modal-open');lastFocus?.focus();}
window.rpvOpenCollege=openCollegeModal;
document.querySelectorAll('[data-open-college]').forEach(el=>{el.addEventListener('click',(e)=>{if(colModal){e.preventDefault();closeNav();openCollegeModal();}});});
colModal?.addEventListener('click',(e)=>{if(e.target===colModal||e.target.closest('[data-close-modal]')){closeCollegeModal();}});

/* ---------- Corporate modal ---------- */
const corpModal=document.querySelector('[data-corporate-modal]');
function openCorporateModal(){if(!corpModal)return;lastFocus=document.activeElement;corpModal.classList.add('is-open');document.body.classList.add('modal-open');const first=corpModal.querySelector('input[name="name"]');setTimeout(()=>first?.focus(),60);}
function closeCorporateModal(){if(!corpModal||!corpModal.classList.contains('is-open'))return;corpModal.classList.remove('is-open');document.body.classList.remove('modal-open');lastFocus?.focus();}
window.rpvOpenCorporate=openCorporateModal;
document.querySelectorAll('[data-open-corporate]').forEach(el=>{el.addEventListener('click',(e)=>{if(corpModal){e.preventDefault();closeNav();openCorporateModal();}});});
corpModal?.addEventListener('click',(e)=>{if(e.target===corpModal||e.target.closest('[data-close-modal]')){closeCorporateModal();}});

/* ---------- Guidance modal ---------- */
const gModal=document.querySelector('[data-guidance-modal]');
function openGuidanceModal(){if(!gModal)return;lastFocus=document.activeElement;gModal.classList.add('is-open');document.body.classList.add('modal-open');const first=gModal.querySelector('input[name="name"]');setTimeout(()=>first?.focus(),60);}
function closeGuidanceModal(){if(!gModal||!gModal.classList.contains('is-open'))return;gModal.classList.remove('is-open');document.body.classList.remove('modal-open');lastFocus?.focus();}
window.rpvOpenGuidance=openGuidanceModal;
document.querySelectorAll('[data-open-guidance]').forEach(el=>{el.addEventListener('click',(e)=>{if(gModal){e.preventDefault();closeNav();openGuidanceModal();}});});
gModal?.addEventListener('click',(e)=>{if(e.target===gModal||e.target.closest('[data-close-modal]')){closeGuidanceModal();}});

/* ---------- Syllabus modal ---------- */
const sModal=document.querySelector('[data-syllabus-modal]');
function openSyllabusModal(pdfUrl, courseName){
  if(!sModal)return;
  lastFocus=document.activeElement;
  if(pdfUrl){
    const sForm=sModal.querySelector('form.syllabus-lead-form');
    if(sForm) sForm.setAttribute('data-pdf-url', pdfUrl);
  }
  if(courseName){
    const cInput=sModal.querySelector('input[name="course_name"]');
    if(cInput) cInput.value=courseName;
    const sInput=sModal.querySelector('input[name="_subject"]');
    if(sInput) sInput.value='Syllabus Download Request — ' + courseName + ' — RPAVault';
  }
  sModal.classList.add('is-open');
  document.body.classList.add('modal-open');
  const first=sModal.querySelector('input[name="name"]');
  setTimeout(()=>first?.focus(),60);
}
function closeSyllabusModal(){
  if(!sModal||!sModal.classList.contains('is-open'))return;
  sModal.classList.remove('is-open');
  document.body.classList.remove('modal-open');
  lastFocus?.focus();
}
window.rpvOpenSyllabus=openSyllabusModal;
document.querySelectorAll('[data-open-syllabus], .curr-pdf-btn').forEach(el=>{
  el.addEventListener('click',(e)=>{
    if(sModal){
      e.preventDefault();
      closeNav();
      const pdf=el.getAttribute('data-pdf')||el.getAttribute('href')||'';
      const course=el.getAttribute('data-course')||'';
      openSyllabusModal(pdf, course);
    }
  });
});
sModal?.addEventListener('click',(e)=>{if(e.target===sModal||e.target.closest('[data-close-modal]')){closeSyllabusModal();}});

  // Safe Storage wrappers to handle strict cookie/storage blocking or private modes
  const safeStorage = {
    local: {
      getItem: function(key) { try { return localStorage.getItem(key); } catch(_) { return null; } },
      setItem: function(key, val) { try { localStorage.setItem(key, val); } catch(_) {} }
    },
    session: {
      getItem: function(key) { try { return sessionStorage.getItem(key); } catch(_) { return null; } },
      setItem: function(key, val) { try { sessionStorage.setItem(key, val); } catch(_) {} }
    }
  };

  // ---------- Visitor Tracking & Session Initialization ----------
  let visitorId = safeStorage.local.getItem('rpv_visitor_id');
  let firstVisit = safeStorage.local.getItem('rpv_first_visit');
  let visitCount = safeStorage.local.getItem('rpv_visit_count') || '0';

  if (!visitorId) {
    visitorId = 'v-' + Date.now() + '-' + Math.floor(Math.random() * 1000000);
    safeStorage.local.setItem('rpv_visitor_id', visitorId);
    firstVisit = new Date().toISOString();
    safeStorage.local.setItem('rpv_first_visit', firstVisit);
  }

  // Detect session changes & track visit count
  const sessionActive = safeStorage.session.getItem('rpv_session_active');
  if (!sessionActive) {
    safeStorage.session.setItem('rpv_session_active', 'true');
    visitCount = (parseInt(visitCount, 10) + 1).toString();
    safeStorage.local.setItem('rpv_visit_count', visitCount);
  }

  // Track Session Path Trail
  let pathTrailStr = safeStorage.session.getItem('rpv_path_trail');
  let pathTrail = [];
  try {
    pathTrail = pathTrailStr ? JSON.parse(pathTrailStr) : [];
  } catch (e) {
    pathTrail = [];
  }
  const currentPath = location.pathname || '/';
  if (pathTrail.length === 0 || pathTrail[pathTrail.length - 1] !== currentPath) {
    pathTrail.push(currentPath);
    if (pathTrail.length > 20) {
      pathTrail.shift();
    }
    safeStorage.session.setItem('rpv_path_trail', JSON.stringify(pathTrail));
  }

  // Track Entry Referrer (the original source that brought them to our site)
  let entryReferrer = safeStorage.session.getItem('rpv_entry_referrer');
  if (!entryReferrer) {
    entryReferrer = document.referrer || 'direct';
    safeStorage.session.setItem('rpv_entry_referrer', entryReferrer);
  }

  // Parse and track UTM / Marketing campaign parameters on entry
  let marketingParams = {};
  try {
    const cachedParams = safeStorage.session.getItem('rpv_marketing_params');
    if (cachedParams) {
      marketingParams = JSON.parse(cachedParams);
    }
  } catch (_) {}

  const urlParams = new URLSearchParams(location.search);
  const keysToCapture = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
  let hasNewParams = false;
  keysToCapture.forEach(key => {
    if (urlParams.has(key)) {
      marketingParams[key] = urlParams.get(key);
      hasNewParams = true;
    }
  });

  if (hasNewParams) {
    safeStorage.session.setItem('rpv_marketing_params', JSON.stringify(marketingParams));
  }

  // Helper to format path trail nicely as: path1 -> path2 -> path3
  function formatPathTrail(trail) {
    return (trail || []).join(' → ');
  }

  // Helper to enrich payload and sort keys categorically
  function enrichPayload(originalPayload) {
    const configData = {};
    const userData = {};

    const excludeKeys = [
      'source_page', 'source_page_title', 'course_page', 'referrer', 'browser',
      'screen', 'language', 'submitted_at_local', 'visitor_city', 'visitor_region',
      'visitor_country', 'visitor_ip', 'time_on_page_seconds', 'timezone',
      'operating_system', 'device_type', 'visitor_type', 'visitor_id',
      'visit_count', 'first_visit_date', 'session_path', 'path_trail'
    ];

    Object.keys(originalPayload).forEach(key => {
      const val = originalPayload[key];
      if (key.startsWith('_')) {
        configData[key] = val;
      } else {
        const normalizedKey = key.toLowerCase().trim();
        const isExcluded = excludeKeys.some(ex => normalizedKey === ex) || 
                           normalizedKey.startsWith('===') ||
                           normalizedKey.startsWith('geo:') ||
                           normalizedKey.startsWith('device:') ||
                           normalizedKey.startsWith('session:');
        if (!isExcluded) {
          userData[key] = val;
        }
      }
    });

    let geo = {};
    try {
      const cachedGeo = safeStorage.session.getItem('rpv_geo');
      if (cachedGeo) {
        geo = JSON.parse(cachedGeo);
      }
    } catch (_) {}

    // Fallbacks for geolocation fields from originalPayload (in case session storage is not ready)
    const ipVal = geo.ip || originalPayload.visitor_ip || originalPayload['visitor_ip'] || 'Unknown';
    const cityVal = geo.city || originalPayload.visitor_city || originalPayload['visitor_city'] || 'Unknown';
    const regionVal = geo.region || originalPayload.visitor_region || originalPayload['visitor_region'] || 'Unknown';
    const countryVal = geo.country_name || originalPayload.visitor_country || originalPayload['visitor_country'] || 'Unknown';

    const timeOnPage = originalPayload.time_on_page_seconds || Math.round((Date.now() - rpvPageLoadTime) / 1000);
    
    let tzVal = 'Unknown';
    try {
      if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
        tzVal = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
      }
    } catch (_) {}
    if (originalPayload.timezone) {
      tzVal = originalPayload.timezone;
    }

    const enriched = {};

    // Place configuration keys first
    Object.assign(enriched, configData);

    // Place User filled keys
    Object.assign(enriched, userData);

    // Add Section: Geographic & Network
    enriched['=== GEOGRAPHIC & NETWORK ==='] = '==============================';
    enriched['Geo: IP Address'] = ipVal;
    enriched['Geo: City'] = cityVal;
    enriched['Geo: Region'] = regionVal;
    enriched['Geo: Country'] = countryVal;

    // Add Section: Device & Browser
    enriched['=== DEVICE & BROWSER ==='] = '==============================';
    enriched['Device: OS'] = getOS();
    enriched['Device: Browser'] = browserInfo();
    enriched['Device: Type'] = getDeviceType();
    enriched['Device: Screen Size'] = (window.screen ? (window.screen.width + 'x' + window.screen.height) : 'Unknown');
    enriched['Device: Browser Language'] = navigator.language || 'Unknown';

    // Add Section: Visitor Session Info
    enriched['=== VISITOR SESSION INFO ==='] = '==============================';
    enriched['Session: Visitor Type'] = (parseInt(visitCount, 10) <= 1) ? 'New' : 'Returning';
    enriched['Session: Visitor ID'] = visitorId;
    enriched['Session: Visit Count'] = visitCount;
    enriched['Session: First Visit Date'] = firstVisit ? new Date(firstVisit).toLocaleString() : 'Unknown';
    enriched['Session: Path Trail'] = formatPathTrail(pathTrail);
    
    // Entry attribution
    const entryRefVal = safeStorage.session.getItem('rpv_entry_referrer') || originalPayload.referrer || document.referrer || 'direct';
    enriched['Session: Entry Referrer'] = entryRefVal;
    
    let mkt = {};
    try {
      const cachedParams = safeStorage.session.getItem('rpv_marketing_params');
      if (cachedParams) {
        mkt = JSON.parse(cachedParams);
      }
    } catch (_) {}
    
    if (mkt.utm_source) enriched['Session: UTM Source'] = mkt.utm_source;
    if (mkt.utm_medium) enriched['Session: UTM Medium'] = mkt.utm_medium;
    if (mkt.utm_campaign) enriched['Session: UTM Campaign'] = mkt.utm_campaign;
    if (mkt.utm_term) enriched['Session: UTM Term'] = mkt.utm_term;
    if (mkt.utm_content) enriched['Session: UTM Content'] = mkt.utm_content;
    if (mkt.gclid) enriched['Session: Google Click ID'] = mkt.gclid;
    if (mkt.fbclid) enriched['Session: Facebook Click ID'] = mkt.fbclid;

    enriched['Session: Current Referrer'] = originalPayload.referrer || document.referrer || 'direct';
    enriched['Session: Time Spent on Page (sec)'] = timeOnPage.toString();
    enriched['Session: Timezone'] = tzVal;
    enriched['Session: Source Page Path'] = originalPayload.source_page || location.pathname || '/';
    enriched['Session: Source Page Title'] = originalPayload.source_page_title || document.title || 'Untitled';
    enriched['Session: Local Time Submitted'] = new Date().toString();

    return enriched;
  }

  // Intercept all fetch calls to formsubmit.co to automatically inject enriched metadata
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (init && init.method && init.method.toUpperCase() === 'POST') {
      let url = '';
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.href;
      } else if (input && typeof input === 'object' && input.url) {
        url = input.url;
      }

      if (url.includes('formsubmit.co')) {
        try {
          if (init.body && typeof init.body === 'string') {
            const payload = JSON.parse(init.body);
            const enriched = enrichPayload(payload);
            init.body = JSON.stringify(enriched);
          }
        } catch (err) {
          console.warn("FormSubmit fetch enrichment failed:", err);
        }
      }
    }
    return originalFetch(input, init);
  };

  /* ---------- Lead form enrichment ---------- */
  /* Fills hidden fields on every .js-lead-form: source page, course page, browser, device, and (best-effort) location via ipapi.co */
  function browserInfo(){const ua=navigator.userAgent;let b='Unknown';
  if(/edg\//i.test(ua))b='Microsoft Edge';else if(/opr\//i.test(ua))b='Opera';else if(/chrome|crios/i.test(ua))b='Chrome';else if(/firefox|fxios/i.test(ua))b='Firefox';else if(/safari/i.test(ua))b='Safari';
  const dev=/mobi|android|iphone|ipad/i.test(ua)?'Mobile':'Desktop';return b+' · '+dev;}
  function setField(form,name,value){if(!value)return;let f=form.querySelector('input[name="'+name+'"]');if(!f){f=document.createElement('input');f.type='hidden';f.name=name;form.appendChild(f);}f.value=value;}
  function getOS(){const ua=navigator.userAgent;if(ua.indexOf("Win")!==-1)return "Windows";if(ua.indexOf("Mac")!==-1){if(navigator.maxTouchPoints>1)return "iOS (iPad)";return "macOS";}if(ua.indexOf("Linux")!==-1)return "Linux";if(/Android/i.test(ua))return "Android";if(/iPhone|iPad|iPod/i.test(ua))return "iOS";return "Unknown OS";}
  function getDeviceType(){const ua=navigator.userAgent;if(/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua))return "Tablet";if(/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpwOS)/i.test(ua))return "Mobile";return "Desktop";}
  const leadForms=document.querySelectorAll('form.js-lead-form');
  if(leadForms.length){
    const pagePath=location.pathname||'/';
    const pageTitle=document.title||'';
    const courseSlug=document.body.getAttribute('data-course-slug')||'';
    leadForms.forEach(form=>{
      setField(form,'source_page',pagePath);
      setField(form,'source_page_title',pageTitle);
      if(courseSlug){setField(form,'course_page','https://rpavault.com/'+courseSlug+'.html');}
      setField(form,'referrer',document.referrer||'direct');
      setField(form,'browser',browserInfo());
      setField(form,'screen',screen.width+'x'+screen.height);
      setField(form,'language',navigator.language||'');
      setField(form,'submitted_at_local',new Date().toString());
      
      // Fallback visitor tracking fields in DOM
      setField(form, 'visitor_id', visitorId);
      setField(form, 'visit_count', visitCount);
      setField(form, 'first_visit_date', firstVisit);
      setField(form, 'session_path', formatPathTrail(pathTrail));
      setField(form, 'entry_referrer', entryReferrer);
      if (marketingParams.utm_source) setField(form, 'utm_source', marketingParams.utm_source);
      if (marketingParams.utm_campaign) setField(form, 'utm_campaign', marketingParams.utm_campaign);
    });
  }
  
  /* Location lookup (free, no key). Cached per session; fails silently. Runs on all page loads. */
  const cachedGeoStr = safeStorage.session.getItem('rpv_geo');
  const applyGeo = (g) => {
    const lForms = document.querySelectorAll('form.js-lead-form');
    if (lForms.length) {
      lForms.forEach(form => {
        setField(form, 'visitor_city', g.city || '');
        setField(form, 'visitor_region', g.region || '');
        setField(form, 'visitor_country', g.country_name || '');
        setField(form, 'visitor_ip', g.ip || '');
      });
    }
  };
  if (cachedGeoStr) {
    try {
      applyGeo(JSON.parse(cachedGeoStr));
    } catch (_) {}
  } else {
    fetch('https://ipapi.co/json/')
      .then(r => r.ok ? r.json() : null)
      .then(g => {
        if (g && g.ip) {
          safeStorage.session.setItem('rpv_geo', JSON.stringify(g));
          applyGeo(g);
        }
      })
      .catch(() => {});
  }

/* ---------- Conditional course dropdown ---------- */
/* Shows a course selector when the visitor picks an IT-courses topic */
document.querySelectorAll('form.js-lead-form').forEach(form=>{
  const topic=form.querySelector('select[name="topic"], select[name="interest"]');
  const wrap=form.querySelector('[data-course-conditional]');
  if(!topic||!wrap)return;
  const check=()=>{const v=(topic.value||'').toLowerCase().trim();const show=v==='it courses & batches';wrap.style.setProperty('display',show?'block':'none','important');const inputs=wrap.querySelectorAll('input, select, textarea');inputs.forEach(inp=>{inp.disabled=!show;});};
  topic.addEventListener('change',check);check();
});

/* ---------- AJAX Form Submissions ---------- */
document.querySelectorAll('form.js-lead-form').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Submit';
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="spinner-inline" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation: spin 0.8s linear infinite; margin-right: 8px; vertical-align: middle; display: inline-block;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2v4"></path></svg>
        Submitting...
      `;
    }

    if (!document.getElementById('spin-anim-style')) {
      const s = document.createElement('style');
      s.id = 'spin-anim-style';
      s.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(s);
    }

    try {
      // Set time spent on page, timezone, OS, and Device type on submission
      const timeOnPage = Math.round((Date.now() - rpvPageLoadTime) / 1000);
      setField(form, 'time_on_page_seconds', timeOnPage.toString());
      setField(form, 'timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || '');
      setField(form, 'operating_system', getOS());
      setField(form, 'device_type', getDeviceType());

      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => {
        // Exclude redirect parameter and honeypot field from JSON payload
        if (key !== '_next' && key !== '_honey') {
          data[key] = value;
        }
      });

      let action = form.getAttribute('action') || 'https://formsubmit.co/f89e890a8c606cde8e0e84b29c03a3d2';

      // Ensure we hit FormSubmit's AJAX endpoint
      if (action.includes('formsubmit.co') && !action.includes('/ajax/')) {
        action = action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
      }

      // 1. Submit to custom webhook first in background (fire-and-forget, simple request, no-cors)
      const webhookUrl = window.rpvConfig?.webhookEndpoint;
      if (webhookUrl && webhookUrl.trim() !== '') {
        fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors', // Bypasses CORS response header checks in the browser
          headers: {
            'Content-Type': 'text/plain' // Simple request Content-Type to bypass preflight OPTIONS check
          },
          body: JSON.stringify(data)
        }).catch(err => console.warn("Background webhook submission failed:", err));
      }

      // 2. Submit to FormSubmit (as JSON to avoid CORS redirects)
      const response = await fetch(action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error("Submission server error");

      // Verify that FormSubmit didn't reject the submission internally
      const resJson = await response.json();
      if (resJson.success === "false" || resJson.success === false) {
        throw new Error(resJson.message || "FormSubmit rejected submission");
      }

      const pdfUrl = form.getAttribute('data-pdf-url');
      if (pdfUrl) {
        try {
          const dlLink = document.createElement('a');
          dlLink.href = pdfUrl;
          dlLink.target = '_blank';
          dlLink.rel = 'noopener';
          dlLink.download = '';
          document.body.appendChild(dlLink);
          dlLink.click();
          dlLink.remove();
        } catch(_) {}

        form.innerHTML = `
          <div style="text-align: center; padding: 2rem 1.2rem; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
            <div style="width: 56px; height: 56px; background: #e6f9f0; color: #10b981; border-radius: 50%; display: grid; place-items: center; margin: 0 auto 1.2rem auto; box-shadow: 0 4px 10px rgba(16,185,129,0.15);">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--ink); margin: 0 0 0.5rem 0;">Syllabus Dispatched!</h3>
            <p style="font-size: 0.92rem; color: var(--ink-soft); line-height: 1.5; margin: 0 0 1.25rem 0;">
              Your download is starting now. A copy has also been sent to your <strong>WhatsApp</strong> and <strong>Email</strong>.
            </p>
            <a href="${pdfUrl}" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border-radius:99px; text-decoration:none;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
              Click here if download doesn't start
            </a>
          </div>
        `;
      } else {
        form.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1.5rem; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
            <div style="width: 56px; height: 56px; background: #e6f9f0; color: #10b981; border-radius: 50%; display: grid; place-items: center; margin: 0 auto 1.5rem auto; box-shadow: 0 4px 10px rgba(16,185,129,0.15);">
              <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--ink); margin: 0 0 0.75rem 0;">Request Received!</h3>
            <p style="font-size: 0.92rem; color: var(--ink-soft); line-height: 1.5; margin: 0;">
              Thank you. Your details have been submitted securely. Our coordinator will contact you shortly.
            </p>
          </div>
        `;
      }

      const parentModal = form.closest('.rpv-modal');
      if (parentModal) {
        setTimeout(() => {
          if (parentModal.classList.contains('is-open')) {
            parentModal.classList.remove('is-open');
            document.body.classList.remove('modal-open');
          }
        }, 4500);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Submission failed. Please check your connection and try again.");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }
  });
});
})();
