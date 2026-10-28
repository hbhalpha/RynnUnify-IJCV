(() => {
  'use strict';
  const D = window.RYNN_DATA;
  const $ = s => document.querySelector(s);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const playIcon = `<span class="play-icon">${icon('play')}</span>`;
  const dialog = $('#media-dialog');
  const videoObserver = new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(target.id!=='opening-film'&&!isIntersecting&&!dialog.contains(target))target.pause();}),{threshold:.05});
  let previousFocus = null;
  let plan = D.planning.find(p=>p.id===new URLSearchParams(location.search).get('plan')) || D.planning[0];
  let lastActiveStep = -1;

  function showDialog(title, label, content, caption = '') {
    previousFocus = document.activeElement;
    document.querySelectorAll('video:not(#opening-film)').forEach(v => v.pause());
    $('#dialog-title').textContent = title;
    $('#dialog-label').textContent = label;
    $('#dialog-content').innerHTML = content;
    $('#dialog-caption').textContent = caption;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    $('#dialog-close').focus();
  }
  function openVideo(item, label) {
    const speeds = /ROBOT/.test(label) ? '<label class="playback-control">Playback speed<select id="playback-speed" aria-label="Playback speed"><option value="1">1× · original speed</option><option value="2">2×</option><option value="4">4×</option></select></label>' : '';
    showDialog(item.title, label, `<video controls autoplay playsinline preload="metadata" poster="${esc(item.poster)}" src="${esc(item.video)}" aria-label="${esc(item.title)}"></video>${speeds}`, item.task || '');
    const v = $('#dialog-content video');
    $('#playback-speed')?.addEventListener('change',e=>{v.playbackRate=Number(e.target.value);});
    v.play().catch(() => {});
  }
  function cleanupDialog() {
    $('#dialog-content').querySelectorAll('video').forEach(v => { v.pause(); v.removeAttribute('src'); v.load(); });
    $('#dialog-content').replaceChildren();
    document.body.style.overflow = '';
    if(previousFocus?.isConnected)previousFocus.focus?.();
  }
  $('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', cleanupDialog);
  dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });

  $('#plan-select').innerHTML = D.planning.map(c => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');
  const player = $('#plan-player');
  function seekPlan(time){
    const seek=()=>{player.currentTime=time;player.play().catch(()=>{});};
    if(player.readyState>=1)seek();else{player.addEventListener('loadedmetadata',seek,{once:true});player.load();}
  }
  $('#plan-video-previews').addEventListener('click',e=>{const b=e.target.closest('[data-preview-time]');if(b)seekPlan(Number(b.dataset.previewTime));});
  function selectPlan(id) {
    player.pause();
    plan = D.planning.find(c => c.id === id) || D.planning[0];
    $('#plan-select').value=plan.id;
    $('#plan-title').textContent = plan.title;
    $('#plan-goal').textContent = plan.task;
    $('#current-subtask').textContent = plan.steps[0]?.text || '';
    player.poster = plan.poster;
    player.src = plan.video;
    player.load();
    const previews=plan.previewFrames||[];
    $('#plan-video-previews').hidden=!previews.length;
    $('#plan-video-previews').innerHTML=previews.length?`<div class="video-preview-frames">${previews.map((f,i)=>`<button data-preview-time="${f.sourceTime}" aria-label="Play from preview frame ${i+1}" aria-pressed="${i===0}"><img src="${esc(f.image)}" alt="" loading="lazy"><small>${String(i+1).padStart(2,'0')}</small></button>`).join('')}</div>`:'';
    $('#plan-steps').innerHTML = plan.steps.map((s,i) => `<button class="plan-step" data-step="${i}" ${i===0 ? 'aria-current="step"' : ''} aria-label="Inspect step ${i+1}: ${esc(s.text)}"><span class="step-num">${String(i+1).padStart(2,'0')}</span><span class="step-copy">${esc(s.text)}</span>${s.poster ? `<img src="${esc(s.poster)}" alt="Generated scene for step ${i+1}" loading="lazy">` : ''}</button>`).join('');
    $('#plan-steps').scrollTop = 0;
    lastActiveStep = -1;
    $('#active-plan-step').textContent = `01 / ${String(plan.steps.length).padStart(2,'0')}`;
    $('#plan-progress-fill').style.transform = 'scaleX(0)';
  }
  $('#plan-select').addEventListener('change', e => selectPlan(e.target.value));
  $('#plan-steps').addEventListener('click', e => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const start = plan.steps[Number(b.dataset.step)].start;
    seekPlan(start);
  });
  player.addEventListener('timeupdate', () => {
    let previewIndex=0;
    (plan.previewFrames||[]).forEach((f,i)=>{if(player.currentTime+.05>=f.sourceTime)previewIndex=i;});
    $('#plan-video-previews').querySelectorAll('[data-preview-time]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===previewIndex)));
    let active = 0;
    plan.steps.forEach((s,i) => { if (player.currentTime + 0.05 >= s.start) active = i; });
    $('#current-subtask').textContent=plan.steps[active]?.text || '';
    $('#active-plan-step').textContent=`${String(active+1).padStart(2,'0')} / ${String(plan.steps.length).padStart(2,'0')}`;
    $('#plan-progress-fill').style.transform=`scaleX(${Math.min(1,player.currentTime/(player.duration||plan.duration||1))})`;
    if(active!==lastActiveStep && !player.paused) {
      const list=$('#plan-steps'),button=list.querySelector(`[data-step="${active}"]`);
      if(button&&!list.matches(':hover'))list.scrollTop+=button.getBoundingClientRect().top-list.getBoundingClientRect().top-list.clientHeight/2+button.clientHeight/2;
    }
    lastActiveStep=active;
    $('#plan-steps').querySelectorAll('[data-step]').forEach((b,i) => { if (i===active) b.setAttribute('aria-current','step'); else b.removeAttribute('aria-current'); });
  });
  selectPlan(plan.id);

  $('#case-picker').innerHTML = D.generated.map(c => `<button class="case-choice" data-case="${esc(c.id)}" aria-pressed="${c.id==='g2'}" aria-controls="case-detail"><img src="${esc(c.inputs[0])}" alt="" loading="lazy"><span>${esc(c.label)}<small>${esc(c.title.replace('Rynn-GEU · ',''))}</small></span></button>`).join('');
  let selectedCase = D.generated[0];
  function selectCase(id) {
    const old=$('#case-detail video');
    if(old){old.pause();videoObserver.unobserve(old);}
    selectedCase = D.generated.find(c => c.id === id) || D.generated[0];
    const c = selectedCase;
    $('#case-picker').querySelectorAll('[data-case]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.case === id)));
    $('#case-detail').innerHTML = `<div class="reasoning-context"><div class="case-meta"><span>${esc(c.title)}</span><span class="mode-tag">${c.mode.toUpperCase()}</span></div><h3 class="case-question">${esc(c.question)}</h3><div class="input-views ${c.inputs.length===1 ? 'single' : ''}">${c.inputs.map((src,i) => `<img src="${esc(src)}" alt="Given observation ${i+1}" loading="lazy">`).join('')}</div><p class="input-label">${c.inputs.length>1 ? 'Given views 1 and 2' : 'Given observation'}</p><div class="prompt-block"><h4>G → VIDEO PROMPT <span>(abridged)</span></h4><p>${esc(c.prompt)}</p></div></div><div class="reasoning-output"><span class="small-label">MODEL-GENERATED VIDEO</span><video controls loop playsinline preload="none" poster="${esc(c.poster)}" src="${esc(c.video)}" aria-label="Generated video: ${esc(c.question)}"></video><div class="video-meta"><button id="replay-prediction">Replay ↻</button></div><div class="answer-line"><span class="answer-label">ANSWER</span><strong>${esc(c.answer.replace(/^[A-D]\.\s*/,''))}</strong>${c.points.length ? '<button class="coordinate-button" id="show-coordinates">View prediction ↗</button>' : ''}</div></div>`;
    $('#show-coordinates')?.addEventListener('click', () => showCoordinates(c));
    $('#replay-prediction').addEventListener('click',()=>{const v=$('#case-detail video');v.currentTime=0;v.play().catch(()=>{});});
    videoObserver.observe($('#case-detail video'));
  }
  function showCoordinates(c) {
    const input = $('#case-detail .input-views img');
    const ratio = input.naturalWidth / input.naturalHeight || 4/3;
    const pts = c.points.map(p => p.join(',')).join(' ');
    const polyline = c.category==='grounding' && /Trajectory/.test(c.title) ? `<polyline points="${pts}" fill="none"/>` : '';
    const circles = c.points.map((p,i) => `<circle cx="${p[0]}" cy="${p[1]}" r="7"/>${i===0 || i===c.points.length-1 ? `<text x="${p[0]+11}" y="${p[1]-8}" fill="white" stroke="#624487" stroke-width="1" font-size="22">${i+1}</text>` : ''}`).join('');
    showDialog(c.title, 'MODEL-PREDICTED COORDINATES', `<div class="prediction-image" style="width:min(100%,${70*ratio}svh)"><img src="${esc(c.inputs[0])}" alt="Input observation with model-predicted points"><svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Predicted points">${polyline}${circles}</svg></div><p class="coordinate-text">${esc(c.originalAnswer)}</p>`, 'Coordinates are normalized to 0–1000 on the original input image.');
  }
  $('#case-picker').addEventListener('click', e => { const b = e.target.closest('[data-case]'); if (b) selectCase(b.dataset.case); });
  selectCase('g2');

  $('#direct-grid').innerHTML = D.direct.map(c => `<article class="direct-card">${c.observationVideo ? `<button class="direct-visual video-observation" data-observation="${esc(c.id)}" aria-label="Play observed video for ${esc(c.title)}"><img src="${esc(c.inputs[0])}" alt="Observed video frame" loading="lazy">${playIcon}</button>` : `<div class="direct-visual ${c.inputs.length>1?'two':''}">${c.inputs.map((src,i)=>`<img src="${esc(src)}" alt="Given observation ${i+1}" loading="lazy">`).join('')}</div>`}<div><span class="small-label">${esc(c.title)}</span><h4>${esc(c.question)}</h4><p class="direct-answer"><span>D →</span>${esc(c.answer.replace(/^[A-D]\.\s*/,''))}</p></div></article>`).join('');
  $('#direct-grid').addEventListener('click', e => { const b=e.target.closest('[data-observation]'); if (b) { const c=D.direct.find(x=>x.id===b.dataset.observation); openVideo({title:c.question,video:c.observationVideo,poster:c.inputs[0]},'GIVEN OBSERVATION · DIRECT ANSWERING'); } });

  $('#robot-grid').innerHTML = D.robots.map((c,i) => `<article class="robot-card"><button class="robot-media" data-robot="${esc(c.id)}" aria-label="Play ${esc(c.title)}"><img src="${esc(c.poster)}" alt="${esc(c.title)} robot demonstration" loading="lazy">${playIcon}</button><h3><span>(${String.fromCharCode(97+i)})</span>${esc(c.title)}</h3><p class="robot-capability">${esc(c.capability)}</p><p class="robot-task">${esc(c.task)}</p><button class="robot-watch" data-robot="${esc(c.id)}">Watch full demonstration ↗</button></article>`).join('');
  $('#robot-grid').addEventListener('click', e => { const b=e.target.closest('[data-robot]'); if (b) openVideo(D.robots.find(c=>c.id===b.dataset.robot),'RECORDED REAL-ROBOT EXECUTION'); });

  function renderResearchFigure(id,target) {
    const f=D.figures.find(x=>x.id===id);
    $('#'+target).innerHTML=figureMarkup(f,'zoom-source-'+id);
    $('#zoom-source-'+id).addEventListener('click',()=>openFigure(f));
  }
  [['architecture','source-architecture'],['training','source-training'],['agentic','source-agentic'],['wam','source-wam']].forEach(([id,target])=>renderResearchFigure(id,target));

  function figureMarkup(f,id){return `<button class="figure-button" id="${id}" aria-label="Enlarge ${esc(f.title)}"><img src="${esc(f.image)}" alt="${esc(f.title)}" loading="lazy"><span class="zoom-chip">${icon('zoom')}Enlarge figure</span></button><div class="figure-caption"><p class="method-description">${esc(f.description||'Task illustrations followed by the original real-robot execution sequences.')}</p><a class="pdf-link" href="${esc(f.pdf)}" target="_blank" rel="noopener">Original PDF ↗</a></div>`;}
  $('#robot-case-figure').innerHTML=figureMarkup(D.robotFigure,'zoom-robot-cases');
  $('#zoom-robot-cases').addEventListener('click',()=>openFigure({...D.robotFigure,description:'Left: AI-refined task illustrations. Right: original real-robot video frames.'}));
  function openFigure(f){
    showDialog(f.title,'FROM THE PAPER',`<div class="figure-reader-tools"><div><button id="figure-zoom-out" aria-label="Zoom out">−</button><output id="figure-zoom-level" aria-live="polite">100%</output><button id="figure-zoom-in" aria-label="Zoom in">+</button><button id="figure-fit">Fit width</button></div><a href="${esc(f.pdf)}" target="_blank" rel="noopener">Original PDF ↗</a></div><div class="figure-reader" tabindex="0" aria-label="Scrollable research figure"><img src="${esc(f.image)}" alt="${esc(f.title)}"></div>`,f.description||'');
    let zoom=100;
    function setZoom(value){zoom=Math.max(100,Math.min(300,value));$('#dialog-content .figure-reader img').style.width=zoom+'%';$('#figure-zoom-level').value=zoom+'%';$('#figure-zoom-out').disabled=zoom===100;$('#figure-zoom-in').disabled=zoom===300;}
    $('#figure-zoom-out').addEventListener('click',()=>setZoom(zoom-25));
    $('#figure-zoom-in').addEventListener('click',()=>setZoom(zoom+25));
    $('#figure-fit').addEventListener('click',()=>setZoom(100));
    setZoom(100);
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-paper-figure]');if(!b)return;const f=[...D.gallery,...D.figures].find(x=>x.id===b.dataset.paperFigure);if(f)openFigure(f);});

  document.querySelectorAll('[data-resource]').forEach(a=>{const url=window.PROJECT_LINKS?.[a.dataset.resource];if(url&&/^https?:\/\//.test(url)){a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.removeAttribute('aria-disabled');}else{a.setAttribute('title','Project link to be added');a.removeAttribute('href');}});
  document.documentElement.dataset.theme='dark';
  $('#menu-toggle').addEventListener('click',()=>{const open=$('#nav-links').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').setAttribute('aria-label',open?'Close navigation':'Open navigation');});
  $('#nav-links').addEventListener('click',e=>{if(e.target.closest('a')){$('#nav-links').classList.remove('open');$('#menu-toggle').setAttribute('aria-expanded','false');}});
  document.addEventListener('play',e=>{if(e.target.tagName==='VIDEO'&&e.target.id!=='opening-film')document.querySelectorAll('video:not(#opening-film)').forEach(v=>{if(v!==e.target)v.pause();});},true);
  document.querySelectorAll('video:not(#opening-film)').forEach(v=>videoObserver.observe(v));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());});
})();
