// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/**
 * Pick what you see. A stem's DOM box is its sprite's rotated crop rectangle, mostly empty paper around the plant, so the
 * editor hit-tests the sprite's alpha instead. `sprite.mask` (composeSpecimen in compositor.js) is the alpha of the whole
 * uncropped frame at ≤144 px; a stage point maps into it through stageToSource → (u, warpY(v) / height). Without a mask
 * (an evicted or failed sprite, or an image still loading) the crop rectangle stands in, as the old box hit did.
 * DOM-free, so node --test covers it.
 */
import {dimensions,warpY,stageToSource} from './geometry.js?v=soft2';

/** A mask pixel with alpha above this is part of the plant (the crop probe uses 12; picking ignores faint fringes). */
export const PICK_ALPHA=24;

/** Items from the top of the stage down: stems in front of the vessel (last drawn first), then the ones behind it. */
export function pickOrder(items){return [...items.filter(i=>i.aboveVessel).reverse(),...items.filter(i=>!i.aboveVessel).reverse()]}

/** Mask pixels of one sprite in item space: the point's mask coordinates and CSS px per mask px on each axis. */
function maskFrame(point,item,asset,mask,unit){
 const g=dimensions(item,asset),[u,v]=stageToSource(point,item,asset),y=warpY(v,g.split,g.length);
 return {g,u,y,mx:u*mask.w,my:y/g.height*mask.h,sx:unit*g.ratio/mask.w,sy:unit*g.height/mask.h};
}

/** Nearest pixel with alpha > `alpha` to mask point (mx,my), in CSS px (sx, sy per mask px), if within `radius`; else Infinity.
 Distances run to the pixel's edge, so a point inside a visible pixel is 0. */
function nearestOpaque(mask,mx,my,sx,sy,radius,alpha){
 const rx=radius/sx,ry=radius/sy;
 const x0=Math.max(0,Math.floor(mx-rx)),x1=Math.min(mask.w-1,Math.floor(mx+rx)),y0=Math.max(0,Math.floor(my-ry)),y1=Math.min(mask.h-1,Math.floor(my+ry));
 let best=Infinity;
 for(let py=y0;py<=y1&&best>0;py++){
  const dy=Math.max(0,Math.abs(py+.5-my)-.5)*sy;if(dy>radius||dy>=best)continue;
  const row=py*mask.w;
  for(let px=x0;px<=x1;px++){
   if(mask.data[row+px]<=alpha)continue;
   const dx=Math.max(0,Math.abs(px+.5-mx)-.5)*sx,d=dx?Math.hypot(dx,dy):dy;
   if(d<best){best=d;if(!d)break}
  }
 }
 return best<=radius?best:Infinity;
}

/**
 * Distance in CSS px from stage point [x,y] (0–1 of the stage) to the nearest visible pixel of `item`, or null when it is
 * farther than `radius`. `stagePx` is the stage's on-screen width (zoom included); 0 means the point is on the plant.
 */
export function stemDistance(point,item,asset,sprite,{stagePx,radius=0,alpha=PICK_ALPHA}={}){
 if(!asset||!(stagePx>0)||!(item?.h>0))return null;
 const unit=stagePx*item.h/100,mask=sprite?.mask;
 if(mask?.data&&mask.w>0&&mask.h>0){
  const f=maskFrame(point,item,asset,mask,unit);
  if(!Number.isFinite(f.mx)||!Number.isFinite(f.my))return null;
  const d=nearestOpaque(mask,f.mx,f.my,f.sx,f.sy,radius,alpha);
  return Number.isFinite(d)?d:null;
 }
 // Rectangle fallback: the sprite's crop box, or the whole frame while nothing is composed.
 const g=dimensions(item,asset),[u,v]=stageToSource(point,item,asset),y=warpY(v,g.split,g.length),crop=sprite?.crop;
 if(!Number.isFinite(u)||!Number.isFinite(y))return null;
 const left=crop?crop.x/crop.fullWidth:0,right=crop?(crop.x+crop.width)/crop.fullWidth:1;
 const top=crop?crop.y/crop.fullHeight*g.height:0,bottom=crop?(crop.y+crop.height)/crop.fullHeight*g.height:g.height;
 const d=Math.hypot(Math.max(left-u,0,u-right)*unit*g.ratio,Math.max(top-y,0,y-bottom)*unit);
 return d<=radius?d:null;
}

