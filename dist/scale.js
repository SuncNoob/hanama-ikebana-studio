/** True-to-life sizing. The square stage is 100 cm tall, so one stage percent equals one centimetre. */
import {realScale} from './real-scale.js?v=13';
import {dimensions, vesselGeometry, warpY} from './geometry.js?v=13';

export const SIZE_RANGE=[.8,1.25];
export const MAX_STEM_CM=60;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

/** Replace each specimen's catalogue height with its measured real height; keep the old value for reference. */
export function applyRealScale(assets){
 for(const a of assets){
  const r=realScale[a.id];if(!r)continue;
  a.designHeight=a.height;a.height=r.cm;a.tip=r.tip;
  if(r.stems){a.stems=r.stems;a.stemLength=1}
 }
}
export const sizeBounds=a=>[Math.round(a.height*SIZE_RANGE[0]*10)/10,Math.round(a.height*SIZE_RANGE[1]*10)/10];
export const sizeRatio=(item,a)=>item.h/a.height;
export const outOfScale=(item,a)=>{const [min,max]=sizeBounds(a);return item.h<min-.05||item.h>max+.05};
/** Book photographs are flower heads; their "length" draws a natural stem below the photograph. */
export const drawsStem=a=>!!a?.stems;
/** Centimetres of drawn stem per unit of `length`. 0 when the base is trimmed up to the photograph's split, so no drawn stem remains. */
export const stemUnit=(item,a)=>{const g=dimensions({...item,length:1},a),span=g.end-g.split;return span<.01||!(item.h>0)?0:item.h*span};
export function lengthBounds(a,h=a.height,trim=0){
 if(!drawsStem(a))return [.6,2.4];
 const unit=stemUnit({h,trim},a);
 return [.6,unit?Math.max(2.4,1+MAX_STEM_CM/unit):2.4];
}
export const stemCm=(item,a)=>Math.max(0,((item.length??1)-1)*stemUnit(item,a));
export const lengthForStem=(item,a,cm)=>{const unit=stemUnit(item,a);return unit?1+Math.max(0,cm)/unit:(item.length??1)};
/** Drawn-stem flowers whose base was trimmed by an older version (the trim control is hidden for them now). */
export const stemTrimmed=(item,a)=>drawsStem(a)&&(item.trim||0)>0;

/**
 * Sprite resolution budget: the source-image scale `k` for composeSpecimen.
 * Enough pixels for `pxPerCm` source px per stage-centimetre at the item's current size (32 = twice the 1600 px export),
 * capped so the uncropped sprite stays near `maxPixels`. The resolution term is rounded up and the pixel cap down to
 * steps of 1/`step`, so small size changes reuse the cached sprite.
 */
export function spriteScale(item,a,srcW,srcH,{pxPerCm=32,maxPixels=4e6,step=16}={}){
 if(!(srcW>0&&srcH>0))return 1;
 const g=dimensions({trim:0,...item},a),tall=Math.max(1e-3,Number.isFinite(g.height)?g.height:1e3);
 const want=Math.ceil(pxPerCm*Math.max(item.h||0,a.height||0)/srcH*step-1e-9)/step;
 const capRaw=Math.sqrt(maxPixels/(srcW*srcH*tall)),cap=capRaw>=1/step?Math.floor(capRaw*step+1e-9)/step:capRaw;
 const k=Math.min(1,want,cap);
 return k>0?Math.max(k,1/1024):1/step;
}
/** Uncropped sprite size for scale k (what composeSpecimen allocates before its bounding-box crop). */
export function spriteSize(item,a,srcW,srcH,k=1){
 const w=Math.max(1,Math.round(srcW*k)),h=Math.max(1,Math.round(srcH*k));
 return [w,Math.max(1,Math.round(h*dimensions({trim:0,...item},a).height))];
}
/** Backing size of a stage canvas: its CSS height times min(2,dpr) with 25% headroom, never more than the sprite. */
export function stageCanvasSize(spriteW,spriteH,cssHeight,dpr=1){
 const h=Math.max(1,Math.min(spriteH,Math.ceil(Math.max(0,cssHeight)*Math.min(2,dpr||1)*1.25)));
 return [Math.max(1,Math.round(h*spriteW/Math.max(1,spriteH))),h];
}
/** Whole visible specimen height in centimetres. */
export const itemCm=(item,a)=>item.h*dimensions(item,a).height;

/** A stem base inside the vessel opening nearest to x. */
export function mouthBase(vessel,x,spread=.55){
 const g=vesselGeometry(vessel),openings=g.openings.length?g.openings:[{center:g.insertion,radius:[2,1],index:0}];
 const primary=openings.find(o=>o.primary)||openings[0];
 const nearest=openings.reduce((best,o)=>Math.abs(o.center[0]-x)<Math.abs(best.center[0]-x)?o:best,openings[0]);
 const center=nearest===primary?g.insertion[0]:nearest.center[0],r=nearest.radius[0]*spread;
 const y=nearest===primary?g.insertion[1]:nearest.center[1]+Math.min(1.8,nearest.radius[1]+.8);
 return [clamp(Number.isFinite(x)?x:center,center-r,center+r),y];
}

/** Where the flower or branch focus currently sits on the stage. */
export function tipPoint(item,a){
 const g=dimensions(item,a),tip=a.tip||[g.anchor,.2],s=item.h/100;
 const dx=(tip[0]-g.anchor)*g.ratio*s*(item.flip?-1:1),dy=(warpY(tip[1],g.split,g.length)-g.pivotY)*s,r=item.angle*Math.PI/180;
 return [item.x+100*(dx*Math.cos(r)-dy*Math.sin(r)),item.y+100*(dx*Math.sin(r)+dy*Math.cos(r))];
}

/** Rotate and lengthen a stem so its base sits at `base` while its focus reaches `target` as closely as it can. */
export function reach(item,a,base,target){
 const [minL,maxL]=lengthBounds(a,item.h,item.trim||0),tip=a.tip||[a.anchor??.5,.2];
 const local=length=>{const g=dimensions({...item,length,cropAnchorY:1},a);return [(tip[0]-g.anchor)*g.ratio*item.h*(item.flip?-1:1),(warpY(tip[1],g.split,length)-g.height)*item.h]};
 const want=Math.hypot(target[0]-base[0],target[1]-base[1]),reachOf=L=>Math.hypot(...local(L));
 let length;
 if(reachOf(minL)>=want)length=minL;
 else if(reachOf(maxL)<=want)length=maxL;
 else{let lo=minL,hi=maxL;for(let k=0;k<40;k++){const mid=(lo+hi)/2;if(reachOf(mid)<want)lo=mid;else hi=mid}length=(lo+hi)/2}
 const v=local(length);let angle=(Math.atan2(target[1]-base[1],target[0]-base[0])-Math.atan2(v[1],v[0]))*180/Math.PI;
 angle=((angle+540)%360)-180;
 return {x:base[0],y:base[1],length:Math.round(length*1000)/1000,angle:Math.round(angle*10)/10,cropAnchorY:1};
}
