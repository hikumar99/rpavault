/* RPAVault batch/fees config loader — v1
 * Pulls live pricing, batch dates and featured flags from a Google Sheet
 * (published through a free Google Apps Script web app), with a local
 * JSON fallback baked into the site so pages never look broken.
 *
 * HOW TO ACTIVATE THE GOOGLE SHEET:
 * 1. Follow /google-sheet/GOOGLE-SHEET-SETUP.md (in the delivery zip).
 * 2. Paste your Apps Script web-app URL below (ends with /exec).
 */
window.RPV_SHEET_URL = ''; /* <- paste GAS /exec URL here when ready */

(function(){
'use strict';
const FALLBACK_URL='/assets/data/courses.json';

function applyConfig(cfg){
  if(!cfg||!cfg.courses)return;
  const courses=cfg.courses;
  const selfSlug=document.body.getAttribute('data-course-slug')||'';
  /* 1) Text targets: <span data-cfg="slug.field">fallback</span> ; slug "self" = current course page */
  document.querySelectorAll('[data-cfg]').forEach(el=>{
    const key=el.getAttribute('data-cfg');if(!key)return;
    const dot=key.indexOf('.');if(dot<0)return;
    let slug=key.slice(0,dot);const field=key.slice(dot+1);
    if(slug==='self')slug=selfSlug;
    const c=courses[slug];if(!c)return;
    const v=c[field];
    if(v!==undefined&&v!==null&&String(v).trim()!==''){el.textContent=String(v).trim();}
  });
  /* 2) Course cards: <article data-course-card="slug"> gets .is-live + badge/batch text */
  document.querySelectorAll('[data-course-card]').forEach(card=>{
    const c=courses[card.getAttribute('data-course-card')];if(!c)return;
    const live=String(c.live).toLowerCase()==='true'||c.live===true;
    card.classList.toggle('is-live',live);
    const badge=card.querySelector('[data-live-badge]');
    if(badge){badge.style.display=live?'':'none';}
    const batch=card.querySelector('[data-batch-text]');
    if(batch&&c.next_batch){batch.textContent=c.next_batch;}
    const fee=card.querySelector('[data-fee-text]');
    if(fee&&c.fee){fee.textContent=c.fee;}
  });
  /* 3) Strike-through regular fee on course pages */
  document.querySelectorAll('[data-cfg-strike]').forEach(el=>{
    let slug=el.getAttribute('data-cfg-strike');if(slug==='self')slug=selfSlug;
    const c=courses[slug];
    if(c&&c.regular_fee){el.textContent=c.regular_fee;el.style.display='';}
  });
}

function load(url,onFail){
  fetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw 0;return r.json();}).then(applyConfig).catch(()=>{if(onFail)onFail();});
}
const sheet=(window.RPV_SHEET_URL||'').trim();
if(sheet){load(sheet,()=>load(FALLBACK_URL));}else{load(FALLBACK_URL);}
})();
