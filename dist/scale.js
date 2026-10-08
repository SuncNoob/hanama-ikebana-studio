// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** True-to-life sizing. The square stage is 100 cm tall, so one stage percent equals one centimetre. */
import {realScale,stemFix} from './real-scale.js?v=hn2';
import {dimensions, vesselGeometry, warpY, unwarpY, sourceToStage} from './geometry.js?v=28';
import {stemMaxCm, rolesOf, roleOf, stemMmOf} from './botany.js?v=hn2';
import {specimenMetrics,vesselMetrics} from './asset-metrics.js?v=hn2';

export const SIZE_RANGE=[.8,1.25];
export const MAX_STEM_CM=60;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

/** Replace each specimen's catalogue height with its measured real height; keep the old value for reference. Also attach the v2 drawn-stem fixes. */
export function applyRealScale(assets){
 for(const a of assets){
  if(stemFix[a.id])a.stemFix=stemFix[a.id];
  const r=realScale[a.id];if(!r)continue;
  a.designHeight=a.height;a.height=r.cm;a.tip=r.tip;
  if(r.stems){a.stems=r.stems;a.stemLength=1}
 }
}
export const sizeBounds=a=>[Math.round(a.height*SIZE_RANGE[0]*10)/10,Math.round(a.height*SIZE_RANGE[1]*10)/10];
/** The same natural range as ratios of true size, for scaling a size factor (studies, pose swaps). */
export const sizeRatioBounds=a=>{const [min,max]=sizeBounds(a);return [min/a.height,max/a.height]};
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

/** A visible (or partly visible) pin holder: stems stand on its pins instead of entering the mouth. */
export const isKenzan=vessel=>['kenzan','pin-frog-wire'].includes(vessel?.fixture?.kind)&&vessel.fixture.visibility!=='hidden';
/** Kenzan geometry (cm): staggered pin pitch, pin height, plate thickness, clear rim around the pins, and the waterline above a stem base in a water vessel. */
export const KENZAN=Object.freeze({pitch:.4,pin:1,plate:.7,margin:.3,water:.8});
/**
 * The visible pin holders of a kenzan vessel in stage cm: [{index, center:[x,y] (top face), rx, ry, ratio, material, water,
 * deep (a 'partial' holder, seen through more water), opening, lip (stage y of the vessel's inner front edge in front of
 * the holder when the fixture data gives one as `lip`, local 0–1 like its centre: the front wall hides what lies below it; else null)}]. A holder is round, so its top face is foreshortened like
 * the opening it stands in (ry/rx of an elliptical opening; a rectangular opening's depth also reflects its shape, so there
 * the data's own ratio is the floor). [] for other vessels.
 */
export function kenzanHolders(vessel){
 if(!isKenzan(vessel))return [];
 const g=vesselGeometry(vessel),f=g.fixture;if(!f?.centers?.length)return [];
 const o=g.openings[(f.targets||[0])[0]]||g.openings[0],[rx,dataRy]=f.radius,data=dataRy/Math.max(.01,rx);
 const open=o?o.radius[1]/Math.max(.01,o.radius[0]):data,ratio=clamp(o?.shape==='rect'?Math.max(open,data):open,.05,1);
 const lip=Number.isFinite(f.lip)?g.top+f.lip*g.height:null;
 return f.centers.map((center,index)=>({index,center,rx,ry:rx*ratio,ratio,material:f.material||'brass',water:!!f.water,deep:f.visibility==='partial',opening:o?.index??0,lip}));
}
const pinGrids=new Map();
/** A holder's pins as [{u,v}] cm on its top face (v toward the viewer): a staggered grid within rx − margin, back rows first. Shared; do not mutate. */
export function kenzanPins(holder){
 const p=KENZAN.pitch,R=Math.max(p,holder.rx-KENZAN.margin),key=Math.round(R*1e4);
 if(pinGrids.has(key))return pinGrids.get(key);
 const dv=p*Math.sqrt(3)/2,pins=[];
 for(let j=-Math.floor(R/dv);j<=Math.floor(R/dv);j++){
  const v=j*dv,half=Math.sqrt(Math.max(0,R*R-v*v)),off=(j&1)?p/2:0;
  for(let u=off+Math.ceil((-half-off)/p-1e-9)*p;u<=half+1e-9;u+=p)pins.push(Object.freeze({u:Math.round(u*1e4)/1e4,v:Math.round(v*1e4)/1e4}));
 }
 pinGrids.set(key,Object.freeze(pins));
 return pinGrids.get(key);
}
/** Where a stage point lies on a holder's top face: {u, v} in cm, and `on` when it is within the face. */
export function onHolder(holder,[x,y]){
 const u=x-holder.center[0],v=(y-holder.center[1])/holder.ratio;
 return {u,v,on:Math.hypot(u,v)<=holder.rx};
}
/**
 * A stem base inside the vessel opening nearest to x. On a visible kenzan the base stands on the pins of the nearest holder:
 * within ¾ of its radius, a little in front of its centre for stems drawn before the vessel (`front`) and behind it otherwise.
 * Every other vessel gives exactly the same point as before the kenzan rule existed.
 */
export function mouthBase(vessel,x,spread=.55,{front=false}={}){
 const {center,lo,hi,y}=mouthSpan(vessel,x,spread,{front});
 return [clamp(Number.isFinite(x)?x:center,lo,hi),y];
}
/** The stretch of the mouth (or kenzan holder) nearest to x where mouthBase may put a base: {center, lo, hi, y} in stage cm. */
export function mouthSpan(vessel,x,spread=.55,{front=false}={}){
 if(isKenzan(vessel)){
  const fixture=vesselGeometry(vessel).fixture;
  if(fixture?.centers?.length){
   const c=fixture.centers.reduce((best,p)=>Math.abs(p[0]-x)<Math.abs(best[0]-x)?p:best,fixture.centers[0]),[rx,ry]=fixture.radius,r=rx*.75;
   return {center:c[0],lo:c[0]-r,hi:c[0]+r,y:c[1]-.15*ry+(front?.3:-.3)*ry};
  }
 }
 const g=vesselGeometry(vessel),openings=g.openings.length?g.openings:[{center:g.insertion,radius:[2,1],index:0}];
 const primary=openings.find(o=>o.primary)||openings[0];
 const nearest=openings.reduce((best,o)=>Math.abs(o.center[0]-x)<Math.abs(best.center[0]-x)?o:best,openings[0]);
 const center=nearest===primary?g.insertion[0]:nearest.center[0],r=nearest.radius[0]*spread;
 const y=nearest===primary?g.insertion[1]:nearest.center[1]+Math.min(1.8,nearest.radius[1]+.8);
 return {center,lo:center-r,hi:center+r,y};
}
/**
 * Steer-drag: the base slides along the mouth toward x, within the mouthBase stretch of the opening it stands in, and
 * never further out than where it started (a base near the rim does not jump inward when the drag begins).
 */
