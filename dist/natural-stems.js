// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** Drawn stems below a flower-head photograph. Two renderers, chosen per item by `item.sv`:
 v1 (sv 1, items whose cuts were drawn on it) keeps the original routes exactly; v2 (sv 2) follows the species' stem
 diameter, starts tangent to the photographed stub, converges bundles into a vase neck and sways gently.
 Everything here is DOM-free; compositor.js does the canvas work. */
import {stemMmOf,habitOf} from './botany.js?v=hn2';

/** v1: plan restrained extensions from visible cut ends. Endpoints keep their order, so nearby stems never cross. Do not change: sv 1 sprites must stay pixel-identical. */
export function naturalStemRoutesV1(asset,roots,width,sourceHeight,bottom){
 const ordered=[...roots].sort((a,b)=>a.x-b.x),anchor=(asset.anchor??.5)*width;
 const cmPixels=sourceHeight/Math.max(1,asset.height);
 const cap=asset.group==='branch'?.85:asset.family==='sunflower'?.6:asset.family==='cosmos'?.24:.42;
 return ordered.map((root,index)=>{
  const x0=root.x,x1=anchor+(x0-anchor)*.48;
  const left=index?x0-ordered[index-1].x:Infinity,right=index<ordered.length-1?ordered[index+1].x-x0:Infinity;
  const room=Math.max(0,Math.min(left,right)),length=Math.max(0,bottom-root.y);
  const phase=Math.sin((x0/Math.max(1,width))*37+asset.height*1.71);
  const sway=phase*Math.min(width*.025,length*.048,room*.16);
  const dx=x1-x0;
  const p0=[x0,root.y],p1=[x0+dx*.13+sway,root.y+length*.28],p2=[x1-dx*.16+sway*.48,root.y+length*.72],p3=[x1,bottom];
  const sourceWidth=Math.max(.9,root.width||0),w0=Math.max(1.2,Math.min(sourceWidth,Math.min(root.startCm,cap)*cmPixels));
  const w1=Math.max(1,Math.min(root.endCm,cap*.86)*cmPixels);
  return {p0,p1,p2,p3,w0,w1,color:root.color};
 });
}

// ── v2 ──────────────────────────────────────────────────────────────────────────────────────────────
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const HEX=/^#[0-9a-f]{6}$/i;
/** The catalogue's width cap (cm) by group, used where the family has no measured stem diameter. */
const groupCapCm=asset=>asset.group==='branch'?.85:asset.family==='sunflower'?.6:asset.family==='cosmos'?.24:.42;
/** Supple herbaceous stems that bend more than most. */
const SUPPLE=new Set(['poppy','cosmos','anemone','ranunculus','tulip']);
/** Bundle ends gather within ±0.7 cm of the anchor, so a bundle fits a 1.4 cm neck. */
export const BUNDLE_HALF_CM=.7;
export const isWoody=asset=>{const habit=habitOf(asset);return habit?habit==='woody':asset?.group==='branch'};
/** 32-bit FNV-1a of a string with a murmur3 finaliser (so keys differing in one late character still spread), as a fraction in [0,1). */
const unitHash=text=>{
 let h=0x811c9dc5;for(const ch of String(text))h=Math.imul(h^ch.codePointAt(0),0x01000193);
 h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;
 return (h>>>0)/4294967296;
};
/**
 * Signed sway as a share of the drawn length, measured side to side across the whole S: woody 2%, supple 5–8%,
 * everything else 3–7%. Seeded by asset id and stem index only, so split halves and duplicates of one stem keep the same curve.
 */
export function swayShare(asset,stemIndex){
 const [low,high]=isWoody(asset)?[.02,.02]:SUPPLE.has(asset?.family)?[.05,.08]:[.03,.07];
 const key=`${asset?.id??''}#${stemIndex}`;
 return (low+(high-low)*unitHash(key))*(unitHash(`${key}~`)<.5?-1:1);
}
/** Gentle S: zero at both ends with zero slope, so the stem leaves its stub tangentially. Peaks ±1 near t=⅓ and ⅔. */
export const swayProfile=t=>{const s=clamp(t,0,1);return Math.sin(2*Math.PI*s*s*(3-2*s))};

