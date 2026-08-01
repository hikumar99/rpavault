/* RPAVault site scripts — v3 */
(function(){
'use strict';

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
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'){closeNav();closeModal();closeConsultingModal();closeDiscoveryModal();}});
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
document.querySelectorAll('[data-open-callback]').forEach(el=>{el.addEventListener('click',(e)=>{if(modal){e.preventDefault();closeNav();openModal();}});});
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

/* ---------- Lead form enrichment ---------- */
/* Fills hidden fields on every .js-lead-form: source page, course page, browser, device, and (best-effort) location via ipapi.co */
function browserInfo(){const ua=navigator.userAgent;let b='Unknown';
if(/edg\//i.test(ua))b='Microsoft Edge';else if(/opr\//i.test(ua))b='Opera';else if(/chrome|crios/i.test(ua))b='Chrome';else if(/firefox|fxios/i.test(ua))b='Firefox';else if(/safari/i.test(ua))b='Safari';
const dev=/mobi|android|iphone|ipad/i.test(ua)?'Mobile':'Desktop';return b+' · '+dev;}
function setField(form,name,value){if(!value)return;let f=form.querySelector('input[name="'+name+'"]');if(!f){f=document.createElement('input');f.type='hidden';f.name=name;form.appendChild(f);}f.value=value;}
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
})();
