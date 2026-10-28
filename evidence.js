(() => {
  'use strict';
  const root=document.getElementById('paper-figures');
  const D=window.RYNN_DATA;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=s=>root.querySelector(s);
  let group='understanding', current=null;
  const saved={understanding:'understanding-1',grounding:'grounding-1'};

  function drawPoints(c){
    const points=c.points.map(p=>p.join(',')).join(' ');
    const path=c.dataset==='Trajectory'?`<polyline points="${points}"/>`:'';
    return `<svg class="evidence-points" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Model-predicted ${esc(c.dataset.toLowerCase())}">${path}${c.points.map((p,i)=>`<circle class="point-halo" cx="${p[0]}" cy="${p[1]}" r="17"/><circle cx="${p[0]}" cy="${p[1]}" r="6"/>${c.dataset==='Trajectory'?`<text x="${p[0]+16}" y="${p[1]-11}">${i+1}</text>`:''}`).join('')}</svg>`;
  }
  function selectCase(id){
    current=D.evidence.find(c=>c.id===id&&c.group===group)||D.evidence.find(c=>c.group===group);
    saved[group]=current.id;
    const c=current, spatial=group==='grounding', views=c.inputs.length;
    const imageMarkup=c.inputs.map((src,i)=>`<figure><div class="evidence-observation"><img src="${esc(src)}" alt="${views>1?`View ${i+1}`:'Input observation'} for ${esc(c.title)}" loading="lazy">${spatial?drawPoints(c):''}</div>${views>1?`<figcaption>View ${i+1}</figcaption>`:''}</figure>`).join('');
    const coords=spatial?c.points.map(p=>`(${p.join(', ')})`).join(' · '):'';
    const result=spatial?(c.points.length===1?'One contact point':c.dataset==='Trajectory'?`${c.points.length} ordered waypoints`:`${c.points.length} target points`):c.answer;
    $('#evidence-content').innerHTML=`<div class="evidence-visual"><div class="evidence-view-label"><span>${views>1?'MULTI-VIEW OBSERVATIONS':'GIVEN OBSERVATION'}</span>${spatial?'<button id="evidence-overlay" aria-pressed="true">Hide prediction</button>':''}</div><div class="evidence-images views-${views}">${imageMarkup}</div>${spatial?`<span class="evidence-legend"><i></i>Model-predicted ${esc(c.dataset.toLowerCase())}</span>`:'<span class="evidence-legend">Original observations from the paper</span>'}</div><div class="evidence-answer"><span class="evidence-dataset">${esc(c.dataset)}</span><h3>${esc(c.question)}</h3><div class="evidence-response"><span>${spatial?'SPATIAL OUTPUT':'ANSWER'}</span><strong>${esc(result)}</strong>${spatial?`<p class="evidence-coordinates">${esc(coords)}</p>`:''}</div><div class="evidence-source"><button data-paper-figure="${esc(c.figureId)}">View paper figure ↗</button><span>${String(D.evidence.filter(x=>x.group===group).findIndex(x=>x.id===c.id)+1).padStart(2,'0')} / 06</span></div></div>`;
    $('#evidence-cases').querySelectorAll('[data-evidence-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.evidenceCase===c.id)));
    $('#evidence-overlay')?.addEventListener('click',e=>{const show=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(show));e.currentTarget.textContent=show?'Hide prediction':'Show prediction';$('.evidence-points').toggleAttribute('hidden',!show);});
  }
  function selectGroup(value){
    group=value;
    root.dataset.activeGroup=group;
    root.querySelectorAll('[data-evidence-group]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.evidenceGroup===group)));
    $('#evidence-cases').innerHTML=D.evidence.filter(c=>c.group===group).map((c,i)=>`<button data-evidence-case="${esc(c.id)}" aria-pressed="false" aria-controls="evidence-content"><img src="${esc(c.inputs[0])}" alt="" loading="lazy"><span><small>${String(i+1).padStart(2,'0')} / ${esc(c.dataset)}</small>${esc(c.title)}</span></button>`).join('');
    selectCase(saved[group]);
  }
  root.addEventListener('click',e=>{const groupButton=e.target.closest('button[data-evidence-group]');const caseButton=e.target.closest('button[data-evidence-case]');if(groupButton)selectGroup(groupButton.dataset.evidenceGroup);else if(caseButton)selectCase(caseButton.dataset.evidenceCase);});
  selectGroup(group);
})();
