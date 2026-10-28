(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root=document.documentElement;
  const film=document.querySelector('#opening-film');
  const toggle=document.querySelector('#film-toggle');
  let manuallyPaused=reduced;
  let filmPlayPending=false;
  film.muted=true;
  film.defaultMuted=true;
  film.playsInline=true;
  film.loop=true;
  film.autoplay=!reduced;
  film.preload='auto';
  function syncFilmButton(){toggle.textContent=film.paused?'▷':'Ⅱ';toggle.setAttribute('aria-label',film.paused?'Play opening film':'Pause opening film');}
  function playFilm(){
    if(filmPlayPending||!film.paused)return;
    filmPlayPending=true;
    film.play().then(syncFilmButton).catch(syncFilmButton).finally(()=>{filmPlayPending=false;});
  }
  function resumeFilm(){if(!manuallyPaused&&!document.hidden)playFilm();}
  toggle.addEventListener('click',()=>{if(film.paused){manuallyPaused=false;playFilm();}else{manuallyPaused=true;film.pause();}});
  film.addEventListener('play',syncFilmButton);film.addEventListener('pause',syncFilmButton);
  document.querySelector('#film-fullscreen').addEventListener('click',()=>{const el=document.querySelector('.revised-hero');el.requestFullscreen?.().catch(()=>{});});
  // Start and resume from media/page lifecycle events, never from scrolling.
  film.addEventListener('loadeddata',resumeFilm);
  film.addEventListener('canplay',resumeFilm);
  addEventListener('pageshow',resumeFilm);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)film.pause();else resumeFilm();});
  if(reduced)film.pause();else resumeFilm();
  if(!('IntersectionObserver' in window))return;
  if(!reduced)root.classList.add('motion-ready');
  const reveal=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(isIntersecting){target.classList.add('visible');reveal.unobserve(target);}}),{threshold:.05});
  document.querySelectorAll('.section-heading,.hero-showcase,.planning-shell,.reasoning-workbench,.direct-grid,.robot-grid,.research-panel,.training-grid,.token-explainer,.closing').forEach(el=>{el.classList.add('reveal');reveal.observe(el);});
  function animate(card){
    if(reduced)return;
    const start=performance.now(),duration=1750;
    const values=Array.from(card.querySelectorAll('[data-count]'));
    const bars=Array.from(card.querySelectorAll('[data-height]'));
    function frame(now){
      const t=Math.min(1,(now-start)/duration),p=t*t*(3-2*t);
      values.forEach(el=>el.textContent=(Number(el.dataset.count)*p).toFixed(Number(el.dataset.decimals||1)));
      bars.forEach(el=>el.style.height=Number(el.dataset.height)*p+'%');
      if(t<1)requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  const charts=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){animate(e.target);charts.unobserve(e.target);}}),{threshold:.18});
  document.querySelectorAll('.metric-card').forEach(el=>charts.observe(el));
  const comparisons=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('chart-visible');comparisons.unobserve(e.target);}}),{threshold:.16});
  document.querySelectorAll('.benchmark-card').forEach(el=>comparisons.observe(el));
  const nav=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)document.querySelectorAll('.nav-links a').forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));}),{rootMargin:'-18% 0px -55% 0px'});
  document.querySelectorAll('#results,#visual-planning,#reasoning,#real-world,#method,#training').forEach(el=>nav.observe(el));
  const progress=document.querySelector('.reading-progress');
  let queued=false;
  function updateProgress(){const max=root.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;queued=false;}
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateProgress);}},{passive:true});updateProgress();
  if(!reduced&&matchMedia('(pointer: fine)').matches){const hero=document.querySelector('.revised-hero');hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();hero.style.setProperty('--orbit-x',((e.clientX-r.left)/r.width-.5)*18+'px');hero.style.setProperty('--orbit-y',((e.clientY-r.top)/r.height-.5)*18+'px');},{passive:true});}
})();