export function slideBase(vessel,x0,x,{spread=.55,front=false}={}){
 const {lo,hi}=mouthSpan(vessel,x0,spread,{front});
 return clamp(x,Math.min(lo,x0),Math.max(hi,x0));
}
/**
 * A base 1.5 cm to `side` (1 right, −1 left) of x along the mouth, for a duplicate. When x is at the edge of the mouth on that
 * side (the base would land within 0.5 cm of x), the other side is taken if it lands farther away.
 */
export function besideBase(vessel,x,side=1,{front=false}={}){
 const s=Math.sign(side||1),near=mouthBase(vessel,x+1.5*s,.55,{front});
 if(Math.abs(near[0]-x)>=.5)return near;
 const far=mouthBase(vessel,x-1.5*s,.55,{front});
 return Math.abs(far[0]-x)>Math.abs(near[0]-x)?far:near;
}

/** Where the flower or branch focus currently sits on the stage. */
export function tipPoint(item,a){
 const g=dimensions(item,a),tip=a.tip||[g.anchor,.2],s=item.h/100;
 const dx=(tip[0]-g.anchor)*g.ratio*s*(item.flip?-1:1),dy=(warpY(tip[1],g.split,g.length)-g.pivotY)*s,r=item.angle*Math.PI/180;
 return [item.x+100*(dx*Math.cos(r)-dy*Math.sin(r)),item.y+100*(dx*Math.sin(r)+dy*Math.cos(r))];
}

/** Stem-local vector (cm, before rotation) from the stem base to the focus at `length` and `trim`.
 The base is the bottom of the visible photograph (cropAnchorY 1), unless `keepPivot` keeps the item's own pivot. */
function focusVector(item,a,length=item.length??1,trim=item.trim,keepPivot=false){
 const tip=a.tip||[a.anchor??.5,.2],g=dimensions({...item,length,trim,...(keepPivot?{}:{cropAnchorY:1})},a);
 return [(tip[0]-g.anchor)*g.ratio*item.h*(item.flip?-1:1),(warpY(tip[1],g.split,length)-(keepPivot?g.pivotY:g.height))*item.h];
}
const angleTo=(v,base,target)=>{const angle=(Math.atan2(target[1]-base[1],target[0]-base[0])-Math.atan2(v[1],v[0]))*180/Math.PI;return Math.round((((angle+540)%360)-180)*10)/10};
const distance=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);

/** Rotate and lengthen a stem so its base sits at `base` while its focus reaches `target` as closely as it can. */
export function reach(item,a,base,target){
 const [minL,maxL]=lengthBounds(a,item.h,item.trim||0);
 const want=distance(base,target),reachOf=L=>Math.hypot(...focusVector(item,a,L));
 let length;
 if(reachOf(minL)>=want)length=minL;
 else if(reachOf(maxL)<=want)length=maxL;
 else{let lo=minL,hi=maxL;for(let k=0;k<40;k++){const mid=(lo+hi)/2;if(reachOf(mid)<want)lo=mid;else hi=mid}length=(lo+hi)/2}
 return {x:base[0],y:base[1],length:Math.round(length*1000)/1000,angle:angleTo(focusVector(item,a,length),base,target),cropAnchorY:1};
}

/** The rotation (degrees) that points a stem standing at `base` toward `target`, keeping its length, trim and pivot. */
export function aim(item,a,base,target,length=item.length??1){
 return angleTo(focusVector(item,a,length,item.trim||0,true),base,target);
}

/** Natural length window for photographed stems: a slight squash or stretch only; shorter is a cut, not a squash. */
export const PHOTO_LENGTH=[.9,1.15];
/** Highest base trim (%) a solver may use: never more than the trim control allows, and never up to the focus. */
const maxTrim=a=>Math.max(0,Math.min(60,Math.floor((.9-(a.tip?.[1]??.2))*100)));
/** Drawn-stem rotation caps for studies and solvers: heads that hang naturally may tip a little further. */
export const angleCap=a=>['amaranthus','snowberry','fritillary','jasmine'].includes(a?.family)?60:55;

/**
 * Place a stem at `base` and aim its focus at `target` the way a florist would.
 * Drawn-stem flower heads grow their stem (never squash the photograph) up to the species' soft cap `stemMaxCm`.
 * Photographed stems keep a natural length (PHOTO_LENGTH); a stem that is still too long is cut from the base (`trim`,
 * never less than it already is), and one that is too short stays short. `miss` is the focus error in cm.
 */