/**
 * The stems v2 looks for: the catalogue `stems` [u,startCm,endCm,colour] patched by the optional `stemFix` list
 * (scale.js applyRealScale copies it from real-scale.js). Entry i patches stem i ({u,dir,color,mm}: search position,
 * stub direction, catalogue colour, and a width in mm where the cut end cannot be measured); entries past the end add
 * cut ends the catalogue misses ({u,startCm,endCm,color}). v1 never sees the fixes.
 */
export function stemSpecs(asset){
 const fix=Array.isArray(asset?.stemFix)?asset.stemFix:[];
 const patch=entry=>{
  if(!entry||typeof entry!=='object')return {};
  const out={};
  if(Number.isFinite(entry.u))out.u=clamp(entry.u,0,1);
  if(typeof entry.color==='string'&&HEX.test(entry.color))out.color=entry.color;
  if(Array.isArray(entry.dir)&&entry.dir.length===2&&entry.dir.every(Number.isFinite)&&entry.dir[1]>0)out.dir=entry.dir;
  if(Number.isFinite(entry.mm)&&entry.mm>0)out.mm=clamp(entry.mm,.5,30);
  return out;
 };
 const list=(asset?.stems||[]).map(([u,startCm,endCm,color],index)=>({u,startCm,endCm,color,index,...patch(fix[index])}));
 for(let index=list.length;index<fix.length;index++){
  const extra=fix[index],own=patch(extra);
  if(Number.isFinite(own.u)&&own.color&&Number.isFinite(extra.startCm)&&Number.isFinite(extra.endCm))list.push({startCm:extra.startCm,endCm:extra.endCm,index,...own});
 }
 return list;
}

