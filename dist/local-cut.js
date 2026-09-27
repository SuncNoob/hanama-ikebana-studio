/**
 * A finite, material-aware cut. The cutter finds the one connected piece of
 * the selected specimen under the stroke, opens a short kerf there,
 * and separates only the part that no longer reaches its lower (root) end.
 *
 * Cut records contain two small, run-length encoded masks in the coordinate
 * space of the *uncropped* composed specimen. Version 2 also records the stem
 * stretch at cut time, so later length changes can warp the masks in exactly
 * the same two bands as the photograph.
 */

const createCanvas=(w,h)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas};
const finitePoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));

function encodeVarint(bytes,n){
 do{let byte=n&127;n=Math.floor(n/128);if(n)byte|=128;bytes.push(byte)}while(n);
}
function bytesToBase64(bytes){
 let result='';for(let offset=0;offset<bytes.length;offset+=8192)result+=String.fromCharCode(...bytes.slice(offset,offset+8192));
 return btoa(result);
}
function base64ToBytes(value){const raw=atob(value),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes}

/** Encode a binary row-major mask as alternating zero/one run lengths. */
export function encodeCutMask(mask){
 const bytes=[];let bit=0,run=0;
 for(let i=0;i<mask.length;i++){
  const next=mask[i]?1:0;
  if(next===bit)run++;
  else{encodeVarint(bytes,run);bit=next;run=1}
 }
 encodeVarint(bytes,run);return bytesToBase64(bytes);
}

/** Return null for malformed records instead of letting corrupt local drafts hang. */
export function decodeCutMask(encoded,size){
 if(typeof encoded!=='string'||encoded.length>200000||!Number.isInteger(size)||size<1||size>1600000)return null;
 let bytes;try{bytes=base64ToBytes(encoded)}catch{return null}
 const mask=new Uint8Array(size);let cursor=0,bit=0,run=0,shift=0;
 for(let i=0;i<bytes.length;i++){
  const byte=bytes[i];run+=(byte&127)*2**shift;
  if(byte&128){shift+=7;if(shift>28)return null;continue}
  if(cursor+run>size)return null;
  if(bit)mask.fill(1,cursor,cursor+run);
  cursor+=run;bit^=1;run=0;shift=0;
 }
 return shift===0&&cursor===size?mask:null;
}

const indexAt=(x,y,w,h)=>x>=0&&x<w&&y>=0&&y<h?y*w+x:-1;
function near8(index,w,h,visit){
 const x=index%w,y=(index-x)/w;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  if(dx===0&&dy===0)continue;
  const q=indexAt(x+dx,y+dy,w,h);if(q>=0)visit(q);
 }
}
function distanceSquared(px,py,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay,denom=dx*dx+dy*dy,t=denom?clamp(((px-ax)*dx+(py-ay)*dy)/denom,0,1):0;
 const x=px-(ax+t*dx),y=py-(ay+t*dy);return x*x+y*y;
}

function lowAlphaSeam(alpha,wood,w,yEnd,middle){
 const lo=clamp(Math.round(middle)-90,0,w-1),hi=clamp(Math.round(middle)+90,0,w-1),count=hi-lo+1;
 let next=new Float32Array(count).fill(Infinity),current=new Float32Array(count),links=new Int16Array(Math.max(1,yEnd)*count);
 next[clamp(Math.round(middle)-lo,0,count-1)]=0;
 for(let y=yEnd-1;y>=0;y--){
  current.fill(Infinity);
  for(let x=0;x<count;x++)for(let step=-2;step<=2;step++){
   const nextX=x+step;if(nextX<0||nextX>=count||next[nextX]===Infinity)continue;
   const p=y*w+lo+x,opacity=alpha[p],penalty=(opacity>=20?8:opacity/20*8)+(wood[p]?14:0)+Math.abs(lo+x-middle)*.014;
   const score=next[nextX]+penalty;
   if(score<current[x]){current[x]=score;links[y*count+x]=nextX}
  }
  [next,current]=[current,next];
 }
 let best=0;for(let x=1;x<count;x++)if(next[x]<next[best])best=x;
 const seam=new Int16Array(yEnd);
 for(let y=0;y<yEnd;y++){seam[y]=lo+best;best=links[y*count+best]}
 return seam;
}