export function solveTo(item,a,base,target){
 const want=distance(base,target),start=Math.max(0,item.trim||0);
 let length,trim=start;
 if(drawsStem(a)){
  const capL=lengthForStem({...item,trim},a,stemMaxCm(a)),{length:wanted}=reach({...item,trim},a,base,target);
  length=stemUnit({...item,trim},a)?clamp(wanted,1,Math.max(1,Math.min(capL,lengthBounds(a,item.h,trim)[1]))):(item.length??1);
 }else{
  const [minL,maxL]=lengthBounds(a,item.h,trim),lo=Math.max(minL,PHOTO_LENGTH[0]),hi=Math.min(maxL,PHOTO_LENGTH[1]);
  const reachOf=(L,t)=>Math.hypot(...focusVector(item,a,L,t));
  if(reachOf(lo,trim)>want){
   const top=Math.max(trim,maxTrim(a));let tLo=trim,tHi=top;
   if(reachOf(lo,top)>want)trim=top;
   else{
    for(let k=0;k<40;k++){const mid=(tLo+tHi)/2;if(reachOf(lo,mid)>want)tLo=mid;else tHi=mid}
    // Whole-percent cut: one step past the exact cut unless the little stretch left cannot make up for it, then one step short.
    trim=Math.min(top,Math.ceil(tHi-1e-9));if(reachOf(hi,trim)<want)trim=Math.max(start,Math.floor(tHi+1e-9));
   }
  }
  // Cut above the stretchable band, length no longer changes anything: keep the shortest (or the stem's own) value.
  if(Math.abs(reachOf(hi,trim)-reachOf(lo,trim))<1e-9)length=trim>start?lo:clamp(item.length??1,lo,hi);
  else if(reachOf(lo,trim)>=want)length=lo;
  else if(reachOf(hi,trim)<=want)length=hi;
  else{let a0=lo,a1=hi;for(let k=0;k<40;k++){const mid=(a0+a1)/2;if(reachOf(mid,trim)<want)a0=mid;else a1=mid}length=(a0+a1)/2}
 }
 length=Math.round(length*1000)/1000;
 const angle=angleTo(focusVector(item,a,length,trim),base,target);
 const fit={x:base[0],y:base[1],length,angle,trim,cropAnchorY:1,cropAnchorSourceY:null};
 return {...fit,miss:Math.round(distance(tipPoint({...item,...fit},a),target)*10)/10};
}

/**
 * Whether a stem stands in the vessel: its base within the nearest opening (with a little tolerance) and not upside down.
 * A detached cut piece is measured at its cut end (cutEnd) when it has one; its rotation says nothing about which way the
 * piece itself points, so only the cut end counts. Other stems, and pieces without a stored cut end, use (item.x, item.y).
 */
export function seatState(item,a,vessel){
 const end=cutEnd(item,a);
 return end?seatAt({x:end[0],y:end[1],angle:0},vessel):seatAt(item,vessel);
}
/** seatState's measurement at (item.x, item.y) and item.angle, whatever the item is (seatClip measures where a sprite's stem really ends). */
function seatAt(item,vessel){
 const g=vesselGeometry(vessel),openings=g.openings.length?g.openings:[{center:g.insertion,radius:[2,1],frontRimY:g.insertion[1],index:0,primary:true}];
 const primary=openings.find(o=>o.primary)||openings[0],centerX=o=>o===primary?g.insertion[0]:o.center[0];
 const opening=openings.reduce((best,o)=>Math.abs(centerX(o)-item.x)<Math.abs(centerX(best)-item.x)?o:best,openings[0]);
 const [rx,ry]=opening.radius,tol=Math.max(.8,rx*.15),top=opening.center[1]-ry-tol;
 const bottom=Math.max(opening.frontRimY,opening===primary?g.insertion[1]:opening.center[1])+(vessel?.fixture?.kind==='neck'?4:1);
 const dx=Math.max(0,Math.abs(item.x-centerX(opening))-(rx+tol)),dy=Math.max(0,top-item.y,item.y-bottom),gap=Math.round(Math.hypot(dx,dy)*100)/100;
 return {seated:gap===0&&Math.abs(item.angle||0)<=110,gap,opening:opening.index??0};
}

/**
 * About how wide a stem is where it enters the vessel, in cm (0.25–2.5): drawn stems use the species' stem range (a bundle
 * of drawn stems gathers within 1.4 cm), an untrimmed photograph its measured cut end near the anchor, anything else the
 * species' range or 0.5 cm.
 */
export function stemWidthCm(item,a){
 const g=dimensions(item,a),mm=stemMmOf(a),species=mm?mm[1]/10:null;
 if(drawsStem(a)&&g.length>1&&g.end>g.split)return clamp((species??.45)+(a.stems.length>1?1.4:0),.25,2.5);
 const runs=specimenMetrics[a?.id]?.bottomRuns,wide=(item.h||a.height)*g.ratio;
 if(runs?.length&&!(item.trim>0)&&wide>0){
  const win=1.5/wide,near=runs.filter(([u0,u1])=>u1>=g.anchor-win&&u0<=g.anchor+win);
  if(near.length)return clamp((Math.max(...near.map(r=>r[1]))-Math.min(...near.map(r=>r[0])))*wide,.25,2.5);
 }
 return clamp(species??.5,.25,2.5);
}
/** Half-width (cm) an opening needs before the stems standing in it are drawn inside it (see seatClip). */
export const INTERIOR_MIN_RX=4.5;
/**
 * How a seated stem meets its vessel in the picture (stage cm), or null when it does not stand in an opening.
 * - A stem drawn behind the vessel in a mouth at least 9 cm across gets `interior`: its lowest 15 cm, within radius
 *   max(1.2 cm, 2× stem width) of its axis, is shown again inside its opening, so it visibly enters the mouth (heads behind
 *   the vessel stay hidden). Off a kenzan, nothing below `floor` (the opening's centre + half its depth, where the front
 *   lip lies) is shown.
 * - A stem drawn in front whose base lies below its opening's front rim, or below the opening itself (under the front
 *   lip), gets `rim`: the vessel covers it from the base to 0.4 cm past the point where it first reaches the opening or its
 *   centre line, and at least past the front rim (radius max(1 cm, stem width)), below the opening's centre line and
 *   outside the opening.
 *   Detached cut pieces never get a rim cover: their axis need not follow the piece.
 * The base is the item's pivot, which the editor keeps at the visible bottom of the photograph, and the axis its rotation,
 * unless `foot` ({x, y, width, dir?, slack?} in stage cm, measured from the sprite) says where and in which direction the
 * stem itself leaves that bottom: a trimmed photograph is cut above its own stem end, where the stem rarely stands at the
 * anchor or follows the photograph's vertical. A measured rim cover hugs the stem: radius max(0.55, width/2 + slack).
 */
