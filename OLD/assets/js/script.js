const navToggle=document.querySelector('[data-nav-toggle]');
const siteNav=document.querySelector('[data-site-nav]');
const services=document.querySelector('[data-services]');
const servicesTrigger=document.querySelector('[data-services-trigger]');
navToggle?.addEventListener('click',()=>{const open=siteNav.classList.toggle('is-open');navToggle.setAttribute('aria-expanded',String(open));});
servicesTrigger?.addEventListener('click',(event)=>{event.preventDefault();services.classList.toggle('is-open');servicesTrigger.setAttribute('aria-expanded',String(services.classList.contains('is-open')));});
document.querySelectorAll('a[href="#"]').forEach(a=>a.addEventListener('click',e=>e.preventDefault()));
const yearTarget=document.querySelector('[data-current-year]'); if(yearTarget){yearTarget.textContent=new Date().getFullYear();}
const closeNav=()=>{if(siteNav&&siteNav.classList.contains('is-open')){siteNav.classList.remove('is-open');navToggle?.setAttribute('aria-expanded','false');services?.classList.remove('is-open');servicesTrigger?.setAttribute('aria-expanded','false');}};
document.addEventListener('click',(e)=>{if(siteNav&&siteNav.classList.contains('is-open')&&!siteNav.contains(e.target)&&!navToggle.contains(e.target)){closeNav();}});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'){closeNav();}});
siteNav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeNav()));

// Scroll-in reveal animations
const revealEls=document.querySelectorAll('.reveal');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if('IntersectionObserver' in window && !reduceMotion){
  const io=new IntersectionObserver((entries)=>{entries.forEach((entry)=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target);}});},{threshold:.15,rootMargin:'0px 0px -40px 0px'});
  revealEls.forEach((el,i)=>{el.style.transitionDelay=((i%3)*90)+'ms';io.observe(el);});
}else{revealEls.forEach((el)=>el.classList.add('is-visible'));}

// Keyboard support: close services menu with Escape while focused inside
services?.addEventListener('keydown',(e)=>{if(e.key==='Escape'){services.classList.remove('is-open');servicesTrigger?.setAttribute('aria-expanded','false');servicesTrigger?.focus();}});