function stemGroupsAtRow(wood,detached,w,h,y){
 const row=new Uint16Array(w),detRow=new Uint16Array(w),lo=clamp(y-3,0,h-1),hi=clamp(y+3,0,h-1);
 for(let py=lo;py<=hi;py++)for(let x=0;x<w;x++)if(wood[py*w+x]){row[x]++;if(detached[py*w+x])detRow[x]++}
 const groups=[];let pixels=[],last=-10;
 const finish=()=>{if(pixels.length>=4){let total=0,off=0;for(const x of pixels){total+=x;off+=detRow[x]}groups.push({x:total/pixels.length,off,weight:pixels.length})}pixels=[]};
 for(let x=0;x<w;x++)if(row[x]>=2){if(x-last>8)finish();pixels.push(x);last=x}
 finish();return groups;
}

/**
 * Pure raster analysis, useful for deterministic tests. `alpha` is w*h RGBA
 * alpha bytes; `a` and `b` are pixel coordinates within that raster.
 * Returns {ok, cut, stats} or {ok:false, reason}.
 */
export function splitAlphaMask(alpha,w,h,a,b,options={}){
 if(!alpha||alpha.length!==w*h||!finitePoint(a)||!finitePoint(b)||w<1||h<1||w*h>1600000)return {ok:false,reason:'invalid'};
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
 if(length<1.5)return {ok:false,reason:'short'};
 const threshold=clamp(options.alphaThreshold??20,1,254),radius=clamp(options.kerfRadius??1.35,.75,4);
 const occupied=new Uint8Array(w*h);
 for(let i=0;i<occupied.length;i++)occupied[i]=alpha[i]>=threshold?1:0;

 // Sample the *finite* user stroke. The editor chooses the first piece touched:
 // drawing from a fine branch toward the trunk must not cut the trunk instead.
 // Other callers can retain the middle-run behavior by omitting preferStart.
 const steps=Math.max(1,Math.ceil(length*2)),hits=[];
 for(let step=0;step<=steps;step++){
  const t=step/steps,x=Math.round(a[0]+t*dx),y=Math.round(a[1]+t*dy),index=indexAt(x,y,w,h);
  if(index>=0&&occupied[index])hits.push({step,t,index});
 }
 if(!hits.length)return {ok:false,reason:'miss'};
 const runs=[];let run=[];
 for(const hit of hits){
  if(run.length&&hit.step-run.at(-1).step>3){runs.push(run);run=[]}
  run.push(hit);
 }
 if(run.length)runs.push(run);
 if(!options.preferStart)runs.sort((left,right)=>{
  const score=group=>Math.abs((group[0].t+group.at(-1).t)/2-.5)-Math.min(.06,(group.at(-1).t-group[0].t)*.08);
  return score(left)-score(right);
 });
 const localRun=runs[0],seed=localRun[Math.floor(localRun.length/2)].index;
 const edge=2.5/length;
 let t0=clamp(localRun[0].t-edge,0,1),t1=clamp(localRun.at(-1).t+edge,0,1);
 // Stop the little blade before another independent run on the same gesture.
 for(const other of runs)if(other!==localRun){
  if(other.at(-1).t<localRun[0].t)t0=Math.max(t0,(other.at(-1).t+localRun[0].t)/2);
  else if(other[0].t>localRun.at(-1).t)t1=Math.min(t1,(other[0].t+localRun.at(-1).t)/2);
 }
 const ax=a[0]+t0*dx,ay=a[1]+t0*dy,bx=a[0]+t1*dx,by=a[1]+t1*dy;

 // Identify the original connected botanical part. Other disconnected
 // petals/stems in the same source photograph are always left untouched.
 const target=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0,bottom=-1,bottomIndex=seed,originalArea=0;
 queue[tail++]=seed;target[seed]=1;
 while(head<tail){
  const p=queue[head++],y=Math.floor(p/w);originalArea++;if(y>bottom){bottom=y;bottomIndex=p}
  near8(p,w,h,q=>{if(occupied[q]&&!target[q]){target[q]=1;queue[tail++]=q}});
 }

 // Remove the narrow blade trace only where it meets this connected part.
 // The transparent space along the gesture is not turned into a giant stripe.
 const rawKerf=new Uint8Array(w*h),minX=clamp(Math.floor(Math.min(ax,bx)-radius-2),0,w-1),maxX=clamp(Math.ceil(Math.max(ax,bx)+radius+2),0,w-1),minY=clamp(Math.floor(Math.min(ay,by)-radius-2),0,h-1),maxY=clamp(Math.ceil(Math.max(ay,by)+radius+2),0,h-1);
 let cutPixels=0;
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
  const p=y*w+x;if(target[p]&&distanceSquared(x,y,ax,ay,bx,by)<=radius*radius){rawKerf[p]=1;cutPixels++}
 }
 if(!cutPixels)return {ok:false,reason:'miss'};

 // Flood fill the remaining part. The lower end is the rooted/main piece;
 // a component separated next to the blade becomes the movable offcut.
 const rootPoint=finitePoint(options.rootPoint)?options.rootPoint:null;
 const labels=new Int32Array(w*h),components=[];let componentId=0;
 for(let p=0;p<target.length;p++){
  if(!target[p]||rawKerf[p]||labels[p])continue;
  const record={id:++componentId,area:0,bottom:-1,touches:0,rootDistance:Infinity,rootIndex:p,cutDistance:Infinity,cutIndex:p};head=0;tail=0;queue[tail++]=p;labels[p]=componentId;
  while(head<tail){
   const q=queue[head++],x=q%w,y=Math.floor(q/w);record.area++;record.bottom=Math.max(record.bottom,y);
   if(rootPoint){const distance=(x-rootPoint[0])**2+(y-rootPoint[1])**2;if(distance<record.rootDistance){record.rootDistance=distance;record.rootIndex=q}}
   near8(q,w,h,n=>{if(rawKerf[n]){record.touches++;const distance=(x-(ax+bx)/2)**2+(y-(ay+by)/2)**2;if(distance<record.cutDistance){record.cutDistance=distance;record.cutIndex=q}}else if(target[n]&&!labels[n]){labels[n]=componentId;queue[tail++]=n}});
  }
  components.push(record);
 }
 if(components.length<2)return {ok:false,reason:'not-separated'};
 if(rootPoint)components.sort((left,right)=>left.rootDistance-right.rootDistance||right.area-left.area);
 else components.sort((left,right)=>right.bottom-left.bottom||right.area-left.area);
 // A twig tip is allowed to be tiny even when attached to a large specimen.
 // The kerf-adjacency check below rejects detached background specks.
 const root=components[0],minArea=3;
 const detached=components.filter(c=>c.id!==root.id&&c.touches&&c.area>=minArea).sort((left,right)=>right.area-left.area)[0];
 if(!detached||root.area<minArea)return {ok:false,reason:'not-separated'};

 const offcut=new Uint8Array(w*h),kerf=new Uint8Array(w*h);
 for(let p=0;p<labels.length;p++)if(labels[p]===detached.id)offcut[p]=1;
 // Give the detached selection one transparent-pixel margin so its original
 // antialiasing follows it. Never claim visible pixels from another branch.
 for(let p=0;p<labels.length;p++)if(labels[p]===detached.id)near8(p,w,h,q=>{if(!occupied[q]&&!rawKerf[q])offcut[q]=1});
 for(let p=0;p<rawKerf.length;p++)if(rawKerf[p]){
  kerf[p]=1;near8(p,w,h,q=>{if(!occupied[q])kerf[q]=1});
 }
 const mainAnchor=rootPoint?[clamp(rootPoint[0]/w,0,1),clamp(rootPoint[1]/h,0,1)]:[bottomIndex%w/w,Math.floor(bottomIndex/w)/h];
 const offcutAnchor=[detached.cutIndex%w/w,Math.floor(detached.cutIndex/w)/h];
 return {ok:true,cut:{v:1,w,h,d:encodeCutMask(offcut),k:encodeCutMask(kerf)},anchors:{main:mainAnchor,detached:offcutAnchor},stats:{originalArea,rootArea:root.area,detachedArea:detached.area,cutPixels,localStroke:[t0,t1],components:components.length}};
}