export function seatClip(item,a,vessel,foot=null){
 if(!a||!vessel)return null;
 const at=foot&&Number.isFinite(foot.x)&&Number.isFinite(foot.y)?{...item,x:foot.x,y:foot.y}:item;
 const seat=seatAt(at,vessel);if(!seat.seated)return null;
 const r=(item.angle||0)*Math.PI/180,measured=at!==item&&foot.width>0,steer=measured&&Array.isArray(foot.dir)&&foot.dir[1]<0?Math.hypot(...foot.dir):0;
 const up=steer?[foot.dir[0]/steer,foot.dir[1]/steer]:[Math.sin(r),-Math.cos(r)],base=[at.x,at.y],w=measured?clamp(foot.width,.25,2.5):stemWidthCm(item,a);
 const along=length=>[base[0]+up[0]*length,base[1]+up[1]*length];
 const g=vesselGeometry(vessel),o=g.openings[seat.opening]||g.openings[0];
 if(!item.aboveVessel){
  // Only a mouth at least 9 cm across shows what stands in it; into a neck or a narrow cylinder the stem just disappears.
  if(!o||o.radius[0]<INTERIOR_MIN_RX)return null;
  // Off a support, the lower part of the opening is the front lip seen from above: the stem goes behind it.
  return {kind:'interior',base,tip:along(15),radius:Math.max(1.2,2*w),opening:o.index??seat.opening,floor:isKenzan(vessel)?null:o.center[1]+o.radius[1]*.5};
 }
 if(isDetachedPiece(item))return null;
 if(!o)return null;
 // Over the opening (or above its centre line) a stem is seen; below it, it is behind the front lip and wall.
 const over=([x,y])=>{
  if(y<=o.center[1])return true;
  const c=Math.cos(-(o.rotation||0)),sn=Math.sin(-(o.rotation||0)),px=x-o.center[0],py=y-o.center[1],u=(px*c-py*sn)/Math.max(.01,o.radius[0]),v=(px*sn+py*c)/Math.max(.01,o.radius[1]);
  return o.shape==='rect'?Math.abs(u)<=1&&Math.abs(v)<=1:u*u+v*v<=1;
 };
 const below=at.y-o.frontRimY;
 if(!(below>0)&&over(base))return null;
 // Walk up the stem until it is over the opening: that much of it is hidden (never less than the climb to the front rim).
 let hidden=0;while(hidden<12&&!over(along(hidden)))hidden+=.1;
 const length=Math.max(hidden,below>0?below/Math.max(.15,-up[1]):0)+.4;
 // A measured stem gets a cover that hugs it (its half-width plus the measurement's slack), so neighbouring leaves keep their edges.
 const radius=measured?Math.max(.55,w/2+Math.max(.3,foot.slack||0)):Math.max(1,w);
 return {kind:'rim',base,tip:along(length),radius,opening:o.index??seat.opening,centerY:o.center[1]};
}

/**
 * The vessel's footprint in stage cm, from the lower envelope measured in asset-metrics (scaled when the vessel's height
 * differs from the measured one): {cx, half (half-width), arc (depth of the foot ring's curve), bottom (lowest point)}.
 * Unmeasured vessels get a plain estimate from their width.
 */
export function vesselFoot(vessel){
 const g=vesselGeometry(vessel),bottom=g.top+g.height,measured=vesselMetrics[vessel?.id],foot=measured?.foot;
 if(foot){const k=g.height/Math.max(1e-6,measured.cm||g.height);return {cx:50+(foot.cx-50)*k,half:foot.half*k,arc:foot.arc*k,bottom:bottom-(86-foot.bottom)*k}}
 return {cx:50,half:g.width*.3,arc:Math.min(1.5,g.height*.06),bottom};
}

/** Stems are drawn before the vessel when they visibly enter it from above: on a kenzan, or where the insertion sits above the front rim. */
export function autoFront(vessel){
 if(isKenzan(vessel))return true;
 const g=vesselGeometry(vessel),primary=g.openings.find(o=>o.primary)||g.openings[0];
 return g.insertion[1]<(primary?.frontRimY??g.insertion[1])-.3;
}

/** Stage point (cm) of a stem's crown: the measured farthest petal or leaf, or its focus when unmeasured. */
export function crownPoint(item,a){
 const crown=specimenMetrics[a?.id]?.crown;
 return crown?sourceToStage(crown,item,a).map(v=>v*100):tipPoint(item,a);
}
/** Centimetres between the top of the stage and the highest of the photograph's top corners and its focus. */
export function headroom(item,a){
 return Math.min(...[[0,0],[1,0]].map(p=>sourceToStage(p,item,a)[1]*100),tipPoint(item,a)[1]);
}

/** 真·副·控 and the 添え fillers, as [degrees from vertical toward the arrangement's side, fraction of the main line]. */
export const SLOTS=[
 {key:'shin',slot:'shin',lean:12,frac:1},
 {key:'soe',slot:'soe',lean:42,frac:.75},
 {key:'hikae',slot:'hikae',lean:-65,frac:.56},
 {key:'jushi-1',slot:'jushi',lean:20,frac:.45},
 {key:'jushi-2',slot:'jushi',lean:-25,frac:.38},
 {key:'jushi-3',slot:'jushi',lean:35,frac:.3},
 {key:'jushi-4',slot:'jushi',lean:-15,frac:.25}
];
const slotByKey=Object.fromEntries(SLOTS.map(s=>[s.key,s]));
const lowSlot=key=>key==='hikae'||slotByKey[key]?.slot==='jushi'&&slotByKey[key].frac<=.3;
/** Main-line length (cm from the insertion to its focus): 1.5× the vessel's larger side for Japanese and modern vessels, 1.25× otherwise. */
export function shinCm(vessel){
 const g=vesselGeometry(vessel),M=Math.max(g.height,g.width),f=['japanese','modern'].includes(vessel?.style||'japanese')?1.5:1.25;
 return clamp(f*M,M,g.insertion[1]-8);
}
/** The two guide styles: upright (直立, SLOTS as listed) and slanting (傾斜), where the main line leans 48° and the second
 line stands at 14°. The accent and the fillers keep their angles. */
export const SLOT_STYLES=['upright','slanting'];
export const SLANTING=Object.freeze({shin:48,soe:14});
/** A slot's lean in degrees from vertical toward the arrangement's side, for a guide style. */
export const slotLean=(key,style='upright')=>style==='slanting'&&Object.hasOwn(SLANTING,key)?SLANTING[key]:(slotByKey[key]||SLOTS[0]).lean;
/**
 * A slot's ray from the insertion: its focus `target`, length `cm` (frac × the main line) and whether either the main line
 * (shinCm hit the stage top) or this ray (kept within x 3–97 and y ≥ 3 of the stage) had to be shortened (`clamped`).
 */
