const rootURL=new URL('.',import.meta.url);
export const profiles={openclaw:{name:'OpenClaw',logo:'openclaw-color.svg'},grokbot:{name:'Grok Bot',logo:'grok.svg'},hermes:{name:'Hermes Agent',logo:'hermesagent.svg'},'claude-ai':{name:'Claude.ai',logo:'claude-color.svg'},'claude-code':{name:'Claude Code',logo:'claudecode-cover.svg'},codex:{name:'Codex',logo:'codex-color.svg'},opencode:{name:'opencode',logo:'opencode-cover.svg'},pi:{name:'pi',logo:'pi-cover.svg'},cursor:{name:'Cursor',logo:'cursor-cover.svg'},gemini:{name:'Gemini CLI',logo:'gemini-color.svg'},other:{name:'Other',logo:'other-cover.svg'}};
const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('agent-covers.css',rootURL);document.head.append(style);
// Geist Pixel has a single weight: gently trim glyph edges without shrinking the title.
const typeFilters=document.createElementNS('http://www.w3.org/2000/svg','svg');
typeFilters.setAttribute('width','0');typeFilters.setAttribute('height','0');
typeFilters.setAttribute('aria-hidden','true');typeFilters.style.position='absolute';
typeFilters.innerHTML='<defs><filter id="cover-type-light" x="-5%" y="-10%" width="110%" height="120%"><feMorphology in="SourceGraphic" operator="erode" radius="0.35"/></filter></defs>';
document.body.append(typeFilters);
export function createAgentCover(host,id='openclaw'){
 host.classList.add('agent-cover');host.setAttribute('role','img');
 const canvas=document.createElement('canvas');canvas.ariaHidden='true';host.append(canvas);
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let current='',requested='',revision=0,frame=0,visible=false,last=0,w=311,h=281,mx=-500,my=-500;
 // Prepare the actual image nodes up front, then reuse them on every switch.
 const logos=new Map(Object.entries(profiles).map(([key,p])=>{
  const image=new Image();image.className='agent-cover__logo';image.alt='';
  image.src=new URL('assets/'+p.logo,rootURL);
  const entry={image,ready:false};
  entry.promise=image.decode().then(()=>{entry.ready=true;return true;},()=>false);
  return [key,entry];
 }));
 function draw(time=0){
  if(time-last<33&&!reduced.matches){frame=requestAnimationFrame(draw);return;}last=time;
  ctx.clearRect(0,0,w,h);ctx.textAlign='center';
  const t=reduced.matches?0:time*.001;
  // Fixed dots: short horizontal groups share a pulse, with slight per-dot lag.
  const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
  const spacing=4;
  for(let row=-1;row<h/spacing+1;row++)for(let col=-1;col<w/spacing+1;col++){
   const x=col*spacing,y=row*spacing;
   const seed=hash(col,row),groupSize=4+Math.floor(hash(row,91)*3);
   const offset=Math.floor(hash(row,17)*groupSize);
   const group=Math.floor((col+offset)/groupSize);
   const member=((col+offset)%groupSize+groupSize)%groupSize;
   const groupSeed=hash(group,row),rate=.8+hash(group+81,row-29)*1.3;
   const phase=(t-member*.018)*rate+groupSeed*19,step=Math.floor(phase),blend=phase-step;
   const ease=blend*blend*(3-2*blend);
   const pulse=hash(group+step*13,row+step*7)*(1-ease)+hash(group+(step+1)*13,row+(step+1)*7)*ease;
   const brightness=pulse*(.88+seed*.12);
   const center=1-.3*Math.exp(-Math.pow((y-h*.5)/(h*.1),2));
   // Keep the original grid density; spend more of each group's cycle in its bright state.
   const lit=Math.max(0,Math.min(1,(brightness-.12)/.5));
   const alpha=(.1+lit*lit*(3-2*lit)*.86)*center;
   ctx.fillStyle=`rgba(255,255,255,${alpha})`;
   const size=seed>.85?1.5:1;
   ctx.fillRect(x,y,size,size);
  }
  if(visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(draw);else frame=0;
 }
 function resume(){cancelAnimationFrame(frame);frame=0;host.toggleAttribute('data-paused',!visible||document.hidden||reduced.matches);if(visible&&!document.hidden)draw(performance.now());}
 const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;resume();});io.observe(host);
 const ro=new ResizeObserver(()=>{w=host.clientWidth;h=host.clientHeight;const d=Math.min(devicePixelRatio,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);resume();});ro.observe(host);
 host.addEventListener('pointermove',e=>{const r=host.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;});host.addEventListener('pointerleave',()=>{mx=my=-500;});
 document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);
 function setAgent(next){
  if(!profiles[next])return;
  requested=next;const ticket=++revision;
  if(next===current)return;
  const entry=logos.get(next);
  const show=()=>{
  if(ticket!==revision||requested!==next)return;
  current=next;const p=profiles[next];host.dataset.agent=next;host.setAttribute('aria-label',p.name+' animated cover');
  host.querySelectorAll('.agent-cover__layer').forEach(n=>n.remove());
  const layer=document.createElement('div');layer.className='agent-cover__layer';
  const logo=entry.image;
  const title=document.createElement('span');title.className='agent-cover__title';title.textContent=p.name;
  const dots=document.createElement('div');dots.className='agent-cover__static-dots';dots.ariaHidden='true';
  const blur=document.createElement('div');blur.className='agent-cover__blur';blur.ariaHidden='true';
  for(let i=0;i<3;i++)blur.append(document.createElement('i'));
  layer.append(canvas,logo,dots,blur,title);host.prepend(layer);
  };
  if(entry.ready)show();else entry.promise.then(ok=>{if(ok)show();});
 }
 setAgent(id);return {setAgent};
}
// All approved covers are available in the setup page; preserve the original OpenClaw video.
const old=document.querySelector('video.agent-preview');
if(old){const host=document.createElement('div');host.className='agent-preview';old.before(host);const cover=createAgentCover(host);
 const sync=()=>{const name=document.querySelector('[data-agent-name]')?.textContent.trim();const id=Object.keys(profiles).find(k=>k!=='openclaw'&&profiles[k].name===name);host.hidden=!id;old.hidden=!!id;if(id){old.pause();cover.setAgent(id);}else old.play().catch(()=>{});};
 new MutationObserver(sync).observe(document.querySelector('[data-agent-name]'),{subtree:true,childList:true,characterData:true});sync();
}