/** Every item within `radius` CSS px of the point, top-most first: [{id, d, z}] (z = rank from the top, 0 = top). */
export function stemHits(point,items,{assetOf,spriteOf,stagePx,radius=0,alpha=PICK_ALPHA}){
 const hits=[];
 pickOrder(items).forEach((item,z)=>{const d=stemDistance(point,item,assetOf(item),spriteOf(item),{stagePx,radius,alpha});if(d!==null)hits.push({id:item.id,d,z})});
 return hits;
}

/**
 * The stem a press lands on:
 *  - the selected stem when it is within `keep` px, unless a stem drawn above it is directly under the point (with
 *    `selectedFirst`, cut and erase keep their target whenever it is within `keep`);
 *  - otherwise the top-most stem directly under the point;
 *  - otherwise the nearest stem within `radius` (ties go to the higher one); null when there is none.
 */
export function choosePick(hits,selectedId,{radius=0,keep=radius,selectedFirst=false}={}){
 const sel=selectedId?hits.find(h=>h.id===selectedId&&h.d<=keep):null,top=hits.find(h=>h.d===0)||null;
 if(sel&&(selectedFirst||!top||top.z>=sel.z))return sel.id;
 if(top)return top.id;
 let best=null;for(const h of hits)if(h.d<=radius&&(!best||h.d<best.d))best=h;
 return best?best.id:null;
}

/** Repeat taps on one spot walk down the stack: stems under the point from the top, then the near ones by distance. */
export function cycleOrder(hits){
 return [...hits.filter(h=>h.d===0),...hits.filter(h=>h.d>0).sort((a,b)=>a.d-b.d||a.z-b.z)].map(h=>h.id);
}
/** The stem after `currentId` in a cycle order (wrapping), or the first one. */
export function nextInCycle(order,currentId){
 if(!order.length)return null;const index=order.indexOf(currentId);return order[(index+1)%order.length];
}

/**
 * Whether an erase stroke reaches the plant: any stroke sample (segments walked at ≤ half the radius) within the brush
 * radius of a mask pixel with alpha > `alpha`. `cut` is a brush cut as stored on items: source-space points [u, v] and a
 * radius in source heights. Without a mask the stroke is assumed to touch (the old behaviour).
 */
export function strokeTouches(mask,cut,item,asset,{alpha=12}={}){
 const points=Array.isArray(cut?.points)?cut.points.filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])):[];
 if(!points.length)return false;
 if(!mask?.data||!(mask.w>0&&mask.h>0)||!asset)return true;
 const g=dimensions(item,asset),scale=mask.h/g.height,r=Math.max(0,Number(cut.radius)||0)*scale;
 const at=p=>[p[0]*mask.w,warpY(p[1],g.split,g.length)*scale];
 const touches=(x,y)=>Number.isFinite(nearestOpaque(mask,x,y,1,1,r,alpha));
 let previous=at(points[0]);if(touches(...previous))return true;
 const step=Math.max(.5,r/2);
 for(let n=1;n<points.length;n++){
  const next=at(points[n]),length=Math.hypot(next[0]-previous[0],next[1]-previous[1]),count=Math.ceil(length/step);
  for(let k=1;k<=count;k++){const t=k/count;if(touches(previous[0]+(next[0]-previous[0])*t,previous[1]+(next[1]-previous[1])*t))return true}
  previous=next;
 }
 return false;
}