/**
 * A woody branch can remain alpha-connected through its overlapping leaves or
 * needles after the wood is cut. In that case use its brown branch core as a
 * temporary structure, then give each visible pixel to the nearest core.
 * The result is still the same two editable raster layers, with no asset-specific
 * hand-drawn masks and no change to cuts that already separate normally.
 */
export function splitBotanicalMask(rgba,w,h,a,b,options={}){
 if(!rgba||rgba.length!==w*h*4||w*h>1600000)return {ok:false,reason:'invalid'};
 const alpha=new Uint8Array(w*h);
 for(let p=0;p<alpha.length;p++)alpha[p]=rgba[p*4+3];
 const direct=splitAlphaMask(alpha,w,h,a,b,options);
 if(direct.ok||direct.reason!=='not-separated'||!(options.woodyFallback||options.reddishStemFallback))return direct;

 const wood=new Uint8Array(w*h);let woodArea=0,visibleArea=0,top=h,bottom=-1,woodBottom=-1;
 for(let p=0;p<wood.length;p++){
  const q=p*4,opacity=rgba[q+3],y=Math.floor(p/w);
  if(opacity>=20){visibleArea++;top=Math.min(top,y);bottom=Math.max(bottom,y)}
  const r=rgba[q],g=rgba[q+1],blue=rgba[q+2];
  const stem=options.reddishStemFallback
   ? r-g>=27&&r-blue>=20&&g<135&&blue<145&&r<190
   : r-g>=10&&r-blue>=20&&g>=blue-6&&g>=25&&r<=g*1.9;
  if(opacity>=64&&stem){wood[p]=255;woodArea++;woodBottom=Math.max(woodBottom,y)}
 }
 // A usable branch core reaches the rooted end and is a meaningful fraction
 // of this specimen. This keeps warm flower petals from becoming false stems.
 if(woodArea<48||woodArea<visibleArea*.012||woodArea>visibleArea*.65||woodBottom<bottom-Math.max(8,(bottom-top)*.18))return direct;
 const core=splitAlphaMask(wood,w,h,a,b,options);
 if(!core.ok||core.stats.originalArea<Math.max(48,woodArea*.25))return direct;
 const coreDetached=decodeCutMask(core.cut.d,w*h),kerf=decodeCutMask(core.cut.k,w*h);
 if(!coreDetached||!kerf)return direct;

 // First make a rough nearest-wood assignment. A fan of overlapping foliage
 // may cross that boundary, so the assignment is refined at the cluster level.
 const owner=new Uint8Array(w*h),queue=new Int32Array(w*h);let tail=0,head=0;
 for(let p=0;p<wood.length;p++)if(wood[p]&&!kerf[p]){owner[p]=coreDetached[p]?2:1;queue[tail++]=p}
 while(head<tail){
  const p=queue[head++];near8(p,w,h,n=>{
   if(!owner[n]&&alpha[n]>=20&&!kerf[n]){owner[n]=owner[p];queue[tail++]=n}
  });
 }
 if(!options.reddishStemFallback){
 // Seven-pixel erosion leaves the dense centres of leaves or needle fans.
 // Keep each centre together before restoring its fine edges. An integral
 // image makes this linear rather than checking 49 neighbours per pixel.
 const stride=w+1,summed=new Uint32Array(stride*(h+1)),dense=new Uint8Array(w*h);
 for(let y=0;y<h;y++){
  let row=0;
  for(let x=0;x<w;x++){
   const p=y*w+x;row+=alpha[p]>=20&&!kerf[p]?1:0;
   summed[(y+1)*stride+x+1]=summed[y*stride+x+1]+row;
  }
 }
 for(let y=3;y<h-3;y++)for(let x=3;x<w-3;x++){
  const left=x-3,right=x+4,top=y-3,bottom=y+4;
  if(summed[bottom*stride+right]-summed[top*stride+right]-summed[bottom*stride+left]+summed[top*stride+left]===49)dense[y*w+x]=1;
 }
 const clustered=new Uint8Array(w*h),seen=new Uint8Array(w*h);
 for(let p=0;p<dense.length;p++){
  if(!dense[p]||seen[p])continue;
  head=0;tail=0;queue[tail++]=p;seen[p]=1;
  let woodCount=0,offWood=0,rootVotes=0,offVotes=0;
  while(head<tail){
   const q=queue[head++];
   if(wood[q]){woodCount++;if(coreDetached[q])offWood++}
   if(owner[q]===2)offVotes++;else if(owner[q]===1)rootVotes++;
   near8(q,w,h,n=>{if(dense[n]&&!seen[n]){seen[n]=1;queue[tail++]=n}});
  }
  const mixed=woodCount>0&&Math.min(offWood,woodCount-offWood)>woodCount*.12;
  if(tail>=100&&!mixed){
   const side=woodCount?(offWood>woodCount/2?2:1):(offVotes>rootVotes?2:1);
   for(let i=0;i<tail;i++)clustered[queue[i]]=side;
  }
 }
 owner.fill(0);head=0;tail=0;
 for(let p=0;p<owner.length;p++)if(clustered[p]){owner[p]=clustered[p];queue[tail++]=p}
 for(let p=0;p<wood.length;p++)if(wood[p]&&!kerf[p]&&!owner[p]){owner[p]=coreDetached[p]?2:1;queue[tail++]=p}
 while(head<tail){
  const p=queue[head++];near8(p,w,h,n=>{
   if(!owner[n]&&alpha[n]>=20&&!kerf[n]){owner[n]=owner[p];queue[tail++]=n}
  });
 }
 }
 // Sedum's flower heads overlap in the photograph even where their stems are
 // distinct. Extend a severed main stem into its own flower lobe along a seam
 // that prefers the transparent gaps between buds; tiny side twigs keep the
 // ordinary local result and do not steal an entire head.
 if(options.reddishStemFallback&&core.stats.detachedArea>=Math.max(120,woodArea*.018)){
  const photoBottom=options.photoHeightRatio?Math.min(bottom,h*options.photoHeightRatio):bottom;
  const canopyY=clamp(Math.round(top+(photoBottom-top)*.55),1,h-1),groups=stemGroupsAtRow(wood,coreDetached,w,h,canopyY);
  const detachedGroup=groups.filter(group=>group.off>=2).sort((a,b)=>b.off-a.off)[0];
  if(detachedGroup){
   const neighbours=groups.filter(group=>group!==detachedGroup&&group.off<2&&group.weight>=8);
   const left=neighbours.filter(group=>group.x<detachedGroup.x).sort((a,b)=>b.x-a.x)[0];
   const right=neighbours.filter(group=>group.x>detachedGroup.x).sort((a,b)=>a.x-b.x)[0];
   if(left||right){
    const leftSeam=left?lowAlphaSeam(alpha,wood,w,canopyY,(left.x+detachedGroup.x)/2):null;
    const rightSeam=right?lowAlphaSeam(alpha,wood,w,canopyY,(right.x+detachedGroup.x)/2):null;
    for(let y=0;y<canopyY;y++)for(let x=0;x<w;x++){
     const p=y*w+x;if(alpha[p]<20||kerf[p])continue;
     owner[p]=(!leftSeam||x>leftSeam[y])&&(!rightSeam||x<rightSeam[y])?2:1;
    }
   }
  }
 }
 // Very faint antialiasing can extend several pixels past a needle. Give it
 // the same owner as the visible needle instead of leaving a ghost in the root.
 head=0;tail=0;
 for(let p=0;p<owner.length;p++)if(owner[p]&&alpha[p]>=20)queue[tail++]=p;
 while(head<tail){
  const p=queue[head++];near8(p,w,h,n=>{
   if(!owner[n]&&alpha[n]>0&&!kerf[n]){owner[n]=owner[p];queue[tail++]=n}
  });
 }
 const detached=new Uint8Array(w*h),cleanKerf=kerf.slice();let detachedArea=0,rootArea=0;
 for(let p=0;p<owner.length;p++){
  if(owner[p]===2&&alpha[p]>0){detached[p]=1;detachedArea++}
  else if(owner[p]===1&&alpha[p]>0)rootArea++;
  else if(alpha[p]>0&&alpha[p]<20)cleanKerf[p]=1;
 }
 if(detachedArea<3||rootArea<3)return direct;
 return {ok:true,cut:{v:1,w,h,d:encodeCutMask(detached),k:encodeCutMask(cleanKerf)},anchors:core.anchors,stats:{...core.stats,rootArea,detachedArea,method:options.reddishStemFallback?'reddish-stem-core':'woody-core'}};
}