const hex2=n=>Math.round(clamp(n,0,255)).toString(16).padStart(2,'0');
/** dx/dy of the least-squares line through rows' centres ({y,cx}); 0 when they share one row. */
const leastSquaresSlope=rows=>{
 const n=rows.length,my=rows.reduce((s,r)=>s+r.y,0)/n,mx=rows.reduce((s,r)=>s+r.cx,0)/n;
 let sxy=0,syy=0;for(const r of rows){sxy+=(r.y-my)*(r.cx-mx);syy+=(r.y-my)**2}
 return syy>0?sxy/syy:0;
};
const median=values=>{const s=[...values].sort((a,b)=>a-b),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
/** Expected drawn-stem width at the cut (cm): the species' diameter, else the catalogue width under its cap. */
export const expectedStemCm=(asset,spec)=>{const mm=stemMmOf(asset);return mm?mm[0]/10:Math.min(spec?.startCm??.42,groupCapCm(asset))};
/** A photographed stub wider than this many expected widths has merged with a leaf collar, sheath or florets. */
export const MERGED_RATIO=2.2;
/**
 * Find each stem's photographed cut end on an RGBA probe (v2).
 * `probe` {data,width,height} is the photograph drawn uniformly at `scale` probe px per source px; `bottom` is the
 * source row of the photograph's lower edge and `cmPixels` source px per cm. Like v1 it searches upward from the
 * lower edge (up to `band` of the height) for the opaque run nearest each stem's u. It then follows the stub up:
 * past a slanted or rounded cut face, along the stub's steady width (its plateau), and stops where a leaf joins.
 * The plateau gives the stub's width, its direction (least squares over the lowest ~4%) and its median core colour
 * (lowest ~12%). A stub much wider than expected keeps the catalogue u and the expected width (`merged`).
 * Returns source-px roots {x,y,tip,width,startCm,endCm,color,index,dir:[dx,dy],stub:'#rrggbb'|null,merged}; `tip` is the
 * lowest row of the stub's cut face, below `y` when the cut is slanted or rounded.
 */
export function stemRoots(probe,asset,{bottom,scale,cmPixels,band=.38,opaque=48}){
 const {data,width:pw,height:ph}=probe,alpha=(x,y)=>data[(y*pw+x)*4+3];
 const last=Math.min(ph-1,Math.floor(bottom*scale)-1),first=Math.max(0,Math.floor(last-ph*band));
 const radius=Math.max(2,Math.round(pw*.045)),dirRows=Math.max(3,Math.round(ph*.04)),colourRows=Math.max(dirRows,Math.round(ph*.12));
 const runAt=(x,y)=>{let left=x,right=x;while(left>0&&alpha(left-1,y)>opaque)left--;while(right<pw-1&&alpha(right+1,y)>opaque)right++;return [left,right]};
 const nearestRun=(y,cx,reach)=>{
  let best=-1,distance=Infinity;
  for(let x=Math.max(0,Math.round(cx-reach));x<=Math.min(pw-1,Math.round(cx+reach));x++)if(alpha(x,y)>opaque&&Math.abs(x-cx)<distance){best=x;distance=Math.abs(x-cx)}
  return best<0?null:runAt(best,y);
 };
 /** Every opaque run of row y that reaches into [cx−reach, cx+reach]. */
 const runsNear=(y,cx,reach)=>{
  const runs=[];
  for(let x=Math.max(0,Math.round(cx-reach));x<=Math.min(pw-1,Math.round(cx+reach));x++)if(alpha(x,y)>opaque){const run=runAt(x,y);runs.push(run);x=run[1]}
  return runs;
 };
 const roots=[];
 for(const spec of stemSpecs(asset)){
  if(!Number.isFinite(spec.u))continue;
  const target=clamp(Math.round(spec.u*pw-.5),0,pw-1);
  let found=null;
  for(let y=last;y>=first&&!found;y--){const run=nearestRun(y,target,radius);if(run)found={y,run}}
  if(!found)continue;
  // Expected stem width in probe px.
  const expected=Math.max(1,(spec.mm?spec.mm/10:expectedStemCm(asset,spec))*cmPixels*scale),limit=expected*MERGED_RATIO;
  const seedWidth=found.run[1]-found.run[0]+1;
  // A fixed width (stemFix mm) means the cut end cannot be measured: treat it like a merged run of that width.
  let merged=seedWidth>Math.max(3,limit)||!!spec.mm,rows=[];
  if(!merged){
   // Follow the run nearest the previous centre; it may grow quickly across a cut face but never jumps sideways. Where
   // the run forks (a pedicel or twig that touched the stub parting from it) keep to the branch on the stub's own line.
   rows.push({y:found.y,cx:(found.run[0]+found.run[1])/2,left:found.run[0],right:found.run[1],w:seedWidth});
   for(let y=found.y-1;y>=0&&found.y-y<=colourRows*1.5;y--){
    const prev=rows.at(-1),runs=runsNear(y,prev.cx,Math.max(2,prev.w*.75));if(!runs.length)break;
    let run=runs[0];
    if(runs.length>1){
     const line=rows.filter(r=>found.y-r.y<dirRows),slope=line.length>=4?leastSquaresSlope(line):0,at=rows[0].cx+slope*(rows[0].y-y);
     run=runs.reduce((best,r)=>Math.abs((r[0]+r[1])/2-at)<Math.abs((best[0]+best[1])/2-at)?r:best);
    }
    const w=run[1]-run[0]+1,c=(run[0]+run[1])/2;
    if(w>Math.max(prev.w*1.5+2,prev.w+3,expected*1.3)||w>expected*3+3||Math.abs(c-prev.cx)>Math.max(1.5,prev.w*.6,(w-prev.w)/2+1))break;
    rows.push({y,cx:c,left:run[0],right:run[1],w});
   }
   // Plateau: the lowest k rows near the cut whose widths agree within ~12%, are not a bulge (wider than the k rows
   // above them) and go on steadily for at least half the direction band; failing that, the longest such stretch. A
   // later stretch never wins over a lower one it is notably wider than (that is a leaf merging, not the stem). This
   // skips a slanted or rounded cut face (still widening) and a pedicel or leaf briefly touching the stub. From there
   // the stem keeps that steady width and stops where the run widens by more than ~15% (a petal or leaf joining);
   // where only one edge moves out it keeps to the steady edge.
   const k=Math.min(rows.length,Math.max(3,Math.min(8,Math.round(expected*.5)))),near=Math.max(dirRows*2,k*4),lasting=Math.max(k,Math.round(dirRows/2));
   const steadyFor=(i,m)=>{let n=0;while(i+n<rows.length&&rows[i+n].w<=m*1.15+1.5&&rows[i+n].w>=m*.6-1)n++;return n};
   let best=null;
   for(let i=0;i<Math.min(near,rows.length-k+1);i++){
    const ws=rows.slice(i,i+k).map(r=>r.w),m=median(ws);
    if(!ws.every(w=>Math.abs(w-m)<=Math.max(1,m*.12)))continue;
    // A bulge (something touching the stub) is wider than the stub just above it.
    const above=rows.slice(i+k,i+2*k).map(r=>r.w);
    if(above.length>=Math.min(k,3)&&m>median(above)*1.15+1)continue;
    const n=steadyFor(i,m);
    if(best&&m>best.m*1.1)continue;
    if(!best||n>best.n)best={i,m,n};
    if(n>=lasting)break;
   }
   const from=best?.i??0,steady=best?.m??median(rows.slice(0,k).map(r=>r.w));
   const plateau=[rows[from]];
   for(let i=from+1;i<rows.length;i++){
    const r=rows[i],prev=plateau.at(-1);if(r.w>steady*1.15+1.5||r.w<steady*.6-1)break;
    const cx=r.w<=steady*1.08?r.cx:Math.abs(r.left-prev.left)<=Math.abs(r.right-prev.right)?r.left+(steady-1)/2:r.right-(steady-1)/2;
    plateau.push({...r,cx});
   }
   rows=plateau.map(r=>({...r,w:Math.min(r.w,steady),left:r.cx-(Math.min(r.w,steady)-1)/2,right:r.cx+(Math.min(r.w,steady)-1)/2}));
   if(steady>Math.max(3,limit))merged=true;
  }
  // A merged run keeps the catalogue u inside it, the expected width, a straight start and the catalogue colour.
  if(merged)rows=[{y:found.y,cx:spec.mm&&seedWidth<=expected?(found.run[0]+found.run[1])/2:clamp(target,found.run[0]+expected/2,found.run[1]-expected/2),w:expected}];
  const root=rows[0];
  // Least-squares x = a + b·y over the plateau's lowest rows gives the stub's direction (slope capped at 45°).
  let dir=[0,1];
  const fit=rows.filter(r=>root.y-r.y<dirRows);
  if(!merged&&fit.length>=4){const slope=clamp(leastSquaresSlope(fit),-1,1),norm=Math.hypot(slope,1);dir=[slope/norm,1/norm]}
  if(spec.dir){const norm=Math.hypot(...spec.dir);dir=[spec.dir[0]/norm,spec.dir[1]/norm]}
  const steered=!!spec.dir;
  // A slanted stub's rows cut it obliquely: its diameter is the row width × cos θ.
  const full=merged?expected:median(rows.map(r=>r.w))*dir[1];
  // Median colour of each row's central half, opaque pixels only.
  const reds=[],greens=[],blues=[];
  if(!merged)for(const r of rows.filter(r=>root.y-r.y<=colourRows)){
   const half=(r.right-r.left+1)/4,from=Math.round(r.cx-half),to=Math.round(r.cx+half);
   for(let x=Math.max(0,from);x<=Math.min(pw-1,Math.max(from,to));x++){const i=(r.y*pw+x)*4;if(data[i+3]>=200){reds.push(data[i]);greens.push(data[i+1]);blues.push(data[i+2])}}
  }
  const stub=reds.length>=4?`#${hex2(median(reds))}${hex2(median(greens))}${hex2(median(blues))}`:null;
  // `tip`: the lowest row of the stub's cut face (a slanted or rounded cut below the root), which the drawn stem replaces.
  roots.push({x:(root.cx+.5)/scale,y:Math.min(bottom,(root.y+.5)/scale),tip:Math.min(bottom,(found.y+.5)/scale),width:full/scale,startCm:spec.startCm,endCm:spec.endCm,color:spec.color,index:spec.index,dir,stub,merged,...(spec.mm?{fixed:true}:{}),...(steered?{steered:true}:{})});
 }
 return roots;
}

/** One route's centreline, sampled: [{x,y,w,t}] from the cut end (t=0) to the vase end (t=1). */
export function stemPath(route,samples=64){
 const {p0,p1,p2,p3,w0,w1,sway=0}=route,points=[];
 for(let i=0;i<=samples;i++){
  const t=i/samples,u=1-t,b0=u*u*u,b1=3*u*u*t,b2=3*u*t*t,b3=t*t*t;
  points.push({x:b0*p0[0]+b1*p1[0]+b2*p2[0]+b3*p3[0]+sway*swayProfile(t),y:b0*p0[1]+b1*p1[1]+b2*p2[1]+b3*p3[1],w:w0+(w1-w0)*t,t});
 }
 return points;
}
/** x of a sampled centreline at height y (the samples are monotonic in y), or NaN outside it. */
function xAt(points,y){
 if(y<points[0].y||y>points.at(-1).y)return NaN;
 let lo=0,hi=points.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].y<=y)lo=mid;else hi=mid}
 const a=points[lo],b=points[hi],span=b.y-a.y;return span>0?a.x+(b.x-a.x)*(y-a.y)/span:a.x;
}
/** Smallest horizontal gap between two neighbouring centrelines at equal heights (Infinity when they never overlap). */
export function routeGap(left,right,samples=64){
 const a=stemPath(left,samples),b=stemPath(right,samples),top=Math.max(a[0].y,b[0].y),bottom=Math.min(a.at(-1).y,b.at(-1).y);
 if(!(bottom>top))return Infinity;
 let gap=Infinity;
 for(let i=0;i<=48;i++){const y=top+(bottom-top)*i/48,d=xAt(b,y)-xAt(a,y);if(Number.isFinite(d))gap=Math.min(gap,d)}
 return gap;
}
/** The route without sway and with a straight-down start of the same reach: the reference the safety checks compare against. */
const plain=route=>({...route,sway:0,p1:[route.p0[0],route.p0[1]+Math.hypot(route.p1[0]-route.p0[0],route.p1[1]-route.p0[1])]});
/**
 * Shrink sway and the tangent handle until no stem leaves the sprite and no neighbours touch where their plain routes
 * do not. Ends (p0, p3) and widths never move, so the bundle spread and order are kept exactly.
 */