export function slotReach(vessel,key,side=1,style='upright'){
 const g=vesselGeometry(vessel),s=slotByKey[key]||SLOTS[0],ins=g.insertion,M=Math.max(g.height,g.width),f=['japanese','modern'].includes(vessel?.style||'japanese')?1.5:1.25;
 const t=slotLean(s.key,style)*side*Math.PI/180,dx=Math.sin(t),dy=-Math.cos(t);let r=s.frac*shinCm(vessel);
 const room=Math.min(dx>1e-9?(97-ins[0])/dx:dx<-1e-9?(3-ins[0])/dx:Infinity,dy<-1e-9?(3-ins[1])/dy:Infinity),fits=r<=room;if(!fits)r=Math.max(0,room);
 return {key:s.key,slot:s.slot,target:[ins[0]+r*dx,ins[1]+r*dy],cm:r,clamped:!fits||f*M>ins[1]-8};
}
/** Where a slot's focus sits for an arrangement leaning to `side` (1 right, −1 left), in the upright or slanting style. */
export function slotTarget(vessel,key,side=1,style='upright'){return slotReach(vessel,key,side,style).target}
/** A stable 32-bit FNV-1a hash, so an arrangement keeps its side between visits. */
export function hashId(id){let h=0x811c9dc5;for(const ch of String(id??''))h=Math.imul(h^ch.codePointAt(0),0x01000193)>>>0;return h}
/** Base x along the mouth: low stems spread out from the centre, tall ones gather toward it (studies use the same rule). */
export const baseOffset=(dx,rise)=>dx*clamp(1-rise/40,.15,.6);

/** Which slots are already taken, and the arrangement's side. A slot is taken by a focus or crown within 6 cm of it;
 the main line also by any stem rising ≥ .72 of it, the second line by a second tall stem, the accent by a low stem on the far side. */
export function slotState({items=[],vessel,id}={},assetById={},{style='upright',side:hand=0}={}){
 const v=typeof vessel==='string'?assetById[vessel]:vessel,g=vesselGeometry(v),ins=g.insertion,shin=shinCm(v);
 const points=items.map(item=>{const a=assetById[item.type];if(!a)return null;const tip=tipPoint(item,a),crown=crownPoint(item,a);return {tip,crown,rise:Math.max(ins[1]-tip[1],ins[1]-crown[1])}}).filter(Boolean);
 const lead=points.filter(p=>p.rise>=.5*shin).sort((p,q)=>q.rise-p.rise)[0];
 // A side chosen in the guide (±1) wins; otherwise the side of the tallest stem, or the arrangement id's hash.
 const side=hand===1||hand===-1?hand:lead&&Math.abs(lead.tip[0]-ins[0])>.5?Math.sign(lead.tip[0]-ins[0]):(hashId(id)&1?1:-1);
 const near=t=>points.some(p=>distance(p.tip,t)<=6||distance(p.crown,t)<=6);
 const taken={};
 for(const s of SLOTS)taken[s.key]=near(slotTarget(v,s.key,side,style));
 taken.shin||=points.some(p=>p.rise>=.72*shin);
 taken.soe||=points.filter(p=>p.rise>=.5*shin).length>=2;
 taken.hikae||=points.some(p=>ins[1]-p.tip[1]<.6*shin&&(p.tip[0]-ins[0])*side<-.2*shin);
 return {side,shin,taken,points};
}

/**
 * Plan where a new stem goes: its slot (by botanical role), base, focus target, front/behind, size and solved fit.
 * line → the highest free of 真/副; focal → 真 on an empty canvas, else 控 or a low 添え; others → the lowest free 添え.
 * When the stem would touch the top of the stage (< 3 cm), the target is lowered first (photographed branches get cut),
 * then leaned up to 35° toward its side, then the size is reduced toward the 0.8× floor. A crown that would leave the stage
 * at the side swings back toward the centre (up to 45°), is mirrored if it still curves away, then shrinks. `template` supplies item fields (h, flip, trim…) for the new stem.
 * `guide` ({style, side}) is the ikebana guide's choice while it is shown: slanting leans and a fixed side, so the stem lands on the drawn rays.
 */
