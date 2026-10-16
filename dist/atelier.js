// The canvas is the workbench. Existing document controls keep their handlers and IDs.
const PREFS='hanama-atelier-preferences-v3';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function mountUnityGame({getFrame,onEvent,onAction,locale=()=> 'zh'}){
 const stage=document.querySelector('#stage');if(!stage)return null;
 const $=(s,root=document)=>root.querySelector(s);
 const words=(zh,en,ja)=>locale()==='zh'?zh:locale()==='ja'?ja:en;
 const strokeIcon=path=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
 const closeIcon=strokeIcon('M6 6l12 12M18 6 6 18');
 const flowerLabel=$('#quick-material-open>span:last-child'),vesselLabel=$('#quick-vessel-open>span:last-child');
 Object.assign(flowerLabel.dataset,{zh:'花材',en:'Flowers',ja:'花材'});
 Object.assign(vesselLabel.dataset,{zh:'花器',en:'Vessels',ja:'花器'});
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),coarsePointer=matchMedia('(pointer:coarse)');
 let touchTool='translate';
 let stored={};try{stored=JSON.parse(localStorage.getItem(PREFS))||{};}catch{}
 const settings={motion:stored.motion!==false,power:clamp(Number.isFinite(stored.power)?stored.power:.35,0,1),direction:clamp(Number.isFinite(stored.direction)?stored.direction:125,15,165),tool:touchTool,coarsePointer:coarsePointer.matches,viewportPixels:1,photo:false,paused:false,reducedMotion:reduced.matches};
 let sound=stored.sound===true,audio=null;
 document.body.classList.add('atelier-simple');
 const host=document.createElement('div');host.className='unity-container';
 host.innerHTML='<canvas id="unity-canvas" tabindex="0" aria-label="互动插花画布"></canvas>';
 stage.append(host);const canvas=$('canvas',host);canvas.width=canvas.height=1;
 const panel=document.createElement('section');panel.className='game-session';
 panel.innerHTML=`<div class="atelier-bench"><div class="atelier-add-slot"></div><div class="atelier-vessel-slot"></div><div class="atelier-tool-slot"></div>
  <span class="atelier-bench-space"></span><details class="atelier-disclosure" id="atelier-atmosphere"><summary><span class="atelier-atmosphere-label"></span></summary><div class="atelier-popover atelier-atmosphere-panel"><div class="atelier-presets" role="group"><button type="button" data-atmosphere="morning"><i></i><span></span></button><button type="button" data-atmosphere="shade"><i></i><span></span></button><button type="button" data-atmosphere="dusk"><i></i><span></span></button><button type="button" data-atmosphere="moon"><i></i><span></span></button></div><div class="atelier-toggles"><button type="button" id="game-motion" aria-pressed="true"></button><button type="button" id="game-sound" aria-pressed="false"></button></div><details class="atelier-fine"><summary class="atelier-fine-label"></summary><div class="atelier-light"><label for="game-light-direction"><span class="light-direction-label"></span><input id="game-light-direction" type="range" min="15" max="165" step="1"><output></output></label><label for="game-light-power"><span class="light-power-label"></span><input id="game-light-power" type="range" min="0" max="100" step="1"><output></output></label></div><div class="atelier-scene-slot"></div></details><details class="atelier-studies"><summary class="atelier-studies-label"></summary><div class="atelier-studies-slot"></div></details></div></details>
  <details class="atelier-disclosure" id="atelier-work"><summary><span class="atelier-work-label"></span></summary><div class="atelier-popover atelier-work-panel"><div class="atelier-title-slot"></div><div class="atelier-work-main"><div class="atelier-save-slot"></div><button type="button" id="game-capture" disabled></button><div class="atelier-fallback-export"></div><button type="button" id="atelier-gallery"></button><button type="button" id="game-photo" aria-pressed="false"></button></div><details class="atelier-work-more"><summary class="atelier-more-label"></summary><div class="atelier-work-secondary"><div class="atelier-advanced-tools"></div><button type="button" id="atelier-book"></button><button type="button" id="atelier-image-pack"></button></div></details></div></details></div>
  <div class="game-loading" role="status"><progress max="1" value="0"></progress><span></span><button type="button" id="game-retry" hidden></button></div>`;
 const touchTools=document.createElement('div');touchTools.id='atelier-touch-tools';touchTools.className='atelier-touch-tools';
 touchTools.innerHTML='<div class="atelier-touch-modes" role="group" aria-describedby="atelier-touch-hint"><button type="button" data-touch-tool="translate" aria-pressed="true"></button><button type="button" data-touch-tool="bend" aria-pressed="false"></button><button type="button" data-touch-tool="rotate" aria-pressed="false"></button></div><p id="atelier-touch-hint" aria-live="polite"></p>';
 panel.prepend(touchTools);
 $('.stage-frame').append(panel);
 // Flowers and vessels have their own direct entrances to the shared picker.
 $('.atelier-add-slot',panel).append($('#quick-material-open'));
 $('.atelier-vessel-slot',panel).append($('#quick-vessel-open'));
 $('.atelier-tool-slot',panel).append($('.stage-tools'));
 $('.atelier-title-slot',panel).append($('.workspace-heading'));
 $('.atelier-save-slot',panel).append($('#save-button'));
 $('.atelier-fallback-export',panel).append($('#export-draft'));
 $('.atelier-scene-slot',panel).append($('.scene-picker'));
 const secondary=$('.atelier-work-secondary',panel);
 for(const selector of ['.work-subtitle','#recipe-button','#share-current','#new-canvas-button','#help-button','#sources-button']){const node=$(selector);if(node)secondary.append(node);}
 const studies=$('.light-scene-gallery');if(studies)$('.atelier-studies-slot',panel).append(studies);
 const fallbackAdjust=document.createElement('button');fallbackAdjust.type='button';fallbackAdjust.id='atelier-fallback-adjust';
 secondary.prepend(fallbackAdjust);
 $('.atelier-advanced-tools',panel).append($('#guide-button'));
 const lengthButton=document.createElement('button');lengthButton.type='button';lengthButton.id='atelier-length';lengthButton.className='icon-button';lengthButton.setAttribute('aria-controls','atelier-length-panel');lengthButton.setAttribute('aria-expanded','false');
 lengthButton.innerHTML='<span aria-hidden="true" class="atelier-length-icon">'+strokeIcon('M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4')+'</span><span class="atelier-length-label"></span>';
 $('.stage-tools').insertBefore(lengthButton,$('#undo-button'));
 for(const id of ['prune-tool','erase-tool','atelier-length','flip-button','duplicate-button','layers-tool','delete-button','undo-button','redo-button']){
  const button=$('#'+id);button.classList.add('icon-button');$('.stage-tools').append(button);
 }
 for(const [id,labels] of [['flip-button',{zh:'翻转',en:'Flip',ja:'反転'}],['duplicate-button',{zh:'复制',en:'Copy',ja:'複製'}]]){
  const label=$('span[data-zh]',$('#'+id));label.classList.add('atelier-tool-name');Object.assign(label.dataset,labels);
 }
 const lengthPanel=document.createElement('div');lengthPanel.id='atelier-length-panel';lengthPanel.className='atelier-length-panel';lengthPanel.hidden=true;
 const lengthClose=document.createElement('button');lengthClose.type='button';lengthClose.className='atelier-length-close';lengthClose.innerHTML=closeIcon;
 lengthPanel.append($('#length').closest('.range-control'),lengthClose);panel.append(lengthPanel);
 // Background and every light stay directly available when the atmosphere panel opens.
 const fine=$('.atelier-fine'),fineContent=document.createElement('div');fineContent.className='atelier-fine';fineContent.innerHTML='<p class="atelier-fine-label"></p>';
 while(fine.children.length>1)fineContent.append(fine.children[1]);fine.replaceWith(fineContent);
 $('.atelier-atmosphere-panel').insertBefore($('.atelier-scene-slot'),$('.atelier-presets'));
 const workClose=document.createElement('button');workClose.type='button';workClose.className='atelier-work-close';workClose.innerHTML=closeIcon;workClose.onclick=()=>{$('#atelier-work').open=false;$('#atelier-work>summary').focus({preventScroll:true});};$('.atelier-work-panel').prepend(workClose);
 $('.header-actions').append($('#atelier-image-pack'));
 const atmosphereClose=document.createElement('button');atmosphereClose.type='button';atmosphereClose.className='atelier-atmosphere-close';atmosphereClose.innerHTML=closeIcon;atmosphereClose.onclick=()=>{$('#atelier-atmosphere').open=false;$('#atelier-atmosphere>summary').focus()};$('.atelier-atmosphere-panel').prepend(atmosphereClose);
 secondary.append($('.zoom-controls'));
 const inspector=$('.design-panel');
 const closeInspector=document.createElement('button');closeInspector.className='atelier-inspector-close';closeInspector.type='button';closeInspector.innerHTML=closeIcon;inspector.prepend(closeInspector);
 for(const id of ['quick-material-close','close-layers','close-modal'])$('#'+id).innerHTML=closeIcon;
 const hud=document.createElement('div');hud.className='atelier-hud';hud.setAttribute('aria-live','off');
 hud.innerHTML='<span class="atelier-hud-name"></span><button type="button" data-atelier-action="straighten"></button><button type="button" id="atelier-adjust" aria-controls="selection-controls" aria-expanded="false"></button>';
 secondary.prepend(hud);
 const feedback=document.createElement('div');feedback.className='atelier-feedback';feedback.setAttribute('role','status');stage.append(feedback);
 let instance=null,active=false,busy=false,frameHandle=0,startPromise=null,lastFrame=null,lastLight=null,feedbackTimer=0,captureTimer=0,capturePending=false,lastLocale='';
 const sentTextures=new Map(),pendingEvents=[],canvasPointers=new Set();
 const presets={morning:{light:'morning',scene:'paper',power:.35,direction:125},shade:{light:'noon',scene:'stone',power:.23,direction:100},dusk:{light:'dusk',scene:'paper',power:.29,direction:145},moon:{light:'moon',scene:'night',power:.22,direction:45}};
 const visible=()=>!document.hidden&&!$('#studio-view')?.hidden&&!$('dialog[open]');
 // CSS can stay generous while the WebGL render target has a predictable pixel budget.
 // Native photography uses its own 1600px render texture and is independent of this buffer.
 function bufferMetrics(){
  const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight),limit=matchMedia('(max-width:900px)').matches?640:720;
  const ratio=Math.min(devicePixelRatio||1,2,limit/Math.max(width,height));
  return {ratio,width:Math.max(1,Math.floor(width*ratio)),height:Math.max(1,Math.floor(height*ratio))};
 }
 function resizeBuffer(){
  if($('#studio-view')?.hidden)return;
  const size=bufferMetrics();if(instance?.Module)instance.Module.devicePixelRatio=size.ratio;
  if(canvas.width!==size.width)canvas.width=size.width;if(canvas.height!==size.height)canvas.height=size.height;
 }
 function persist(){try{localStorage.setItem(PREFS,JSON.stringify({motion:settings.motion,power:settings.power,direction:settings.direction,sound}));}catch{}}
 function cancel(){canvasPointers.clear();if(active)instance.SendMessage('HanamaGame','CancelGesture','');}
 function present(){
  settings.paused=!visible();settings.reducedMotion=reduced.matches;settings.coarsePointer=coarsePointer.matches;
  settings.viewportPixels=Math.max(1,host.getBoundingClientRect().width);settings.tool=touchTool;
  if(active)instance.SendMessage('HanamaGame','SetPresentation',JSON.stringify(settings));
 }
 function updateTouchControls(){
  const coarse=coarsePointer.matches,mode=stage.dataset.tool||lastFrame?.mode||'move',pruning=mode!=='move';
  touchTools.hidden=false;document.body.classList.add('atelier-direct');document.body.classList.toggle('atelier-touch',coarse);
  $('.atelier-touch-modes',touchTools).setAttribute('aria-label',words('花材操作','Stem controls','花材の操作'));
  const labels={translate:words('移动','Move','移動'),bend:words('弯枝','Bend','曲げる'),rotate:words('旋转','Rotate','回転')};
  touchTools.querySelectorAll('[data-touch-tool]').forEach(b=>{b.textContent=labels[b.dataset.touchTool];b.disabled=!active;b.setAttribute('aria-pressed',String(!pruning&&b.dataset.touchTool===touchTool));});
  const hints={translate:words('按住花材任意位置移动','Drag anywhere on a stem to move','花材をつかんで移動'),bend:words('按住花头，轻柔弯枝','Hold the flower head to bend','花先をつかんで曲げる'),rotate:words('按住花材，左右滑动旋转','Hold a stem and slide sideways to rotate','花材をつかんで左右に動かすと回転')};
  $('#atelier-touch-hint').textContent=!active?words('拖动花材 · 在调整面板中造型','Drag stems · open Adjust to shape','花材をドラッグ・調整で形を整える'):pruning?(mode==='brush'?words('橡皮使用中 · 点移动退出','Erasing · tap Move to finish','消去中・移動で終了'):words('剪刀使用中 · 点移动退出','Cutting · tap Move to finish','切断中・移動で終了')):hints[touchTool];
 }

 function ping(kind){
  if(!sound)return;
  try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=kind==='cut'?350:kind==='snap'?740:520;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.13);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.14);}catch{}
 }
 function announce(text){clearTimeout(feedbackTimer);feedback.textContent=text;feedback.classList.add('visible');feedbackTimer=setTimeout(()=>feedback.classList.remove('visible'),1800);}
 function closeMenus(except){document.querySelectorAll('.atelier-disclosure').forEach(d=>{if(d!==except)d.open=false;});}
 function setInspector(open,tab='shape'){
  if(open){setLength(false);closeMenus();$('#quick-material-close').click();if(!$('#layer-menu').hidden)$('#close-layers').click();$('.editor-tabs [data-editor-tab="'+tab+'"]',inspector)?.click();}
  document.body.classList.toggle('atelier-inspector-open',open);$('#atelier-adjust').setAttribute('aria-expanded',String(open));
 }
 function setLength(open){
  if(open){
   onAction?.('move');if(!$('.stem.selected',stage)){const target=lastFrame?.nodes.filter(n=>n.interactive).at(-1)?.id||$('.stem',stage)?.dataset.id;if(!target)return;onEvent({type:'select',id:target});}
   closeMenus();setInspector(false);$('#quick-material-close').click();if(!$('#layer-menu').hidden)$('#close-layers').click();
  }
  lengthPanel.hidden=!open;lengthButton.setAttribute('aria-expanded',String(open));
  if(open)$('#length').focus({preventScroll:true});
 }
 function updateControls(){
  updateTouchControls();
  $('#game-motion').setAttribute('aria-pressed',String(settings.motion&&!reduced.matches));$('#game-sound').setAttribute('aria-pressed',String(sound));
  $('#game-motion').textContent=words('微风','Breeze','そよ風')+(settings.motion&&!reduced.matches?' · '+words('开','On','入'):' · '+words('关','Off','切'));
  $('#game-motion').disabled=!active||reduced.matches;$('#game-motion').title=reduced.matches?words('跟随系统的减少动态效果设置','Follows your system reduced motion setting','システムの視差効果を減らす設定に従います'):'';
  $('#game-sound').textContent=words('声音','Sound','音')+(sound?' · '+words('开','On','入'):' · '+words('关','Off','切'));
  const directionLabel=settings.direction<75?words('偏右','Right','右寄り'):settings.direction>110?words('偏左','Left','左寄り'):words('居中','Centre','中央');
  const powerLabel=settings.power<.3?words('轻','Light','淡い'):settings.power<.65?words('柔','Soft','柔らかい'):words('浓','Deep','濃い');
  for(const [id,value,label] of [['direction',settings.direction,directionLabel],['power',settings.power*100,powerLabel]]){const input=$('#game-light-'+id);input.disabled=!active;input.value=value;input.nextElementSibling.textContent=label;}
  $('#game-photo').textContent=settings.photo?words('返回创作','Back to arranging','創作に戻る'):words('全屏赏花','Immerse','花を鑑賞');$('#game-photo').setAttribute('aria-pressed',String(settings.photo));
  $('#game-capture').disabled=!active||capturePending;$('#game-capture').hidden=!active;$('.atelier-fallback-export',panel).hidden=active;
  const node=lastFrame?.nodes.find(n=>n.id===lastFrame.selected);
  hud.hidden=!node||settings.photo||!active;hud.classList.toggle('is-pruning',lastFrame?.mode!=='move');
  $('[data-atelier-action="straighten"]').hidden=!node?.flex?.some(v=>Math.abs(v)>.008);
  const light=lastFrame?.light;document.querySelectorAll('[data-atmosphere]').forEach(b=>b.setAttribute('aria-pressed',String(presets[b.dataset.atmosphere].light===light)));
 }
 function language(){
  $('.atelier-atmosphere-label').textContent=words('光景','Light','光と景');$('.atelier-work-label').textContent=words('作品','Keep','作品');
 atmosphereClose.setAttribute('aria-label',words('收起光景','Close light and backgrounds','光と景を閉じる'));
 workClose.setAttribute('aria-label',words('收起作品','Close work menu','作品メニューを閉じる'));
  flowerLabel.textContent=words('花材','Flowers','花材');vesselLabel.textContent=words('花器','Vessels','花器');
  $('#atelier-gallery').textContent=words('我的作品','My works','自分の作品');$('#atelier-book').textContent=words('灵感手帖','Inspiration book','インスピレーション');
  for(const [id,label] of [['flip-button',words('翻转','Flip','反転')],['duplicate-button',words('复制','Copy','複製')],['undo-button',words('撤销','Undo','戻す')],['redo-button',words('重做','Redo','やり直す')],['layers-tool',words('图层','Layers','レイヤー')],['delete-button',words('删除','Delete','削除')],['guide-button',words('构图参考','Composition guide','構図ガイド')]]){
   let text=$('.atelier-tool-name',$('#'+id));if(!text){text=document.createElement('span');text.className='atelier-tool-name';$('#'+id).append(text);}text.textContent=label;
  }
  const labels={morning:words('窗边','Window','窓辺'),shade:words('阴日','Overcast','曇り'),dusk:words('夕照','Evening','夕映え'),moon:words('月色','Moon','月影')};
  document.querySelectorAll('[data-atmosphere]').forEach(b=>$('span',b).textContent=labels[b.dataset.atmosphere]);
  $('.atelier-presets').setAttribute('aria-label',words('自然光景','Natural atmospheres','自然な光と景'));
  $('.atelier-fine-label').textContent=words('光照调整','Light settings','光の調整');$('.atelier-studies-label').textContent=words('从一幅花景开始','Begin from a study','花景の作例から');
  $('.atelier-length-label').textContent=words('枝长','Length','茎の長さ');lengthButton.title=words('拉伸枝干','Stretch the stem','茎を伸ばす');lengthButton.setAttribute('aria-label',lengthButton.title);lengthClose.setAttribute('aria-label',words('收起枝长','Close stem length','茎の長さを閉じる'));
  $('.atelier-more-label').textContent=words('更多','More','その他');$('#atelier-image-pack').textContent=words('AI 生图','AI image','AI 画像');$('#atelier-image-pack').title=words('准备 AI 生图包','Prepare an AI image pack','AI生成用パックを準備');
  $('.light-direction-label').textContent=words('光从哪里来','Light direction','光の向き');$('.light-power-label').textContent=words('光的浓淡','Light presence','光の濃さ');
  $('[data-atelier-action="straighten"]').textContent=words('还原枝形','Unbend','曲げを戻す');$('#atelier-adjust').textContent=words('调整','Adjust','調整');
  closeInspector.setAttribute('aria-label',words('收起调整','Close adjustments','調整を閉じる'));fallbackAdjust.textContent=words('调整花材','Adjust stem','花材を調整');
  $('#game-capture').textContent=words('拍下这一刻','Take a photo','この瞬間を撮る');$('#game-retry').textContent=words('重试','Retry','再試行');
  canvas.setAttribute('aria-label',active?words('插花画布：先选移动、弯枝或旋转，再按住花材操作。双指缩放与旋转，方向键微调，Ctrl Z 撤销，Escape 取消。','Flower canvas: choose Move, Bend or Rotate, then drag the stem. Two fingers scale and rotate. Arrow keys adjust, Ctrl Z undoes, Escape cancels.','花材のキャンバス：移動・曲げる・回転を選び、花材を操作。2本指で拡大縮小と回転。矢印で微調整、Ctrl Zで戻す、Escで取消。'):words('插花画布：拖动花材，在调整面板中造型。','Flower canvas: drag stems and use Adjust to shape them.','花材のキャンバス：花材をドラッグし、調整で形を整えます。'));
  $('#delete-button').setAttribute('aria-label',words('删除选中花材','Delete selected stem','選択した花材を削除'));$('#delete-button').title=words('删除选中花材','Delete selected stem','選択した花材を削除');
  lastLocale=locale();updateControls();
 }
 function readout(event){const node=lastFrame?.nodes.find(n=>n.id===(event?.id||lastFrame.selected));$('.atelier-hud-name',hud).textContent=node?.name||'';}
 function schedule(){if(!active||busy||!visible())return;if(!frameHandle)frameHandle=requestAnimationFrame(()=>{frameHandle=0;sync();});}
 function sync(){
  if(!active||busy||!visible())return;
  try{
   const frame=getFrame(sentTextures);lastFrame=frame;
   if(lastLocale!==locale())language();
   if(lastLight!==null&&frame.light!==lastLight){const preset=Object.values(presets).find(p=>p.light===frame.light);if(preset){settings.direction=preset.direction;settings.power=preset.power;}present();}
   lastLight=frame.light;instance.SendMessage('HanamaGame','ReceiveFrame',JSON.stringify(frame));
   for(const n of frame.nodes)sentTextures.set(n.id,n.key);for(const id of sentTextures.keys())if(!frame.nodes.some(n=>n.id===id))sentTextures.delete(id);
   readout();updateControls();
  }catch(error){sentTextures.clear();console.warn('Unity frame sync',error);}
 }
 function finishCapture(event){
  clearTimeout(captureTimer);capturePending=false;updateControls();
  if(event.type==='capture'){
   const binary=atob(event.image),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   const url=URL.createObjectURL(new Blob([bytes],{type:'image/png'})),a=document.createElement('a');a.href=url;a.download=($('#work-title').value||'HANAMA')+'-光影花境.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
   announce(words('照片已保存 · 1600 × 1600','Photo saved · 1600 × 1600','写真を保存しました · 1600 × 1600'));ping('snap');
  }else announce(words('拍摄未完成，请重试','Photo failed. Please retry.','撮影できませんでした。再試行してください。'));
 }
 window.hanamaUnityEvent=raw=>{
  let event;try{event=JSON.parse(raw);}catch{return;}
  if(event.type==='ready'){
   if(!instance){pendingEvents.push(event);return;}
   active=true;stage.classList.add('game-active');document.body.classList.add('atelier-native');$('.game-loading',panel).hidden=true;resizeBuffer();language();present();schedule();return;
  }
  if(event.type==='capture'||event.type==='capture-error'){finishCapture(event);return;}
  if(event.type==='hover'){canvas.style.cursor=event.id?'grab':'default';return;}
  if(event.type==='preview'){readout(event);return;}
  if(event.type==='magnet')return;
  if(event.type==='begin'){busy=true;canvas.style.cursor='grabbing';closeMenus();}
  if(['commit','cut','cancel'].includes(event.type)){busy=false;canvas.style.cursor='grab';}
  if(event.type==='commit'||event.type==='cut')ping(event.type==='cut'?'cut':'place');
  onEvent(event);if(event.type!=='begin')schedule();
 };
 const status=(text,progress=0)=>{const box=$('.game-loading',panel);box.hidden=false;$('span',box).textContent=text;$('progress',box).value=progress;};
 async function start(){
  if(startPromise)return startPromise;
  startPromise=(async()=>{
   language();status(words('正在布置花境…','Preparing the atelier…','花の空間を準備中…'));$('#game-retry').hidden=true;
   try{
    const res=await fetch('/unity/build.json',{cache:'no-cache'});if(!res.ok)throw new Error('Build unavailable');const config=await res.json();
    await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=config.loader;script.onload=resolve;script.onerror=reject;document.head.append(script);});
    resizeBuffer();
    instance=await window.createUnityInstance(canvas,{...config,devicePixelRatio:bufferMetrics().ratio,matchWebGLToCanvasSize:false,companyName:'HANAMA',productName:'Light & Flowers',productVersion:'3.0',showBanner:(msg,type)=>{if(type==='error')console.warn('Unity',msg);}},p=>status(words('正在布置花境…','Preparing the atelier…','花の空間を準備中…'),p));
    resizeBuffer();
    for(const e of pendingEvents.splice(0))window.hanamaUnityEvent(JSON.stringify(e));
   }catch(error){console.warn('Unity startup',error);active=false;stage.classList.remove('game-active');document.body.classList.remove('atelier-native');status(words('可继续用画布创作。','You can continue with the canvas.','キャンバスで創作を続けられます。'));$('#game-retry').hidden=false;$('.game-loading progress',panel).hidden=true;startPromise=null;language();}
  })();return startPromise;
 }
 // Finish an in-flight touch before another finger invokes an editing action.
 for(const id of ['prune-tool','erase-tool','atelier-length','flip-button','duplicate-button','layers-tool','delete-button','undo-button','redo-button'])$('#'+id).addEventListener('click',e=>{
  const wasBusy=busy;cancel();
  if(wasBusy&&(id==='undo-button'||id==='redo-button')){e.preventDefault();e.stopImmediatePropagation();}
 },true);
 $('#game-retry').onclick=()=>{$('.game-loading progress',panel).hidden=false;start();};
 document.querySelectorAll('[data-atmosphere]').forEach(b=>b.onclick=()=>{const p=presets[b.dataset.atmosphere];settings.power=p.power;settings.direction=p.direction;$('button[data-scene="'+p.scene+'"]').click();$('button[data-light="'+p.light+'"]').click();$('#light-menu').hidden=true;$('#light-button').setAttribute('aria-expanded','false');present();updateControls();persist();});
 document.querySelectorAll('[data-atelier-action]').forEach(b=>b.onclick=()=>{onAction?.(b.dataset.atelierAction);canvas.focus({preventScroll:true});});
 $('#atelier-adjust').onclick=()=>setInspector(!document.body.classList.contains('atelier-inspector-open'));
 fallbackAdjust.onclick=()=>setInspector(!document.body.classList.contains('atelier-inspector-open'));
 closeInspector.onclick=()=>{setInspector(false);$('#atelier-work>summary').focus({preventScroll:true});};
 $('#atelier-image-pack').onclick=()=>{cancel();photo(false);setInspector(true,'create');};
 lengthButton.onclick=()=>setLength(lengthPanel.hidden);lengthClose.onclick=()=>{setLength(false);lengthButton.focus({preventScroll:true});};
 $('#atelier-gallery').onclick=()=>{closeMenus();$('.main-nav [data-view="gallery"]').click();};
 $('#atelier-book').onclick=()=>{closeMenus();$('.main-nav [data-view="inspiration"]').click();};
 for(const id of ['quick-material-open','quick-vessel-open']){
  $('#'+id).addEventListener('click',cancel,true);
  $('#'+id).addEventListener('click',()=>{setLength(false);closeMenus();setInspector(false);});
 }
 $('#layers-tool').addEventListener('click',()=>{setLength(false);closeMenus();setInspector(false);});
 for(const id of ['flip-button','duplicate-button','delete-button'])$('#'+id).addEventListener('click',()=>{setLength(false);closeMenus();setInspector(false);if(active)canvas.focus({preventScroll:true});});
 for(const id of ['prune-tool','erase-tool']){
  // A first click is immediately usable; the pressed tool is the only mode indicator.
  $('#'+id).addEventListener('click',()=>{if(!$('.stem.selected',stage)){const target=lastFrame?.nodes.filter(n=>n.interactive).at(-1)?.id||$('.stem',stage)?.dataset.id;if(target)onEvent({type:'select',id:target});}},true);
  $('#'+id).addEventListener('click',()=>{setLength(false);closeMenus();setInspector(false);updateTouchControls();if(active)canvas.focus({preventScroll:true});});
 }
 touchTools.querySelectorAll('[data-touch-tool]').forEach(b=>b.onclick=()=>{
  cancel();onAction?.('move');touchTool=b.dataset.touchTool;setLength(false);closeMenus();setInspector(false);
  present();updateControls();if(active)canvas.focus({preventScroll:true});
 });
 document.querySelectorAll('.atelier-disclosure').forEach(d=>d.addEventListener('toggle',()=>{if(d.open){setLength(false);closeMenus(d);setInspector(false);}}));
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.atelier-disclosure'))closeMenus();});
 $('#language-select').addEventListener('change',language);
 $('#game-motion').onclick=()=>{settings.motion=!settings.motion;persist();present();updateControls();};
 $('#game-sound').onclick=()=>{sound=!sound;persist();updateControls();ping('place');};
 for(const id of ['direction','power'])$('#game-light-'+id).oninput=e=>{settings[id]=Number(e.target.value)/(id==='power'?100:1);updateControls();present();persist();};
 function photo(on){settings.photo=on;document.body.classList.toggle('game-photo-mode',on);closeMenus();setInspector(false);present();updateControls();}
 $('#game-photo').onclick=()=>photo(!settings.photo);
 $('#game-capture').onclick=()=>{if(!active||busy||capturePending)return;capturePending=true;updateControls();closeMenus();captureTimer=setTimeout(()=>finishCapture({type:'capture-error'}),15000);instance.SendMessage('HanamaGame','Capture','');};
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!lengthPanel.hidden){e.preventDefault();setLength(false);lengthButton.focus({preventScroll:true});return;}
  if(e.key==='Escape'&&document.body.classList.contains('atelier-inspector-open')&&!e.target.closest('dialog')){e.preventDefault();setInspector(false);return;}
  const cancel=e.key==='Escape'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&busy);if(!cancel||e.target.closest('input,textarea,select,dialog'))return;
  if(active&&busy){e.preventDefault();e.stopImmediatePropagation();instance.SendMessage('HanamaGame','CancelGesture','');}
  else if(settings.photo){e.preventDefault();e.stopImmediatePropagation();photo(false);}else if(e.key==='Escape')closeMenus();
 },true);
 canvas.addEventListener('pointerdown',e=>{if(active){canvasPointers.add(e.pointerId);canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});if(sound&&audio?.state==='suspended')audio.resume();}});
 canvas.addEventListener('pointerup',e=>canvasPointers.delete(e.pointerId));
 canvas.addEventListener('pointercancel',e=>{canvasPointers.delete(e.pointerId);cancel();});
 canvas.addEventListener('lostpointercapture',e=>{if(canvasPointers.delete(e.pointerId))cancel();});
 host.addEventListener('contextmenu',e=>e.preventDefault());
 for(const type of ['pointerdown','pointermove','pointerup','pointercancel','dblclick'])host.addEventListener(type,e=>{if(active)e.stopPropagation();});
 host.addEventListener('wheel',e=>{if(active){e.stopPropagation();if(e.altKey||e.shiftKey)e.preventDefault();}},{passive:false});
 // Choosing a tool returns directly to the unobstructed canvas.
 inspector.querySelectorAll('[data-prune]').forEach(b=>b.addEventListener('click',()=>setInspector(false)));
 function visibility(){present();if(visible()){resizeBuffer();busy=false;schedule();}}
 const observer=new MutationObserver(visibility);observer.observe($('#studio-view'),{attributes:true,attributeFilter:['hidden']});observer.observe($('#modal'),{attributes:true,attributeFilter:['open']});document.addEventListener('visibilitychange',visibility);
 reduced.addEventListener('change',()=>{present();updateControls();});
 coarsePointer.addEventListener('change',()=>{cancel();present();language();});
 new ResizeObserver(()=>{if(active){resizeBuffer();present();}}).observe(host);window.addEventListener('resize',()=>{if(active){resizeBuffer();present();}});
 start();
 return {schedule,cancel,active:()=>active,busy:()=>busy,reset:()=>{sentTextures.clear();schedule();}};
}