/**
 * Browser wrapper. `sprite` may be a cropped composeSpecimen canvas; its crop
 * metadata restores the uncut coordinate frame. `a`/`b` are pixel points in
 * that *full* frame, not CSS/stage coordinates.
 */
export function analyzeLocalCut(sprite,{a,b},options={}){
 if(!sprite||!finitePoint(a)||!finitePoint(b))return {ok:false,reason:'invalid'};
 const crop=sprite.crop||{x:0,y:0,width:sprite.width,height:sprite.height,fullWidth:sprite.width,fullHeight:sprite.height};
 const fullW=crop.fullWidth,fullH=crop.fullHeight;
 if(!Number.isFinite(fullW)||!Number.isFinite(fullH)||fullW<1||fullH<1)return {ok:false,reason:'invalid'};
 const maxSide=clamp(options.maxSide??1024,160,1024),scale=Math.min(1,maxSide/Math.max(fullW,fullH),Math.sqrt(800000/(fullW*fullH)));
 const w=Math.max(1,Math.round(fullW*scale)),h=Math.max(1,Math.round(fullH*scale)),canvas=createCanvas(w,h),ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)return {ok:false,reason:'canvas'};
 try{
  ctx.drawImage(sprite,crop.x*w/fullW,crop.y*h/fullH,crop.width*w/fullW,crop.height*h/fullH);
  const rgba=ctx.getImageData(0,0,w,h).data;
  const rootPoint=finitePoint(options.rootPoint)?[options.rootPoint[0]*w/fullW,options.rootPoint[1]*h/fullH]:null;
  return splitBotanicalMask(rgba,w,h,[a[0]*w/fullW,a[1]*h/fullH],[b[0]*w/fullW,b[1]*h/fullH],rootPoint?{...options,rootPoint}:options);
 }finally{canvas.width=canvas.height=0}
}

