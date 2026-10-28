(() => {
  'use strict';
  const M=window.RYNN_RESEARCH,D=window.RYNN_DATA;
  const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const press=(selector,attribute,value)=>$$(selector).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attribute]===String(value))));
  const flash=el=>{if(!reduced&&el.animate)el.animate([{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});};
  $$('[data-architecture]').forEach(b=>b.addEventListener('click',()=>{
    const mode=b.dataset.architecture,v=M.architectures[mode];
    press('[data-architecture]','architecture',mode);$('.umm-diagram').dataset.mode=mode;
    $('#architecture-mode-label').textContent=v.label;$('#architecture-mode-copy').textContent=v.copy;
  }));
  function setGenerationMode(mode){
    press('button[data-generation-mode]','generationMode',mode);
    $('.token-explainer').dataset.generationMode=mode;
    const group=(label,count,noisy=false)=>`<div><small>${label}</small><div class="token-row">${Array.from({length:count},()=>`<i${noisy?' class="noise-token"':''}></i>`).join('')}</div></div>`;
    $('.main-token-layout').innerHTML=group(mode==='cross'?'Fixed prefix':'Fixed start',mode==='cross'?3:1)+group(mode==='fl2v'?'Noisy transition':'Noisy future',3,true)+(mode==='fl2v'?group('Fixed end',1):'');
  }
  $$('button[data-generation-mode]').forEach(b=>b.addEventListener('click',()=>setGenerationMode(b.dataset.generationMode)));setGenerationMode('cross');
  $('#animate-denoise').addEventListener('click',()=>{const el=$('.token-explainer');el.classList.remove('is-denoising');void el.offsetWidth;el.classList.add('is-denoising');});
  const user=(label,text)=>`<div class="supervision-turn user-turn"><span>${label} <small>context · no loss</small></span><p>${text}</p></div>`;
  const assistant=(label,text)=>`<div class="supervision-turn assistant-turn"><span>${label} <small>supervised</small></span><p>${text}</p></div>`;
  function setFormat(format){
    press('[data-format]','format',format);
    $('#supervision-sequence').innerHTML=format==='planning'
      ?user('USER','Task + initial observation + recent subtask history + current observation')+assistant('ASSISTANT','<code>&lt;subplan&gt;</code><code>&lt;world_modeling&gt;</code><code>&lt;duration&gt;</code>')
      :user('USER','Observation + embodied question')+assistant('ASSISTANT','Video prompt + duration')+user('USER','Ground-truth video as context')+assistant('ASSISTANT','Reasoning + final answer');
  }
  $$('[data-format]').forEach(b=>b.addEventListener('click',()=>setFormat(b.dataset.format)));setFormat('planning');
  function setStrategy(key){
    const v=M.strategies[key];press('button[data-strategy]','strategy',key);$('#self-forcing-visual').dataset.strategy=key;
    $('#condition-source-title').textContent=v.title;$('#condition-source-note').textContent=v.note;
    $$('.history-source').forEach(n=>n.textContent=v.history);$('#endpoint-source').textContent=v.endpoint;
    $('#self-forcing-copy').textContent=v.copy;flash($('#self-forcing-visual'));
  }
  $$('button[data-strategy]').forEach(b=>b.addEventListener('click',()=>setStrategy(b.dataset.strategy)));setStrategy('degrade');

  let route='G',phase=0,playing=false,timer=null;
  let flowAutoPlayed=false,flowInteracted=false,flowVisible=false;
  const evidence=$('#agentic-evidence'),canvas=$('.agentic-canvas');
  const gCase=D.generated.find(c=>c.id==='g2'),dCase=D.direct[0];
  evidence.poster=gCase.poster;evidence.src=gCase.video;evidence.muted=true;
  function stopFlow(){clearTimeout(timer);timer=null;playing=false;canvas.classList.remove('playing');$('#agentic-play').textContent='▶ Play flow';$('#agentic-play').setAttribute('aria-label','Play agentic walkthrough');evidence.pause();}
  function renderPhase(){
    const steps=M.routes[route],step=steps[phase];
    $$('[data-node]').forEach(n=>{n.classList.toggle('is-active',step.nodes.includes(n.dataset.node));n.classList.toggle('is-complete',steps.slice(0,phase).some(s=>s.nodes.includes(n.dataset.node)));});
    $$('[data-edge]').forEach(p=>p.classList.toggle('is-active',step.edges.includes(p.dataset.edge)));
    $('#agentic-phase-label').textContent=step.label;$('#agentic-phase-copy').textContent=step.copy;
    $('#agentic-step-count').textContent=`${String(phase+1).padStart(2,'0')} / ${String(steps.length).padStart(2,'0')}`;
    $('#agentic-steps').innerHTML=steps.map((s,i)=>`<button data-flow-step="${i}" aria-label="Step ${i+1}: ${esc(s.label)}" aria-current="${i===phase?'step':'false'}"><i></i></button>`).join('');
    $('#agentic-next').disabled=phase===steps.length-1;
    $('#agentic-graph-answer').textContent=phase===steps.length-1?(route==='G'?gCase:dCase).answer.replace(/^[A-D]\.\s*/,''):'Answer';
    if(route==='G'&&step.nodes.includes('video')&&playing){evidence.currentTime=0;evidence.play().catch(()=>{});}else evidence.pause();
  }
  function schedule(){timer=setTimeout(()=>{if(!playing)return;if(phase>=M.routes[route].length-1){stopFlow();return;}phase++;renderPhase();schedule();},phase===4&&route==='G'?2400:1900);}
  function startFlow(){clearTimeout(timer);if(phase===M.routes[route].length-1)phase=0;playing=true;canvas.classList.add('playing');$('#agentic-play').textContent='Ⅱ Pause flow';$('#agentic-play').setAttribute('aria-label','Pause agentic walkthrough');renderPhase();schedule();}
  function autoplayFlow(){if(flowAutoPlayed||flowInteracted||!flowVisible||document.hidden||reduced)return;flowAutoPlayed=true;phase=0;startFlow();}
  $('#agentic-lab').addEventListener('click',()=>{flowInteracted=true;},true);
  function selectRoute(value){stopFlow();route=value;phase=0;press('button[data-route]','route',value);canvas.dataset.route=value;const c=value==='G'?gCase:dCase;$('#agentic-example-label').textContent=c.title;$('#agentic-example-question').textContent=c.question;renderPhase();}
  $$('button[data-route]').forEach(b=>b.addEventListener('click',()=>selectRoute(b.dataset.route)));
  $('#agentic-play').addEventListener('click',()=>{if(playing){stopFlow();return;}startFlow();});
  $('#agentic-next').addEventListener('click',()=>{stopFlow();phase=Math.min(phase+1,M.routes[route].length-1);renderPhase();});
  $('#agentic-reset').addEventListener('click',()=>{stopFlow();phase=0;renderPhase();});
  $('#agentic-steps').addEventListener('click',e=>{const b=e.target.closest('[data-flow-step]');if(b){stopFlow();phase=Number(b.dataset.flowStep);renderPhase();}});
  $$('[data-node]').forEach(b=>b.addEventListener('click',()=>{const i=M.routes[route].findIndex(s=>s.nodes.includes(b.dataset.node));if(i<0)return;stopFlow();phase=i;renderPhase();}));
  selectRoute('G');

  let wamTimer=null,wamRunning=false;
  function stopWam(){clearTimeout(wamTimer);wamTimer=null;wamRunning=false;$('#wam-play').textContent='▶ Trace the action path';$('.wam-graph').classList.remove('playing');}
  function clearWam(){stopWam();$$('[data-wam-node]').forEach(n=>n.classList.remove('is-active'));}
  function setWamStage(key){
    clearWam();const s=M.wamStages[key];$('.wam-graph').dataset.stage=key;press('[data-wam-stage]','wamStage',key);
    [['reasoner',s.reasoner],['generator',s.generator],['action',s.action]].forEach(([name,text])=>{const n=$('#wam-'+name+'-status');n.textContent=text;n.className='parameter-tag '+(text.startsWith('Train')?'train':'frozen');});
    $('#wam-training-copy').textContent=s.copy;
  }
  $$('[data-wam-stage]').forEach(b=>b.addEventListener('click',()=>setWamStage(b.dataset.wamStage)));setWamStage('3');
  $('#wam-play').addEventListener('click',()=>{
    if(wamRunning){stopWam();return;}setWamStage('3');wamRunning=true;$('.wam-graph').classList.add('playing');$('#wam-play').textContent='Ⅱ Pause tracing';let i=0;
    function advance(){if(!wamRunning)return;const s=M.wamFlow[i];$$('[data-wam-node]').forEach(n=>n.classList.toggle('is-active',n.dataset.wamNode===s.node));$('#wam-flow-copy').textContent=s.copy;i++;if(i<M.wamFlow.length)wamTimer=setTimeout(advance,1700);else wamTimer=setTimeout(stopWam,1800);}advance();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopFlow();stopWam();}else autoplayFlow();});
  if('IntersectionObserver'in window){
    const flowObserver=new IntersectionObserver(es=>es.forEach(e=>{flowVisible=e.isIntersecting&&e.intersectionRatio>=.2;if(!e.isIntersecting)stopFlow();else autoplayFlow();}),{threshold:[0,.2]});
    flowObserver.observe(canvas);
    const wamObserver=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)stopWam();}),{threshold:.04});
    wamObserver.observe($('#wam-lab'));
  }
})();
