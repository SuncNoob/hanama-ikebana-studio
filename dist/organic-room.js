// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
// All six photographed/painterly rooms and the three original palettes remain selectable.
import {vesselFoot} from './scale.js?v=hn3';
import {scenes} from './legacy-catalog.js?v=restore1';
const ROOM_SOURCES=Object.freeze({
 milk:new URL('./assets/editorial/room-blush.webp',import.meta.url).href,
 sage:new URL('./assets/editorial/room-ivory.webp',import.meta.url).href,
 moon:new URL('./assets/editorial/room-plum.webp',import.meta.url).href,
 'atelier-milk':new URL('./assets/atelier/room-milk.webp',import.meta.url).href,
 'atelier-sage':new URL('./assets/atelier/room-sage.webp',import.meta.url).href,
 'atelier-moon':new URL('./assets/atelier/room-moon.webp',import.meta.url).href
});
const ROOM_KEYS=Object.freeze({paper:'milk',stone:'sage',night:'moon','atelier-milk':'atelier-milk','atelier-sage':'atelier-sage','atelier-moon':'atelier-moon','classic-paper':'classic-paper','classic-stone':'classic-stone','classic-night':'classic-night'});
export const isNightScene=scene=>['night','atelier-moon','classic-night'].includes(scene);
const roomImages=new Map();let roomPreload=null;
/** Decode each same-origin room once before caching a stage raster or export. Failed loads use the fallback. */
export function preloadOrganicRooms(){
 if(roomPreload)return roomPreload;
 if(typeof Image==='undefined')return Promise.resolve([]);
 roomPreload=Promise.all(Object.entries(ROOM_SOURCES).map(([key,url])=>new Promise(resolve=>{
  const img=new Image();let done=false;
  const finish=ok=>{if(done)return;done=true;clearTimeout(timer);img.onload=img.onerror=null;if(ok)roomImages.set(key,img);resolve({key,loaded:ok})};
  const timer=setTimeout(()=>finish(false),12000);
  img.decoding='async';img.onload=()=>{if(typeof img.decode==='function')img.decode().then(()=>finish(true),()=>finish(img.naturalWidth>0));else finish(true)};
  img.onerror=()=>finish(false);img.src=url;
 })));
 return roomPreload;
}
/** Nested ambience is accepted for imported/new drafts; current saved drafts use top-level light, mood and scene. */
export function organicRoomLook(state={}){
 const light=String(state.ambience?.light??state.light??'').toLowerCase(),mood=String(state.ambience?.mood??state.mood??'').toLowerCase();
 // An explicit background always wins: changing light must not silently replace the selected room.
 if(ROOM_KEYS[state.scene])return {key:ROOM_KEYS[state.scene],warm:['dusk','sunset','evening'].includes(light)};
 if(['moon','night','moonlight'].includes(light)||state.scene==='night'||/moon|night|月|夜/.test(mood))return {key:'moon',warm:false};
 if(['dusk','sunset','evening'].includes(light)||/dusk|sunset|黄昏|夕暮/.test(mood))return {key:'milk',warm:true};
 if(['sage','overcast','cloudy','shade'].includes(light)||state.scene==='stone'||/sage|rain|overcast|cloudy|阴|雨|青灰/.test(mood))return {key:'sage',warm:false};
 return {key:'milk',warm:false};
}
/** The table-back horizon is shared at ~81% of all three full-frame images; never crop or pan a room. */
export function paintOrganicRoom(ctx,size,state={}){
 const look=organicRoomLook(state),image=roomImages.get(look.key);
 if(look.key.startsWith('classic-')){paintClassicRoom(ctx,size,look.key);return true}
 if(!image){preloadOrganicRooms();paintRoomFallback(ctx,size,look);return false}
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,0,0,size,size);
 if(look.warm){ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=.13;ctx.fillStyle='#dfad7e';ctx.fillRect(0,0,size,size);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.035;ctx.fillStyle='#f5ce9f';ctx.fillRect(0,0,size,size)}
 ctx.restore();return true;
}
/** Original paper/stone/night paintings, preserved as explicit choices. */
function paintClassicRoom(ctx,size,key){
 const colors=scenes[key],night=isNightScene(key);
 const wall=ctx.createLinearGradient(0,0,size,size);wall.addColorStop(0,colors[0]);wall.addColorStop(.56,colors[0]);wall.addColorStop(1,colors[1]);ctx.fillStyle=wall;ctx.fillRect(0,0,size,size);
 const light=ctx.createRadialGradient(size*.18,size*.12,0,size*.23,size*.18,size*.72);light.addColorStop(0,night?'#dfe9dc18':'#ffffff78');light.addColorStop(.48,night?'#b6c8b512':'#ffffff24');light.addColorStop(1,'#ffffff00');ctx.fillStyle=light;ctx.fillRect(0,0,size,size);
 const horizon=size*.795,floor=ctx.createLinearGradient(0,horizon,0,size);floor.addColorStop(0,night?'#202b25':'#d8d8cf');floor.addColorStop(1,night?'#141c18':'#bfc1b7');ctx.fillStyle=floor;ctx.fillRect(0,horizon,size,size-horizon);ctx.fillStyle=night?'#0d130f22':'#72796d16';ctx.fillRect(0,horizon,size,Math.max(1,size*.002));
}
/** A fast quiet fallback for unavailable images, including DOM-free previews. */
function paintRoomFallback(ctx,size,look){
 const night=look.key.includes('moon'),stone=look.key.includes('sage'),dusk=look.warm;
 const wall=ctx.createLinearGradient(0,0,size,size);
 wall.addColorStop(0,night?'#303b37':stone?'#e5e9e4':dusk?'#f0e7da':'#f2f0e6');
 wall.addColorStop(1,night?'#202c29':stone?'#d3dcd6':dusk?'#dcd3c5':'#dddcd0');ctx.fillStyle=wall;ctx.fillRect(0,0,size,size);
 const pool=ctx.createRadialGradient(size*.3,size*.22,0,size*.32,size*.3,size*.76);
 pool.addColorStop(0,night?'#b6c3cd16':'#fffef5a0');pool.addColorStop(.55,night?'#b6c3cd08':'#fffef528');pool.addColorStop(1,'#fffef500');ctx.fillStyle=pool;ctx.fillRect(0,0,size,size);
 const floor=ctx.createLinearGradient(0,size*.72,0,size);
 const base=night?'15,27,22':stone?'166,184,173':'184,187,171';
 floor.addColorStop(0,`rgba(${base},0)`);floor.addColorStop(.35,`rgba(${base},.13)`);floor.addColorStop(1,`rgba(${base},.45)`);ctx.fillStyle=floor;ctx.fillRect(0,size*.72,size,size*.28);
 const vignette=ctx.createRadialGradient(size*.47,size*.42,size*.28,size*.47,size*.42,size*.85);
 vignette.addColorStop(0,'#273c2a00');vignette.addColorStop(1,night?'#07130e25':'#42533d0c');ctx.fillStyle=vignette;ctx.fillRect(0,0,size,size);
}
export function paintOrganicGround(ctx,size,vessel,night=false){
 if(!vessel)return;const f=vesselFoot(vessel),k=size/100;
 const ellipse=(x,y,rx,ry,alpha)=>{ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(34,44,32,${alpha})`);g.addColorStop(.38,`rgba(34,44,32,${alpha*.5})`);g.addColorStop(1,'rgba(34,44,32,0)');ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();};
 ellipse((f.cx+.5)*k,(f.bottom-.15)*k,f.half*k*1.35,Math.max(.9,f.arc*1.5)*k,night?.13:.1);
 ellipse(f.cx*k,(f.bottom-.22)*k,f.half*k,Math.max(.4,f.arc*.7)*k,night?.22:.17);
}
export function botanicalFlexibility(asset){
 if(['pine','maple','sakura','quince','magnolia'].includes(asset.family))return .22;
 if(['willow','pampas','grass','fern','cosmos','eucalyptus','tulip','calla'].includes(asset.family))return .9;
 if(['peony','rose','camellia','chrysanthemum','dahlia'].includes(asset.family))return .5;
 return .68;
}