export function planSlot(state,a,assetById={},template={},guide={}){
 const v=typeof state.vessel==='string'?assetById[state.vessel]:state.vessel,g=vesselGeometry(v),ins=g.insertion;
 const style=guide.style==='slanting'?'slanting':'upright',{side,taken,points}=slotState({...state,vessel:v},assetById,{style,side:guide.side});
 const roles=rolesOf(a),jushiHigh=['jushi-1','jushi-2','jushi-3','jushi-4'],jushiLow=[...jushiHigh].reverse(),empty=!state.items?.length;
 const orderFor=role=>role==='line'?['shin','soe']:role==='focal'?[...(empty?['shin']:[]),'hikae','jushi-3','jushi-4','jushi-2','jushi-1']:jushiLow;
 const order=[...new Set([...roles.flatMap(orderFor),...jushiHigh])];
 let key=order.find(k=>!taken[k]);
 if(!key){
  const spare=SLOTS.filter(s=>s.key!=='shin').map(s=>({key:s.key,gap:Math.min(Infinity,...points.map(p=>distance(p.tip,slotTarget(v,s.key,side,style))))}));
  key=spare.sort((p,q)=>q.gap-p.gap)[0].key;
 }
 const s=slotByKey[key],front=autoFront(v)||(roles.some(r=>r==='focal'||r==='secondary')&&lowSlot(key));
 const slotPoint=slotTarget(v,key,side,style),rise=ins[1]-slotPoint[1];
 const base=mouthBase(v,ins[0]+baseOffset(slotPoint[0]-ins[0],rise),.8,{front});
 const item={type:a.id,x:base[0],y:base[1],h:a.height,angle:0,trim:0,flip:false,length:a.stemLength||1,cropAnchorY:1,cropAnchorSourceY:null,...template};
 const leanSign=Math.sign(slotPoint[0]-base[0])||side*Math.sign(s.lean)||side;
 const solve=(h,target,flip=item.flip)=>{const fit=solveTo({...item,h,flip},a,base,target);return {h,flip,target,fit,top:headroom({...item,h,flip,...fit},a)}};
 let best=solve(item.h,slotPoint);
 const better=next=>{if(next.top>best.top+.01||next.top>=3&&best.top<3)best=next;return best.top>=3};
 if(best.top<3){
  // 1. Lower the focus (a photographed branch is then cut shorter), by at most 40% of the slot's rise.
  let target=slotPoint;
  for(let k=0;k<5&&best.top<3;k++){
   const drop=Math.min(3-best.top+.3,ins[1]-.6*rise-target[1]);if(drop<=.05)break;
   target=[target[0],target[1]+drop];better(solve(item.h,target));
  }
  // 2. Lean toward the slot's side in 5° steps.
  const lowered=best.target;
  for(let deg=5;deg<=35&&best.top<3;deg+=5){
   const t=lowered,r=deg*leanSign*Math.PI/180,dx=t[0]-base[0],dy=t[1]-base[1];
   better(solve(item.h,[base[0]+dx*Math.cos(r)-dy*Math.sin(r),base[1]+dx*Math.sin(r)+dy*Math.cos(r)]));
  }
  // 3. Reduce the size toward the natural floor.
  const [minH]=sizeBounds(a);
  for(let h=Math.round(item.h*.95*10)/10;h>=minH-1e-9&&best.top<3;h=Math.round(h*.95*10)/10)better(solve(h,best.target));
  if(best.top<3&&item.h>minH)better(solve(minH,best.target));
 }
 // A stem whose crown would leave the stage at the side swings back toward the centre (keeping its headroom), then shrinks.
 const sideOut=p=>{const x=crownPoint({...item,h:p.h,flip:p.flip,...p.fit},a)[0];return Math.max(0,3-x,x-97)};
 if(sideOut(best)>0){
  const toward=crownPoint({...item,h:best.h,flip:best.flip,...best.fit},a)[0]<50?1:-1,start=best;
  const roomy=p=>sideOut(p)<sideOut(best)-.01&&(p.top>=3||p.top>=start.top-.01);
  for(let deg=5;deg<=45&&sideOut(best)>0;deg+=5){
   const t=start.target,r=deg*toward*Math.PI/180,dx=t[0]-base[0],dy=t[1]-base[1],next=solve(start.h,[base[0]+dx*Math.cos(r)-dy*Math.sin(r),base[1]+dx*Math.sin(r)+dy*Math.cos(r)]);
   if(roomy(next))best=next;
  }
  // A photograph that curves away (a bent plume) may be mirrored so it curves back over the vessel.
  if(sideOut(best)>0){const next=solve(start.h,start.target,!item.flip);if(roomy(next))best=next}
  const [minH]=sizeBounds(a);
  for(let h=Math.round(best.h*.95*10)/10;h>=minH-1e-9&&sideOut(best)>0;h=Math.round(h*.95*10)/10){const next=solve(h,best.target,best.flip);if(roomy(next))best=next}
 }
 return {slot:s.slot,key,side,base,target:best.target,front,h:best.h,flip:best.flip,fit:best.fit,headroom:Math.round(best.top*10)/10};
}

/**
 * Where a new stem enters an arrangement's item list (paint order): a line or foliage goes in before the first flower of its
 * layer group (the stems drawn on the same side of the vessel, aboveVessel), so blooms stay in front of branches; anything
 * else, or a line in a group without flowers, goes last.
 */
export function insertIndex(items,item,assetById){
 const backdrop=a=>!!a&&['line','foliage'].includes(roleOf(a));
 if(backdrop(assetById[item.type])){const k=items.findIndex(i=>!!i.aboveVessel===!!item.aboveVessel&&assetById[i.type]&&!backdrop(assetById[i.type]));if(k>=0)return k}
 return items.length;
}

/** Whole stem height (cm) a material gets when it is the first stem in `vessel`: the size chip for library cards. */
export function defaultCm(a,vessel){
 const plan=planSlot({items:[],vessel,id:'default'},a,{[vessel.id]:vessel});
 return Math.round(itemCm({type:a.id,h:plan.h,flip:plan.flip,...plan.fit},a)*10)/10;
}

/** True-scale facts of an arrangement, measured to crowns: the tallest stem above the table, overall spread and vessel height. */
export function arrangementMetrics(s,assetById){
 const v=assetById[s.vessel],g=vesselGeometry(v),table=g.top+g.height,ins=g.insertion;
 const stems=(s.items||[]).map(item=>{const a=assetById[item.type];if(!a)return null;return {item,a,tip:tipPoint(item,a),crown:crownPoint(item,a)}}).filter(Boolean);
 const round=n=>Math.round(n*10)/10;
 const top=stems.reduce((best,p)=>!best||p.crown[1]<best.crown[1]?p:best,null);
 const xs=stems.flatMap(p=>[p.tip[0],p.crown[0]]);
 return {
  tallest:top?{type:top.a.id,family:top.a.family,cmAboveTable:round(table-top.crown[1]),ratio:Math.round((table-top.crown[1])/g.height*100)/100,lean:Math.round(Math.atan2(top.crown[0]-ins[0],ins[1]-top.crown[1])*180/Math.PI)}:null,
  spreadCm:xs.length?round(Math.max(...xs)-Math.min(...xs)):0,
  vesselCm:round(g.height)
 };
}

/** The slots the ikebana guide draws: 真 (main line), 副 (second line), 控 (accent). */
export const GUIDE_SLOTS=['shin','soe','hikae'];
/**
 * The guide's rays for a vessel, from the same slots planSlot fills: each {key, slot, from (the insertion), target, cm,
 * clamped} in stage cm. A stem planSlot puts in one of these slots has its focus on the ray's target.
 */
