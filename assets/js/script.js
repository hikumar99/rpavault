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
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'){closeNav();closeModal();closeConsultingModal();closeDiscoveryModal();closeCollegeModal();closeCorporateModal();}});
siteNav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeNav()));
services?.addEventListener('keydown',(e)=>{if(e.key==='Escape'){services.classList.remove('is-open');servicesTrigger?.setAttribute('aria-expanded','false');servicesTrigger?.focus();}});

/* ---------- Scroll-in reveal ---------- */
const revealEls=document.querySelectorAll('.reveal');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if('IntersectionObserver' in window && !reduceMotion){
  const io=new IntersectionObserver((entries)=>{entries.forEach((entry)=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}});},{threshold:.15,rootMargin:'0px 0px -40px 0px'});
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
  });
  /* Location lookup (free, no key). Cached per session; fails silently. */
  const cached=sessionStorage.getItem('rpv_geo');
  const applyGeo=(g)=>{leadForms.forEach(form=>{setField(form,'visitor_city',g.city||'');setField(form,'visitor_region',g.region||'');setField(form,'visitor_country',g.country_name||'');setField(form,'visitor_ip',g.ip||'');});};
  if(cached){try{applyGeo(JSON.parse(cached));}catch(_){}}
  else{fetch('https://ipapi.co/json/').then(r=>r.ok?r.json():null).then(g=>{if(g&&g.ip){sessionStorage.setItem('rpv_geo',JSON.stringify(g));applyGeo(g);}}).catch(()=>{});}
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
