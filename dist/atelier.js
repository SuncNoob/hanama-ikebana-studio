// Native canvas lifecycle. Durable edits are committed once, at gesture end.
const PREFS='hanama-atelier-preferences-v2';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function mountUnityGame({getFrame,onEvent,onAction,locale=()=> 'zh'}){
 const stage=document.querySelector('#stage');if(!stage)return null;
 const $=(s,root=document)=>root.querySelector(s);
 const words=(zh,en,ja)=>locale()==='zh'?zh:locale()==='ja'?ja:en;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let stored={};try{stored=JSON.parse(localStorage.getItem(PREFS))||{};}catch{}
 const settings={motion:stored.motion!==false,power:clamp(Number.isFinite(stored.power)?stored.power:.65,0,1),direction:clamp(Number.isFinite(stored.direction)?stored.direction:125,15,165),tool:'move',photo:false,paused:false,reducedMotion:reduced.matches};
 let sound=stored.sound===true,audio=null;
 const host=document.createElement('div');host.className='unity-container';
 host.innerHTML='<canvas id="unity-canvas" tabindex="0" aria-label="互动插花画布"></canvas>';
 stage.append(host);const canvas=$('canvas',host);canvas.width=canvas.height=800;
 const panel=document.createElement('section');panel.className='game-session';
 panel.innerHTML=`<div class="atelier-intro"><div><span class="atelier-eyebrow">HANAMA · LIVING ATELIER</span><div class="game-session-title"><span class="game-live-dot"></span><span class="game-caption"></span></div></div><div class="game-session-modes"><button type="button" data-game-mode="free" aria-pressed="true"></button><button type="button" data-game-mode="practice" aria-pressed="false"></button><button type="button" id="game-photo"></button></div></div>
 <div class="atelier-controls"><div class="atelier-toolset" role="group"><button type="button" data-native-tool="move" aria-pressed="true"><span>↔</span><b></b></button><button type="button" data-native-tool="rotate" aria-pressed="false"><span>↻</span><b></b></button><button type="button" data-native-tool="scale" aria-pressed="false"><span>⤢</span><b></b></button></div><div class="atelier-toggles"><button type="button" id="game-motion" aria-pressed="true"></button><button type="button" id="game-sound" aria-pressed="false"></button><button type="button" id="game-capture" disabled></button></div></div>
 <div class="atelier-light"><label for="game-light-direction"><span class="light-direction-label"></span><input id="game-light-direction" type="range" min="15" max="165" step="1"><output></output></label><label for="game-light-power"><span class="light-power-label"></span><input id="game-light-power" type="range" min="0" max="100" step="1"><output></output></label><span class="atelier-light-note"></span></div>
 <div class="game-practice" hidden></div><p class="game-instruction"></p><div class="game-loading" role="status"><progress max="1" value="0"></progress><span></span><button type="button" id="game-retry" hidden></button></div>`;
 $('.workspace-heading').after(panel);
 // Keep the first interaction close to the canvas; inspiration follows the workbench.
 $('.stage-shell').after($('.light-scene-gallery'));
 const hud=document.createElement('div');hud.className='atelier-hud';hud.setAttribute('aria-live','off');
 hud.innerHTML='<span class="atelier-hud-name"></span><span class="atelier-hud-values"></span><button type="button" data-atelier-action="reseat"></button><button type="button" data-atelier-action="duplicate"></button>';
 $('#canvas-viewport').append(hud);
 const feedback=document.createElement('div');feedback.className='atelier-feedback';feedback.setAttribute('role','status');stage.append(feedback);
 let instance=null,active=false,busy=false,frameHandle=0,mode='free',startPromise=null,lastFrame=null,lastLight=null,feedbackTimer=0,captureTimer=0,capturePending=false,lastLocale='';
 const sentTextures=new Map(),milestones=new Set(),pendingEvents=[];
 const visible=()=>!document.hidden&&!$('#studio-view')?.hidden&&!$('dialog[open]');
 function persist(){try{localStorage.setItem(PREFS,JSON.stringify({motion:settings.motion,power:settings.power,direction:settings.direction,sound}));}catch{}}
 function present(){settings.paused=!visible();settings.reducedMotion=reduced.matches;if(active)instance.SendMessage('HanamaGame','SetPresentation',JSON.stringify(settings));}
 function ping(kind){
  if(!sound)return;
  try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=kind==='cut'?350:kind==='snap'?740:520;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.13);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.14);}catch{}
 }
 function announce(text){clearTimeout(feedbackTimer);feedback.textContent=text;feedback.classList.add('visible');feedbackTimer=setTimeout(()=>feedback.classList.remove('visible'),1800);}
 function renderPractice(){
  const box=$('.game-practice',panel);box.hidden=mode!=='practice';
  const steps=[['arrange',words('摆出枝的方向','Shape the stems','枝の方向を整える')],['light',words('为花景调光','Sculpt with light','光を整える')],['save',words('收藏这一刻','Keep this moment','この瞬間を保存')]];
  box.innerHTML=steps.map(([key,label],i)=>`<span class="${milestones.has(key)?'done':''}"><b>${milestones.has(key)?'✓':i+1}</b>${label}</span>`).join('');
 }
 function updateControls(){
  $('#game-motion').setAttribute('aria-pressed',String(settings.motion&&!reduced.matches));$('#game-sound').setAttribute('aria-pressed',String(sound));
  $('#game-motion').textContent=words('微风','Breeze','そよ風')+(settings.motion&&!reduced.matches?' ◉':' ○');
  $('#game-motion').disabled=!active||reduced.matches;$('#game-motion').title=reduced.matches?words('跟随系统的减少动态效果设置','Reduced motion is enabled in your system','システムの視差効果を減らす設定が有効です'):'';
  $('#game-sound').textContent=words('音效','Sound','音')+(sound?' ◉':' ○');
  for(const [id,value,label] of [['direction',settings.direction,Math.round(settings.direction)+'°'],['power',settings.power*100,Math.round(settings.power*100)+'%']]){
   const input=$('#game-light-'+id);input.disabled=!active;input.value=value;input.style.setProperty('--range',`${(Number(input.value)-Number(input.min))/(Number(input.max)-Number(input.min))*100}%`);input.nextElementSibling.textContent=label;
  }
  $('#game-photo').textContent=settings.photo?words('返回创作','Back to atelier','創作に戻る'):words('沉浸赏花 ↗','Immerse ↗','鑑賞する ↗');
  document.querySelectorAll('[data-native-tool]').forEach(b=>{b.disabled=!active;b.setAttribute('aria-pressed',String(b.dataset.nativeTool===settings.tool&&lastFrame?.mode==='move'));});
  hud.hidden=!lastFrame?.selected||settings.photo||!active;
 }
 function language(){
  $('.game-caption',panel).textContent=words('让花与光，自然发生','Let flowers and light come alive','花と光が、自然に息づく');
  $('[data-game-mode="free"]').textContent=words('自由创作','Free play','自由に生ける');$('[data-game-mode="practice"]').textContent=words('花道练习','Practice','生け花の練習');
  const names={move:words('移动','Move','移動'),rotate:words('旋转','Rotate','回転'),scale:words('缩放','Scale','大きさ')};
  document.querySelectorAll('[data-native-tool]').forEach(b=>{$('b',b).textContent=names[b.dataset.nativeTool];b.title=names[b.dataset.nativeTool];});
  $('.atelier-toolset').setAttribute('aria-label',words('花枝操作','Stem tools','花材の操作'));
  $('.light-direction-label').textContent=words('光位','Light angle','光の向き');$('.light-power-label').textContent=words('柔光','Soft light','柔らかな光');$('.atelier-light-note').textContent=words('花瓣与投影，随光而动','Petals and shadows follow the light','花びらも影も、光とともに');
  $('.game-instruction',panel).textContent=words('拖动花枝 · 棕色圆点旋转 · 绿色圆点缩放 · 靠近瓶口自动吸附','Drag a stem · amber handle to turn · green handle to scale · snap at the vase','花材をドラッグ・茶色の点で回転・緑の点で拡大縮小・口元に吸着');
  $('[data-atelier-action="reseat"]').textContent=words('插回瓶口','Seat stem','口元に戻す');$('[data-atelier-action="duplicate"]').textContent=words('添一枝','Duplicate','もう一枝');
  $('#game-capture').textContent=words('◉ 拍下花境','◉ Take a photo','◉ 花景を撮る');$('#game-retry').textContent=words('重试加载','Retry','再試行');
  canvas.setAttribute('aria-label',words('插花画布：拖动花枝，棕色圆点旋转，绿色圆点缩放；方向键微调，Ctrl Z 撤销，Escape 取消','Flower canvas: drag stems, amber handle rotates, green handle scales. Arrow keys adjust, Ctrl Z undoes, Escape cancels.','花材をドラッグ、茶色の点で回転、緑の点で拡大縮小。矢印で微調整、Ctrl Zで元に戻す。'));
  lastLocale=locale();renderPractice();updateControls();
 }
 function readout(event){
  const node=lastFrame?.nodes.find(n=>n.id===(event?.id||lastFrame.selected));
  $('.atelier-hud-name',hud).textContent=node?.name||'';
  $('.atelier-hud-values',hud).textContent=node?`${Math.round(event?.angle??node.angle)}°`:'';
 }
 function schedule(){if(!active||busy||!visible())return;if(!frameHandle)frameHandle=requestAnimationFrame(()=>{frameHandle=0;sync();});}
 function sync(){
  if(!active||busy||!visible())return;
  try{
   const frame=getFrame(sentTextures);lastFrame=frame;
   if(lastLocale!==locale())language();
   if(lastLight!==null&&frame.light!==lastLight){settings.direction={morning:125,noon:90,dusk:150,moon:40}[frame.light]||125;present();}
   lastLight=frame.light;
   instance.SendMessage('HanamaGame','ReceiveFrame',JSON.stringify(frame));
   for(const n of frame.nodes)sentTextures.set(n.id,n.key);
   for(const id of sentTextures.keys())if(!frame.nodes.some(n=>n.id===id))sentTextures.delete(id);
   readout();updateControls();
  }catch(error){sentTextures.clear();console.warn('Unity frame sync',error);}
 }
 function finishCapture(event){
  clearTimeout(captureTimer);capturePending=false;$('#game-capture').disabled=!active;
  if(event.type==='capture'){
   const binary=atob(event.image),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'})),a=document.createElement('a');a.href=url;a.download=($('#work-title').value||'HANAMA')+'-光影花境.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
   milestones.add('save');renderPractice();announce(words('花境已保存 · 1600 × 1600','Photo saved · 1600 × 1600','花景を保存しました · 1600 × 1600'));ping('snap');
  }else announce(words('拍摄未完成，请重试','Photo failed. Please retry.','撮影できませんでした。再試行してください。'));
 }
 window.hanamaUnityEvent=raw=>{
  let event;try{event=JSON.parse(raw);}catch{return;}
  if(event.type==='ready'){
   if(!instance){pendingEvents.push(event);return;}
   active=true;stage.classList.add('game-active');$('.game-loading',panel).hidden=true;$('#game-capture').disabled=false;present();schedule();return;
  }
  if(event.type==='capture'||event.type==='capture-error'){finishCapture(event);return;}
  if(event.type==='hover'){canvas.style.cursor=event.id?'grab':'default';return;}
  if(event.type==='preview'){readout(event);return;}
  if(event.type==='magnet'){announce(words('松手，即入花器','Release to seat the stem','指を離すと花器に入ります'));ping('snap');return;}
  if(event.type==='begin'){busy=true;canvas.style.cursor='grabbing';}
  if(['commit','cut','cancel'].includes(event.type)){busy=false;canvas.style.cursor='grab';}
  if(event.type==='commit'||event.type==='cut'){milestones.add('arrange');renderPractice();ping(event.type==='cut'?'cut':'place');if(event.snapped)announce(words('已稳稳插入','Stem seated','花器に挿しました'));}
  onEvent(event);
  if(event.type!=='begin')schedule();
 };
 const status=(text,progress=0)=>{const box=$('.game-loading',panel);box.hidden=false;$('span',box).textContent=text;$('progress',box).value=progress;};
 async function start(){
  if(startPromise)return startPromise;
  startPromise=(async()=>{
   language();status(words('正在布置花境…','Preparing your atelier…','花の空間を準備中…'));$('#game-retry').hidden=true;
   try{
    const res=await fetch('/unity/build.json',{cache:'no-cache'});if(!res.ok)throw new Error('Build unavailable');const config=await res.json();
    await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=config.loader;script.onload=resolve;script.onerror=reject;document.head.append(script);});
    instance=await window.createUnityInstance(canvas,{...config,devicePixelRatio:Math.min(2,devicePixelRatio||1),matchWebGLToCanvasSize:true,companyName:'HANAMA',productName:'Light & Flowers',productVersion:'2.0',showBanner:(msg,type)=>{if(type==='error')console.warn('Unity',msg);}},p=>status(words('正在布置花境…','Preparing your atelier…','花の空間を準備中…'),p));
    for(const e of pendingEvents.splice(0))window.hanamaUnityEvent(JSON.stringify(e));
   }catch(error){console.warn('Unity startup',error);active=false;stage.classList.remove('game-active');status(words('花境暂未载入，可继续使用画布，或重试加载。','Continue with the canvas, or retry loading the atelier.','キャンバスで続けるか、再読み込みできます。'));$('#game-retry').hidden=false;startPromise=null;}
  })();return startPromise;
 }
 $('#game-retry').onclick=start;
 document.querySelectorAll('[data-native-tool]').forEach(b=>b.onclick=()=>{settings.tool=b.dataset.nativeTool;onAction?.('move');present();updateControls();canvas.focus({preventScroll:true});});
 document.querySelectorAll('[data-atelier-action]').forEach(b=>b.onclick=()=>{onAction?.(b.dataset.atelierAction);canvas.focus({preventScroll:true});});
 document.querySelectorAll('[data-game-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.gameMode;document.querySelectorAll('[data-game-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderPractice();});
 $('#game-motion').onclick=()=>{settings.motion=!settings.motion;persist();present();updateControls();};
 $('#game-sound').onclick=()=>{sound=!sound;persist();updateControls();ping('place');};
 for(const id of ['direction','power'])$('#game-light-'+id).oninput=e=>{settings[id]=Number(e.target.value)/(id==='power'?100:1);milestones.add('light');renderPractice();updateControls();present();persist();};
 function photo(on){settings.photo=on;document.body.classList.toggle('game-photo-mode',on);present();updateControls();}
 $('#game-photo').onclick=()=>photo(!settings.photo);
 $('#game-capture').onclick=()=>{if(!active||busy||capturePending)return;capturePending=true;$('#game-capture').disabled=true;captureTimer=setTimeout(()=>finishCapture({type:'capture-error'}),15000);instance.SendMessage('HanamaGame','Capture','');};
 document.addEventListener('keydown',e=>{
  const cancel=e.key==='Escape'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&busy);
  if(!cancel||e.target.closest('input,textarea,select,dialog'))return;
  if(active&&busy){e.preventDefault();e.stopImmediatePropagation();instance.SendMessage('HanamaGame','CancelGesture','');}
  else if(settings.photo){e.preventDefault();e.stopImmediatePropagation();photo(false);}
 },true);
 canvas.addEventListener('pointerdown',e=>{if(active){canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});if(sound&&audio?.state==='suspended')audio.resume();}});
 canvas.addEventListener('pointercancel',()=>{if(active)instance.SendMessage('HanamaGame','CancelGesture','');});
 host.addEventListener('contextmenu',e=>e.preventDefault());
 for(const type of ['pointerdown','pointermove','pointerup','pointercancel','dblclick'])host.addEventListener(type,e=>{if(active)e.stopPropagation();});
 host.addEventListener('wheel',e=>{if(active){e.stopPropagation();if(e.altKey||e.shiftKey)e.preventDefault();}},{passive:false});
 for(const button of document.querySelectorAll('[data-light],[data-scene]'))button.addEventListener('click',()=>{milestones.add('light');renderPractice();});
 document.addEventListener('hanama-saved',()=>{milestones.add('save');renderPractice();});
 function visibility(){present();if(visible()){busy=false;schedule();}}
 const observer=new MutationObserver(visibility);observer.observe($('#studio-view'),{attributes:true,attributeFilter:['hidden']});observer.observe($('#modal'),{attributes:true,attributeFilter:['open']});document.addEventListener('visibilitychange',visibility);
 reduced.addEventListener('change',()=>{present();updateControls();});
 new ResizeObserver(()=>{if(active){canvas.width=Math.max(1,Math.round(host.clientWidth*Math.min(2,devicePixelRatio||1)));canvas.height=Math.max(1,Math.round(host.clientHeight*Math.min(2,devicePixelRatio||1)));}}).observe(host);
 start();
 return {schedule,active:()=>active,busy:()=>busy,reset:()=>{sentTextures.clear();schedule();}};
}