function maskCanvas(encoded,w,h,makeCanvas){
 const mask=decodeCutMask(encoded,w*h);if(!mask)return null;
 const canvas=makeCanvas(w,h),ctx=canvas.getContext('2d');if(!ctx){canvas.width=canvas.height=0;return null}
 const image=ctx.createImageData(w,h);
 for(let p=0;p<mask.length;p++)if(mask[p]){const q=p*4;image.data[q]=image.data[q+1]=image.data[q+2]=image.data[q+3]=255}
 ctx.putImageData(image,0,0);return canvas;
}

/** Source and destination bands for a saved cut mask after a stem-length edit. */
export function cutMaskBands(cut,frame,outWidth,outHeight){
 if(cut?.v!==2||!cut.frame||!frame||!Number.isFinite(frame.height)||frame.height<=0)return [[0,0,cut.w,cut.h,0,0,outWidth,outHeight]];
 const old=cut.frame,sourceHeight=old.end<=old.split?old.end:old.split+(old.end-old.split)*old.length;
 if(!(sourceHeight>0)||old.split!==frame.split)return [[0,0,cut.w,cut.h,0,0,outWidth,outHeight]];
 const oldScale=cut.h/sourceHeight,newScale=outHeight/frame.height,bands=[];
 const upperEnd=Math.min(frame.end,frame.split,old.end);
 if(upperEnd>0)bands.push([0,0,cut.w,upperEnd*oldScale,0,0,outWidth,upperEnd*newScale]);
 const lowerEnd=Math.min(frame.end,old.end);
 if(lowerEnd>frame.split){
  const oldTop=frame.split*oldScale,newTop=frame.split*newScale;
  bands.push([0,oldTop,cut.w,(lowerEnd-frame.split)*old.length*oldScale,0,newTop,outWidth,(lowerEnd-frame.split)*frame.length*newScale]);
 }
 return bands;
}

