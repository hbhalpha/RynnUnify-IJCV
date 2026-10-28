(function(root){
  'use strict';
  const routes={
    D:[
      {label:'Observe',nodes:['input'],edges:[],copy:'Read the question and visual observations.'},
      {label:'Understand',nodes:['reason'],edges:['observe'],copy:'The agent interprets the scene and question.'},
      {label:'Choose D',nodes:['route'],edges:['route'],copy:'Choose D to answer from the observations.'},
      {label:'Answer directly',nodes:['answer'],edges:['direct'],copy:'Return the answer without generating video.'}
    ],
    G:[
      {label:'Observe',nodes:['input'],edges:[],copy:'Read the question and visual observations.'},
      {label:'Understand',nodes:['reason'],edges:['observe'],copy:'The additional agent reasons over the input.'},
      {label:'Choose G',nodes:['route'],edges:['route'],copy:'Choose G to request visual evidence.'},
      {label:'Write the request',nodes:['prompt'],edges:['request'],copy:'Write the expected scene evolution and duration.'},
      {label:'Predict video',nodes:['generator','video'],edges:['generate','video'],copy:'Frozen RynnUnify predicts a video from the prompt and observations.'},
      {label:'Interpret the evidence',nodes:['interpret'],edges:['interpret'],copy:'Interpret the predicted video alongside the original question.'},
      {label:'Answer',nodes:['answer'],edges:['answer'],copy:'Answer using the returned visual evidence.'}
    ]
  };
  const architectures={
    understand:{label:'01 / UNDERSTAND',copy:'Interpret language, images, and video for embodied answers and spatial grounding.'},
    generate:{label:'02 / GENERATE',copy:'Condition on the reasoner and fixed scene memory; denoise the future video.'},
    plan:{label:'03 / PLAN',copy:'Predict a subplan, video prompt, and duration; use the generated endpoint to continue.'}
  };
  const strategies={
    degrade:{title:'Selected visual conditions',note:'Noise + optional blur, before VAE encoding',history:'Selected history',endpoint:'Selected condition',copy:'Perturb selected condition frames; retain the initial anchor and GT future target.'},
    endpoint:{title:'Offline-generated preceding clip',note:'One-time offline cache',history:'GT history',endpoint:'Generated endpoint',copy:'Use the cached final frame as the start; keep the original history.'},
    history:{title:'Offline-generated preceding clips',note:'Cached history · same condition assembly',history:'Generated history',endpoint:'Generated endpoint',copy:'Use cached clips for history and start, with unchanged memory selection and encoding.'}
  };
  const wamStages={
    1:{reasoner:'Train language layers',generator:'Frozen',action:'Not used',copy:'Subtask and skill supervision trains the language layers; visual encoder and generator stay frozen.',pose:false},
    2:{reasoner:'Frozen',generator:'Trainable',action:'Not used',copy:'Train video and native action prediction with equal flow-matching weights; freeze the reasoner.',pose:false},
    3:{reasoner:'Frozen',generator:'Trainable',action:'Trainable',copy:'Train generator, action head, and pose head; freeze reasoner and the original action output layer.',pose:true}
  };
  const wamFlow=[
    {node:'input',copy:'Read the task, current observations, and visual history.'},
    {node:'reasoner',copy:'The reasoner produces a continuous subtask latent.'},
    {node:'generator',copy:'Predict video from the latent plan and current observations.'},
    {node:'features',copy:'After one denoising step, read video features in a second generator pass.'},
    {node:'action',copy:'Cross-attend to video features and sample an action chunk.'}
  ];
  const api={routes,architectures,strategies,wamStages,wamFlow};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RYNN_RESEARCH=api;
})(typeof window==='undefined'?globalThis:window);