function settle(routes,width){
 // A shorter handle keeps its direction, so the stem still leaves the stub tangentially.
 const shrink=(route,f)=>{route.sway*=f;route.p1=[route.p0[0]+(route.p1[0]-route.p0[0])*f,route.p0[1]+(route.p1[1]-route.p0[1])*f]};
 const inside=route=>stemPath(route,48).every(p=>p.x-p.w/2>=-.5&&p.x+p.w/2<=width+.5);
 for(const route of routes){
  const plainInside=inside(plain(route));
  for(let n=0;n<8&&plainInside&&!inside(route);n++)shrink(route,.6);
 }
 for(let n=0;n<10;n++){
  let worst=-1;
  for(let i=1;i<routes.length;i++){
   const reference=routeGap(plain(routes[i-1]),plain(routes[i]));
   if(!(reference>0)||reference===Infinity)continue;
   if(routeGap(routes[i-1],routes[i])<=reference*.3){worst=i;break}
  }
  if(worst<0)break;
  shrink(routes[worst-1],.6);shrink(routes[worst],.6);
 }
 return routes;
}
/**
 * v2 routes. Each stem starts as wide as its photographed stub, so the join has no step; a stub implausibly wide for
 * the species (more than MERGED_RATIO × the expected width from botany.js stemMm, else the catalogue width under its
 * cap) has merged with a collar or sheath and gets the expected width instead. Toward the vase herbs get very slightly
 * finer and woody stems slightly thicker, never swelling past the species' base diameter. Bundles converge uniformly so
 * their ends span at most 1.4 cm in strict order; each stem leaves its stub along the stub's own direction and sways
 * in a gentle S seeded by asset id and stem index.
 * Returns {p0,p1,p2,p3,w0,w1,color,stub,sway,index,steered?} in source px, sorted left to right (`steered`: the start
 * direction comes from stemFix rather than the stub).
 */