export function guideRays(vessel,{style='upright',side=1}={}){
 const from=[...vesselGeometry(vessel).insertion];
 return GUIDE_SLOTS.map(key=>({...slotReach(vessel,key,side===-1?-1:1,style==='slanting'?'slanting':'upright'),from}));
}
/**
 * How a stem reads against the guide: the ray whose target its focus or crown lies nearest (the points slotState counts),
 * `reach` from the insertion to that point in cm, `gap` to the target, `filled` within 3 cm, and `ratio`, the reach as a
 * multiple of the vessel's larger side (the length shinCm scales). Null without rays.
 */
export function guideReading(item,a,vessel,rays){
 if(!rays?.length||!a)return null;
 const g=vesselGeometry(vessel),M=Math.max(g.height,g.width),points=[tipPoint(item,a),crownPoint(item,a)];
 let best=null;
 for(const ray of rays)for(const p of points){const gap=distance(p,ray.target);if(!best||gap<best.gap-1e-9)best={ray,gap,p}}
 const reach=distance(best.ray.from,best.p);
 return {key:best.ray.key,slot:best.ray.slot,gap:Math.round(best.gap*10)/10,reach:Math.round(reach),target:Math.round(best.ray.cm),filled:best.gap<=3,ratio:Math.round(reach/Math.max(1,M)*10)/10};
}
/**
 * Put a stem on a guide ray: its focus aimed at `target`. A stem standing in the vessel keeps its base; one outside it gets
 * the base planSlot would give that target. solveTo (photographs are cut, drawn stems grow within their species' length),
 * or reach for a stem with cuts so the cuts keep their place. Returns the item fields and `miss`, the focus error in cm.
 */
export function fitToSlot(item,a,vessel,target){
 const ins=vesselGeometry(vessel).insertion;
 const base=seatState(item,a,vessel).seated?[item.x,item.y]:mouthBase(vessel,ins[0]+baseOffset(target[0]-ins[0],ins[1]-target[1]),.8,{front:!!item.aboveVessel});
 let fit;
 if(item.cuts?.length||item.segments?.length||item.localCuts?.length)fit={...reach(item,a,base,target),cropAnchorSourceY:null};
 else{const {miss:_,...solved}=solveTo(item,a,base,target);fit=solved}
 return {...fit,miss:Math.round(distance(tipPoint({...item,...fit},a),target)*10)/10};
}

/** A detached cut piece lies where it was dropped on purpose: vessel switches leave it alone, and the seat banner does not count it. */
export const isDetachedPiece=item=>(item?.localCuts||[]).some(entry=>entry?.part==='detached');

/**
 * Where a detached cut piece was cut from its stem, as source UV ([u, v], v unwarped), or null for anything else.
 * It is the anchor of the piece's last local cut: the detached part's own cut end, or, when the piece was cut again and
 * kept its main part, the root point that cut started from (the same cut end). Anchors are normalised to the full sprite
 * frame of their cut: a v2 cut stores that frame, a v1 cut follows the current length and trim (as its mask does).
 */
export function cutEndSource(item,a){
 if(!a||!isDetachedPiece(item))return null;
 const entry=item.localCuts.at(-1),anchor=entry?.anchor;
 if(!Array.isArray(anchor)||anchor.length!==2||!anchor.every(Number.isFinite))return null;
 const g=dimensions(item,a),stored=entry.cut?.v===2?entry.cut.frame:null;
 const frame=stored&&[stored.split,stored.length,stored.end].every(Number.isFinite)&&stored.length>0?stored:{split:g.split,length:g.length,end:g.end};
 const height=warpY(frame.end,frame.split,frame.length);
 return [clamp(anchor[0],0,1),clamp(unwarpY(clamp(anchor[1],0,1)*height,frame.split,frame.length),0,1)];
}
/** Stage point (cm) of a detached piece's cut end, or null (see cutEndSource). */
export function cutEnd(item,a){
 const uv=cutEndSource(item,a);return uv?sourceToStage(uv,item,a).map(v=>v*100):null;
}
/** The point a stem stands on: a detached piece's cut end, otherwise its base (item.x, item.y). */
export const seatPoint=(item,a)=>cutEnd(item,a)||[item.x,item.y];
/** {x, y} that put the source point `uv` of `item` (with its current angle, size and flip) at the stage point `at` (cm). */
export function anchorAt(item,a,uv,at){
 const [px,py]=sourceToStage(uv,item,a).map(v=>v*100);
 return {x:item.x+at[0]-px,y:item.y+at[1]-py};
}
/**
 * The head of a detached piece: its opaque mask point farthest from the cut end, as source UV, or null. `mask` is the
 * sprite's alpha probe ({w, h, data}, the uncropped full frame at the item's current length and trim; see composeSpecimen).
 */
export function pieceHead(item,a,mask,{alpha=48}={}){
 const end=cutEndSource(item,a),{w,h,data}=mask||{};
 if(!end||!(w>0&&h>0)||!data||data.length<w*h)return null;
 const g=dimensions(item,a),ex=end[0]*g.ratio,ey=warpY(end[1],g.split,g.length);
 let best=-1,hx=0,hy=0;
 // A tiny piece may be faint in the probe: fall back to the crop's own threshold (12) before giving up.
 for(const limit of alpha>12?[alpha,12]:[alpha]){
  for(let y=0;y<h;y++){
   const py=(y+.5)/h*g.height,dy=(py-ey)**2;
   for(let x=0;x<w;x++){
    if(data[y*w+x]<=limit)continue;
    const d=((x+.5)/w*g.ratio-ex)**2+dy;if(d>best){best=d;hx=(x+.5)/w;hy=py}
   }
  }
  if(best>=0)break;
 }
 return best<0?null:[hx,clamp(unwarpY(hy,g.split,g.length),0,1)];
}
/**
 * Into the vessel for a detached piece: turn it about its cut end E so that E→head points at where the head is now, then
 * move it so E stands at mouthBase. Rigid (no length or trim change), so a head farther from the mouth than the piece is long
 * cannot stay put: `miss` (cm) says by how much it moved; `gap` is how far E ended from the mouth (stage clamps).
 * Returns {x, y, angle, miss, gap}, or null without a cut end. `head` is source UV (pieceHead); without it the piece only moves.
 */
