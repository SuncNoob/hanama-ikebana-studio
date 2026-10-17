/* SPDX-FileCopyrightText: 2026 Marko Sun
   SPDX-License-Identifier: LicenseRef-Hanama-Proprietary */
// A screen-space tool cursor. It never handles the edit or becomes part of the artwork.
export function mountEraserCursor({stage,brushInput,getDiameter=()=>Number(brushInput?.value)||16}){
 const existing=stage.querySelector('.eraser-cursor');if(existing)return null;
 const overlay=document.createElement('div');overlay.className='eraser-cursor';overlay.hidden=true;overlay.setAttribute('aria-hidden','true');
 overlay.innerHTML='<span class="eraser-cursor-ring"></span><span class="eraser-cursor-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="m4 14 9-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-9 10H8l-4-4a3 3 0 0 1 0-4 M9 9l9 9 M12 22h10"/></svg></span>';
 stage.append(overlay);
 const ring=overlay.querySelector('.eraser-cursor-ring'),icon=overlay.querySelector('.eraser-cursor-icon');
 const studio=document.querySelector('#studio-view');
 const dismissers=[...document.querySelectorAll('dialog,#quick-material-drawer,#layer-menu,.atelier-disclosure,#atelier-length-panel')];
 let point=null,contact=null,frame=0;
 const blocked=()=>document.hidden||studio?.hidden||document.body.classList.contains('game-photo-mode')||document.body.classList.contains('atelier-inspector-open')||dismissers.some(node=>node.matches('dialog,.atelier-disclosure')?node.open:!node.hidden);
 const hide=()=>{overlay.hidden=true;stage.classList.remove('eraser-pointer-active');};
 function clear(){point=null;contact=null;hide();}
 function refresh(){
  if(frame){cancelAnimationFrame(frame);frame=0;}
  if(stage.dataset.tool!=='brush'||blocked()){clear();return;}
  if(!point||(point.type!=='mouse'&&contact===null)){hide();return;}
  // Use the same content box as native input, excluding the stage border.
  const target=stage.querySelector('#unity-canvas')||stage,rect=target.getBoundingClientRect(),x=point.x-rect.left,y=point.y-rect.top;
  if(!rect.width||!rect.height||x<0||y<0||x>rect.width||y>rect.height){hide();return;}
  // The native render target can have a smaller buffer or a different DPR. Both the
  // pointer and the brush are measured in client CSS pixels, independent of that buffer.
  const scaleX=rect.width/Math.max(1,stage.offsetWidth),scaleY=rect.height/Math.max(1,stage.offsetHeight);
  const diameter=Math.max(.1,Number(getDiameter())||Number(brushInput?.value)||16);
  const outer=overlay.getBoundingClientRect(),ox=(point.x-outer.left)/scaleX,oy=(point.y-outer.top)/scaleY;
  ring.style.left=`${ox}px`;ring.style.top=`${oy}px`;
  ring.style.width=`${diameter/scaleX}px`;ring.style.height=`${diameter/scaleY}px`;
  const iconSize=Math.min(20,Math.max(12,diameter*.7));
  // A centred, translucent glyph identifies the actual erase point on every device.
  icon.style.left=`${ox}px`;icon.style.top=`${oy}px`;
  icon.style.width=`${iconSize/scaleX}px`;icon.style.height=`${iconSize/scaleY}px`;
  overlay.dataset.contact=String(contact!==null);overlay.dataset.pointer=point.type;
  overlay.hidden=false;stage.classList.add('eraser-pointer-active');
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;refresh();});}
 function remember(e){point={x:e.clientX,y:e.clientY,type:e.pointerType||'mouse'};}
 function eligible(e){return e.isPrimary!==false&&!(e.target instanceof Element&&e.target.closest('button,a,input,select,textarea,.start-card,.mode-pill'));}
 // Capture runs before the Unity host stops propagation. No preventDefault, capture,
 // or synthetic events: the real canvas keeps exclusive ownership of the gesture.
 stage.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch'&&e.isPrimary===false){clear();return;}
  if(!eligible(e)||e.button!==0||stage.dataset.tool!=='brush'||blocked())return;
  contact=e.pointerId;remember(e);refresh();
 },true);
 stage.addEventListener('pointermove',e=>{
  if(!eligible(e)||(contact!==null&&e.pointerId!==contact))return;
  if(e.pointerType!=='mouse'&&contact!==e.pointerId)return;
  remember(e);schedule();
 },true);
 stage.addEventListener('pointerleave',()=>{point=null;hide();});
 window.addEventListener('pointerup',e=>{
  if(contact!==e.pointerId)return;contact=null;
  if(e.pointerType==='mouse'){remember(e);refresh();}else clear();
 },true);
 window.addEventListener('pointercancel',e=>{if(contact===e.pointerId)clear();},true);
 stage.addEventListener('lostpointercapture',e=>{if(contact===e.pointerId)clear();},true);
 window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'))clear();},true);
 window.addEventListener('resize',clear);window.addEventListener('scroll',clear,true);
 brushInput?.addEventListener('input',refresh);
 const observer=new MutationObserver(refresh);
 observer.observe(stage,{attributes:true,attributeFilter:['data-tool']});
 observer.observe(document.body,{attributes:true,attributeFilter:['class']});
 if(studio)observer.observe(studio,{attributes:true,attributeFilter:['hidden']});
 for(const node of dismissers)observer.observe(node,{attributes:true,attributeFilter:['open','hidden']});
 return {refresh,clear};
}