/** Apply one saved cut to a full composed canvas, before its alpha crop. */
export function applyLocalCut(ctx,out,cut,part,makeCanvas=createCanvas,frame=null){
 if(!cut||![1,2].includes(cut.v)||!Number.isInteger(cut.w)||!Number.isInteger(cut.h)||cut.w<1||cut.h<1||cut.w*cut.h>1600000||!['main','detached'].includes(part))return false;
 const detached=maskCanvas(cut.d,cut.w,cut.h,makeCanvas),kerf=maskCanvas(cut.k,cut.w,cut.h,makeCanvas);
 if(!detached||!kerf){if(detached)detached.width=detached.height=0;if(kerf)kerf.width=kerf.height=0;return false}
 if(cut.v===1){
  try{
   ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.globalCompositeOperation=part==='detached'?'destination-in':'destination-out';ctx.drawImage(detached,0,0,out.width,out.height);
   ctx.globalCompositeOperation='destination-out';ctx.drawImage(kerf,0,0,out.width,out.height);ctx.restore();return true;
  }finally{detached.width=detached.height=0;kerf.width=kerf.height=0}
 }
 const aligned=makeCanvas(out.width,out.height),alignedContext=aligned.getContext('2d');
 if(!alignedContext){detached.width=detached.height=0;kerf.width=kerf.height=0;aligned.width=aligned.height=0;return false}
 try{
  ctx.save();alignedContext.imageSmoothingEnabled=true;alignedContext.imageSmoothingQuality='high';
  const bands=cutMaskBands(cut,frame,out.width,out.height);
  for(const band of bands)alignedContext.drawImage(detached,...band);
  ctx.globalCompositeOperation=part==='detached'?'destination-in':'destination-out';ctx.drawImage(aligned,0,0);
  alignedContext.clearRect(0,0,out.width,out.height);
  for(const band of bands)alignedContext.drawImage(kerf,...band);
  ctx.globalCompositeOperation='destination-out';ctx.drawImage(aligned,0,0);ctx.restore();return true;
 }finally{detached.width=detached.height=0;kerf.width=kerf.height=0;aligned.width=aligned.height=0}
}
