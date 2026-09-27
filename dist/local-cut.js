/**
 * A finite, material-aware cut. The cutter finds the one connected piece of
 * the selected specimen under the middle of a stroke, opens a short kerf there,
 * and separates only the part that no longer reaches its lower (root) end.
 *
 * Cut records contain two small, run-length encoded masks in the coordinate
 * space of the *uncropped* composed specimen. They are plain JSON, so an edit
 * survives undo, local storage and export at a different resolution.
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

/**
 * Pure raster analysis, useful for deterministic tests. `alpha` is w*h RGBA
 * alpha bytes; `a` and `b` are pixel coordinates within that raster.
 * Returns {ok, cut, stats} or {ok:false, reason}.
 */
export function splitAlphaMask(alpha,w,h,a,b,options={}){
 if(!alpha||alpha.length!==w*h||!finitePoint(a)||!finitePoint(b)||w<1||h<1||w*h>1600000)return {ok:false,reason:'invalid'};
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
 if(length<5)return {ok:false,reason:'short'};
 const threshold=clamp(options.alphaThreshold??20,1,254),radius=clamp(options.kerfRadius??1.35,.75,4);
 const occupied=new Uint8Array(w*h);
 for(let i=0;i<occupied.length;i++)occupied[i]=alpha[i]>=threshold?1:0;

 // Sample the *finite* user stroke. If it crosses multiple leaves, use only
 // the local run nearest its middle, rather than extending a line across them.
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
 runs.sort((left,right)=>{
  const score=group=>Math.abs((group[0].t+group.at(-1).t)/2-.5)-Math.min(.06,(group.at(-1).t-group[0].t)*.08);
  return score(left)-score(right);
 });
 const localRun=runs[0],seed=localRun[Math.floor(localRun.length/2)].index;
 const edge=Math.min(2.5/length,.08),t0=clamp(localRun[0].t-edge,0,1),t1=clamp(localRun.at(-1).t+edge,0,1);
 const ax=a[0]+t0*dx,ay=a[1]+t0*dy,bx=a[0]+t1*dx,by=a[1]+t1*dy;
 if(Math.hypot(bx-ax,by-ay)<3)return {ok:false,reason:'short'};

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
 const root=components[0],minArea=Math.max(7,Math.round(originalArea*.001));
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
 * Browser wrapper. `sprite` may be a cropped composeSpecimen canvas; its crop
 * metadata restores the uncut coordinate frame. `a`/`b` are pixel points in
 * that *full* frame, not CSS/stage coordinates.
 */
export function analyzeLocalCut(sprite,{a,b},options={}){
 if(!sprite||!finitePoint(a)||!finitePoint(b))return {ok:false,reason:'invalid'};
 const crop=sprite.crop||{x:0,y:0,width:sprite.width,height:sprite.height,fullWidth:sprite.width,fullHeight:sprite.height};
 const fullW=crop.fullWidth,fullH=crop.fullHeight;
 if(!Number.isFinite(fullW)||!Number.isFinite(fullH)||fullW<1||fullH<1)return {ok:false,reason:'invalid'};
 const maxSide=clamp(options.maxSide??704,160,1024),scale=Math.min(1,maxSide/Math.max(fullW,fullH),Math.sqrt(600000/(fullW*fullH)));
 const w=Math.max(1,Math.round(fullW*scale)),h=Math.max(1,Math.round(fullH*scale)),canvas=createCanvas(w,h),ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)return {ok:false,reason:'canvas'};
 try{
  ctx.drawImage(sprite,crop.x*w/fullW,crop.y*h/fullH,crop.width*w/fullW,crop.height*h/fullH);
  const rgba=ctx.getImageData(0,0,w,h).data,alpha=new Uint8Array(w*h);
  for(let p=0;p<alpha.length;p++)alpha[p]=rgba[p*4+3];
  const rootPoint=finitePoint(options.rootPoint)?[options.rootPoint[0]*w/fullW,options.rootPoint[1]*h/fullH]:null;
  return splitAlphaMask(alpha,w,h,[a[0]*w/fullW,a[1]*h/fullH],[b[0]*w/fullW,b[1]*h/fullH],rootPoint?{...options,rootPoint}:options);
 }finally{canvas.width=canvas.height=0}
}

function maskCanvas(encoded,w,h,makeCanvas){
 const mask=decodeCutMask(encoded,w*h);if(!mask)return null;
 const canvas=makeCanvas(w,h),ctx=canvas.getContext('2d');if(!ctx){canvas.width=canvas.height=0;return null}
 const image=ctx.createImageData(w,h);
 for(let p=0;p<mask.length;p++)if(mask[p]){const q=p*4;image.data[q]=image.data[q+1]=image.data[q+2]=image.data[q+3]=255}
 ctx.putImageData(image,0,0);return canvas;
}

/** Apply one saved cut to a full composed canvas, before its alpha crop. */
export function applyLocalCut(ctx,out,cut,part,makeCanvas=createCanvas){
 if(!cut||cut.v!==1||!Number.isInteger(cut.w)||!Number.isInteger(cut.h)||cut.w<1||cut.h<1||cut.w*cut.h>1600000||!['main','detached'].includes(part))return false;
 const detached=maskCanvas(cut.d,cut.w,cut.h,makeCanvas),kerf=maskCanvas(cut.k,cut.w,cut.h,makeCanvas);
 if(!detached||!kerf){if(detached)detached.width=detached.height=0;if(kerf)kerf.width=kerf.height=0;return false}
 try{
  ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.globalCompositeOperation=part==='detached'?'destination-in':'destination-out';ctx.drawImage(detached,0,0,out.width,out.height);
  ctx.globalCompositeOperation='destination-out';ctx.drawImage(kerf,0,0,out.width,out.height);ctx.restore();return true;
 }finally{detached.width=detached.height=0;kerf.width=kerf.height=0}
}