export function naturalStemRoutes(asset,roots,width,sourceHeight,bottom){
 const ordered=[...roots].sort((a,b)=>a.x-b.x),anchor=(asset.anchor??.5)*width;
 const cmPixels=sourceHeight/Math.max(1,asset.height),mm=stemMmOf(asset),woody=isWoody(asset);
 const spread=Math.max(...ordered.map(root=>Math.abs(root.x-anchor)),1e-9),gather=Math.min(.48,BUNDLE_HALF_CM*cmPixels/spread);
 const routes=ordered.map((root,index)=>{
  const x0=root.x,x1=anchor+(x0-anchor)*gather,length=Math.max(0,bottom-root.y);
  const left=index?x0-ordered[index-1].x:Infinity,right=index<ordered.length-1?ordered[index+1].x-x0:Infinity;
  const room=Math.max(0,Math.min(left,right));
  // Width at the cut: the photographed stub's own width, unless it is implausibly wide for the species (merged
  // with a collar or sheath), in which case the expected width. Toward the vase: herbs very slightly finer, woody stems
  // slightly thicker, never past the species' base diameter (or the plausible limit) — so no stem ever swells.
  const expected=expectedStemCm(asset,root)*cmPixels,limit=expected*MERGED_RATIO,sourceWidth=Math.max(.9,root.width||0);
  const w0=Math.max(1.2,root.fixed?sourceWidth:root.merged||sourceWidth>limit?expected:sourceWidth);
  const w1=Math.max(1,woody?Math.min(w0*1.12,Math.max(w0,mm?mm[1]/10*cmPixels:limit)):w0*.96);
  const norm=Array.isArray(root.dir)?Math.hypot(...root.dir):0,[dx,dy]=norm>0&&root.dir[1]>0?[root.dir[0]/norm,root.dir[1]/norm]:[0,1];
  const handle=Math.min(length*.25,Math.abs(dx)>1e-6?room*.3/Math.abs(dx):Infinity);
  const p0=[x0,root.y],p1=[x0+dx*handle,root.y+dy*handle],p2=[x1-(x1-x0)*.16,root.y+length*.72],p3=[x1,bottom];
  // swayProfile peaks at ±1, so half the share is the peak offset.
  const share=swayShare(asset,root.index??index),sway=Math.sign(share)*Math.min(Math.abs(share)*length/2,room*.16);
  return {p0,p1,p2,p3,w0,w1,color:root.color,stub:root.stub||null,sway,index:root.index??index,...(root.steered?{steered:true}:{})};
 });
 return settle(routes,width);
}