export function reseatPiece(item,a,vessel,head=null){
 const endUV=cutEndSource(item,a);if(!endUV)return null;
 const E=sourceToStage(endUV,item,a).map(v=>v*100),M=mouthBase(vessel,E[0],.55,{front:!!item.aboveVessel});
 let angle=item.angle||0;
 const H=head?sourceToStage(head,item,a).map(v=>v*100):null;
 if(H&&distance(H,M)>.5&&distance(H,E)>.5){
  const turn=(Math.atan2(H[1]-M[1],H[0]-M[0])-Math.atan2(H[1]-E[1],H[0]-E[0]))*180/Math.PI;
  angle=Math.round((((angle+turn+540)%360)-180)*10)/10;
 }
 const turned={...item,angle},at=anchorAt(turned,a,endUV,M),placed={...turned,x:clamp(at.x,5,95),y:clamp(at.y,15,95)};
 const E2=sourceToStage(endUV,placed,a).map(v=>v*100),H2=H?sourceToStage(head,placed,a).map(v=>v*100):null;
 const round=n=>Math.round(n*10)/10;
 return {x:placed.x,y:placed.y,angle,miss:round(H?distance(H2,H):distance(E2,E)),gap:round(distance(E2,M))};
}
/**
 * Duplicate of a seated stem, as a lower companion: its base 1.5 cm to `side` (1 right, −1 left) along the mouth (besideBase), its focus
 * turned 12° toward `toward` about the base and aimed 20% lower. When that leaves the two flowers closer than `minGap` cm
 * (default: ¾ of a flower head's width, 4–9 cm; 5 cm for photographed stems), the companion turns further and drops lower,
 * up to 36° and 40% (never past 75° from upright, then toward the other side instead), so it stays visible. Photographed stems are cut (solveTo), drawn stems shortened; a stem with cuts only
 * turns, since a new length or trim would shift them. Returns the item fields to set.
 */
export function companionFit(item,a,vessel,{side=1,toward=side,minGap=null}={}){
 const base=besideBase(vessel,item.x,side,{front:!!item.aboveVessel});
 const tip=tipPoint(item,a),dx=tip[0]-item.x,dy=tip[1]-item.y,placed={...item,x:base[0],y:base[1]};
 const cut=item.cuts?.length||item.segments?.length||item.localCuts?.length,g=dimensions(item,a);
 const gap=Number.isFinite(minGap)?minGap:drawsStem(a)?clamp(.75*item.h*Math.min(g.ratio,1),4,9):5;
 // Beyond 75° from upright (or the original's own lean, if it leans further) a companion would lie down: those steps are skipped.
 const limit=Math.max(75,Math.abs(item.angle||0));
 // When turning toward the emptier side cannot part them before that limit, the other side is tried (the farther result wins).
 let first=null,best=null;
 for(const sign of [Math.sign(toward||1),-Math.sign(toward||1)]){
  for(const [deg,scale] of [[12,.8],[18,.75],[24,.7],[30,.65],[36,.6]]){
   const r=deg*sign*Math.PI/180,target=[base[0]+scale*(dx*Math.cos(r)-dy*Math.sin(r)),base[1]+scale*(dx*Math.sin(r)+dy*Math.cos(r))];
   let fit;
   if(cut)fit={x:base[0],y:base[1],angle:aim(placed,a,base,target)};
   else{const {miss,...solved}=solveTo(placed,a,base,target);fit=solved}
   const apart=distance(tipPoint({...item,...fit},a),tip);first||={fit,apart};
   if(Math.abs(fit.angle)>limit)continue;
   if(!best||apart>best.apart+.5)best={fit,apart};
   if(apart>=gap)break;
  }
  if(best&&best.apart>=gap)break;
 }
 return (best||first).fit;
}
/**
 * companionFit that does not land on a stem already there: when the copy's focus would sit within 1 cm of one of `others`
 * (focus points, e.g. an earlier copy when a copy is duplicated again), its base goes to the other side instead, if that clears.
 */
export function companionClear(item,a,vessel,{side=1,toward=side,others=[]}={}){
 const clear=fit=>{const t=tipPoint({...item,...fit},a);return !others.some(p=>Math.hypot(p[0]-t[0],p[1]-t[1])<1)};
 const fit=companionFit(item,a,vessel,{side,toward});if(clear(fit))return fit;
 const alt=companionFit(item,a,vessel,{side:-side,toward});return clear(alt)?alt:fit;
}
/**
 * Vessel switch, pure core. Every stem moves with the insertion point as before; stems that stood in the old vessel are
 * re-based at the same relative place in the new opening and re-aimed at their moved focus. Only when that misses by more
 * than 3 cm (and the stem has no cuts that a new length or trim would shift) are length and trim solved as well.
 */
export function remapSeated(items,oldV,newV,assetById){
 const from=vesselGeometry(oldV),to=vesselGeometry(newV),dx=to.insertion[0]-from.insertion[0],dy=to.insertion[1]-from.insertion[1];
 const relative=(g,item,state)=>{const o=g.openings[state.opening]||g.openings.find(p=>p.primary)||g.openings[0],cx=o&&(o.primary||g.openings.length===1)?g.insertion[0]:o?.center[0]??g.insertion[0],rx=Math.max(.5,o?.radius[0]??2);return clamp((item.x-cx)/rx,-1,1)};
 const newOpening=to.openings.find(o=>o.primary)||to.openings[0],newRx=newOpening?.radius[0]??2;
 return items.map(item=>{
  const a=assetById[item.type],moved={...item,x:clamp(item.x+dx,5,95),y:clamp(item.y+dy,15,95)};
  if(!a||isDetachedPiece(item))return moved;
  const before=seatState(item,a,oldV);if(!before.seated)return moved;
  const old=tipPoint(item,a),focus=[old[0]+dx,old[1]+dy];
  const base=mouthBase(newV,to.insertion[0]+relative(from,item,before)*newRx*.55,.8,{front:!!item.aboveVessel});
  const placed={...item,x:base[0],y:base[1]};placed.angle=aim(placed,a,base,focus);
  const cut=(item.cuts?.length||item.segments?.length||item.localCuts?.length);
  if(cut||distance(tipPoint(placed,a),focus)<=3)return placed;
  const {miss,...fit}=solveTo(placed,a,base,focus);
  return {...placed,...fit};
 });
}
