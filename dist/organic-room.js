// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
// Nine quiet photographic backgrounds. Saved scene IDs stay stable.
import {vesselFoot} from './scale.js?v=scale4';
import {scenes} from './legacy-catalog.js?v=quiet2';
const ROOM_SOURCES=Object.freeze({
 'paper':new URL('./assets/quiet/iris-light.webp',import.meta.url).href,
 'stone':new URL('./assets/quiet/smoke-grey.webp',import.meta.url).href,
 'night':new URL('./assets/quiet/charcoal.webp',import.meta.url).href,
 'atelier-milk':new URL('./assets/quiet/warm-plaster.webp',import.meta.url).href,
 'atelier-sage':new URL('./assets/quiet/rain-grey.webp',import.meta.url).href,
 'atelier-moon':new URL('./assets/quiet/earth-taupe.webp',import.meta.url).href,
 'classic-paper':new URL('./assets/quiet/quiet-print.webp',import.meta.url).href,
 'classic-stone':new URL('./assets/quiet/paper-relief.webp',import.meta.url).href,
 'classic-night':new URL('./assets/quiet/silver-grey.webp',import.meta.url).href
});
export const isNightScene=scene=>scene==='night';
export const isPhotographicScene=scene=>Object.hasOwn(ROOM_SOURCES,scene);
const roomImages=new Map();let roomPreload=null;
/** Decode each same-origin room once before caching a stage raster or export. Failed loads use the fallback. */
export function preloadOrganicRooms(){
 if(roomPreload)return roomPreload;
 if(typeof Image==='undefined')return Promise.resolve([]);
 roomPreload=Promise.all(Object.entries(ROOM_SOURCES).map(([key,url])=>new Promise(resolve=>{
  const img=new Image();let done=false;
  const finish=ok=>{if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;if(ok)roomImages.set(key,img);resolve({key,loaded:ok})};
  const timer=setTimeout(()=>finish(false),12000);
  // decode() can wait for a rendered frame in a hidden tab. A loaded bitmap remains usable in that case.
  img.decoding='async';img.onload=()=>{if(typeof img.decode==='function')Promise.race([img.decode().catch(()=>{}),new Promise(r=>setTimeout(r,300))]).then(()=>finish(img.naturalWidth>0));else finish(true)};
  img.onerror=()=>finish(false);img.src=url;
 })));
 return roomPreload;
}
/** Light controls never silently replace the chosen background. */
export function organicRoomLook(state={}){
 if(isPhotographicScene(state.scene))return {key:state.scene};
 const light=state.ambience?.light??state.light;
 return {key:light==='moon'?'night':light==='noon'?'stone':'paper'};
}
/** The photograph supplies its own natural light; never add colored washes or corner vignettes. */
export function paintOrganicRoom(ctx,size,state={}){
 const {key}=organicRoomLook(state),image=roomImages.get(key);
 ctx.save();
 if(image){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,size,size)}
 else{
  preloadOrganicRooms();
  const [wall,floor]=scenes[key]||scenes.paper;
  const base=ctx.createLinearGradient(0,0,0,size);base.addColorStop(0,wall);base.addColorStop(.7,wall);base.addColorStop(1,floor);
  ctx.fillStyle=base;ctx.fillRect(0,0,size,size);
 }
 ctx.restore();return !!image;
}
/** Small neutral contact shadows follow the vessel's measured footprint. */
export function paintOrganicGround(ctx,size,vessel,night=false){
 if(!vessel)return;const f=vesselFoot(vessel),k=size/100;
 const ellipse=(x,y,rx,ry,alpha)=>{ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(30,29,27,${alpha})`);g.addColorStop(.38,`rgba(30,29,27,${alpha*.5})`);g.addColorStop(1,'rgba(30,29,27,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();};
 ellipse((f.cx+.5)*k,(f.bottom-.15)*k,f.half*k*1.35,Math.max(.9,f.arc*1.5)*k,night?.13:.12);
 ellipse(f.cx*k,(f.bottom-.22)*k,f.half*k,Math.max(.4,f.arc*.7)*k,night?.25:.24);
}
export function botanicalFlexibility(asset){
 if(['pine','maple','sakura','quince','magnolia'].includes(asset.family))return .22;
 if(['willow','pampas','grass','fern','cosmos','eucalyptus','tulip','calla'].includes(asset.family))return .9;
 if(['peony','rose','camellia','chrysanthemum','dahlia'].includes(asset.family))return .5;
 return .68;
}
