// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import {dimensions,vesselGeometry,warpY,flexExtent} from './geometry.js?v=restore1';
import {hasFlex,createFlexChain,flexGrid} from './flex.js?v=1';
import {applyLocalCut} from './local-cut.js?v=31';
import {naturalStemRoutesV1,naturalStemRoutes,stemRoots,stemPath} from './natural-stems.js?v=hn2';
import {seatClip,vesselFoot,seatState,stemWidthCm,isKenzan,isDetachedPiece,KENZAN,kenzanHolders,kenzanPins,onHolder} from './scale.js?v=hn3';
import {stemMmOf} from './botany.js?v=hn2';
import {lightOf,paintLight} from './ambience.js?v=hn3';
import {paintOrganicRoom,paintOrganicGround,isNightScene} from './organic-room.js?v=restore1';
const browserCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
/** Thrown when the browser refuses a 2D context (for example iOS's per-canvas memory cap). */
export class CanvasUnavailableError extends Error{constructor(width,height){super(`2D canvas ${width}×${height} is unavailable`);this.name='CanvasUnavailableError';this.width=width;this.height=height}}
const context2d=canvas=>{const ctx=canvas.getContext('2d');if(!ctx)throw new CanvasUnavailableError(canvas.width,canvas.height);return ctx};
const release=canvas=>{try{canvas.width=canvas.height=0}catch{}};
let filterWorks=null;
/** Whether the 2D canvas `filter` really works here (Safari ignores it). A pixel test, cached: reading the property back
 proves nothing, because an unsupported property simply keeps the string it was given. */
export function filterSupported(createCanvas=browserCanvas){
 if(filterWorks!==null)return filterWorks;
 let probe=null;
 try{probe=createCanvas(8,8)}catch{return false}
 try{const ctx=context2d(probe);ctx.filter='blur(2px)';ctx.fillStyle='#000';ctx.fillRect(4,4,1,1);ctx.filter='none';filterWorks=ctx.getImageData(2,4,1,1).data[3]>0}
 catch{filterWorks=false}finally{release(probe)}
 return filterWorks;
}
/** CSS saturate(s) (s<1) without ctx.filter: a grey copy of the pixels blended in 'saturation' mode at alpha 1−s keeps each
 pixel's luminosity and mixes it toward grey. Only antialiased edges change alpha, by at most (1−s)/4. */
function desaturate(canvas,s,createCanvas){
 if(!(s>=0&&s<1))return;
 const grey=createCanvas(canvas.width,canvas.height);
 try{
  const g=context2d(grey);g.drawImage(canvas,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#808080';g.fillRect(0,0,grey.width,grey.height);
  const ctx=context2d(canvas);ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='saturation';ctx.globalAlpha=1-s;ctx.drawImage(grey,0,0);ctx.restore();
 }finally{release(grey)}
}
/** CSS saturate(s) on RGBA pixel data in place (alpha unchanged). */
function saturatePixels(data,s){
 for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],b=data[i+2],l=.213*r+.715*g+.072*b;data[i]=l+(r-l)*s;data[i+1]=l+(g-l)*s;data[i+2]=l+(b-l)*s}
}
/** Draw `img` toned by saturate(tone): natively where canvas filters work, otherwise through desaturate() on a copy. */
function drawToned(ctx,img,tone,x,y,w,h,createCanvas){
 if(!(tone>=0&&tone<1)||filterSupported(createCanvas)){if(tone>=0&&tone<1)ctx.filter=`saturate(${tone})`;ctx.drawImage(img,x,y,w,h);ctx.filter='none';return}
 const t=ctx.getTransform?.(),sx=t?Math.hypot(t.a,t.b):1,sy=t?Math.hypot(t.c,t.d):1;
 const copy=createCanvas(Math.max(1,Math.min(4096,Math.ceil(Math.abs(w)*sx))),Math.max(1,Math.min(4096,Math.ceil(Math.abs(h)*sy))));
 try{const c=context2d(copy);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(img,0,0,copy.width,copy.height);desaturate(copy,tone,createCanvas);ctx.drawImage(copy,x,y,w,h)}finally{release(copy)}
}
/** Inspired by Compositor's staged downsampling: avoid collapsing fine leaves by >2× in one canvas draw. */
function drawReducedImage(ctx,img,width,height,createCanvas){
 let previous=img,owned=null,sourceWidth=img.naturalWidth||img.width,sourceHeight=img.naturalHeight||img.height;
 try{
  while(sourceWidth>width*2||sourceHeight>height*2){
   const nextWidth=Math.max(width,Math.ceil(sourceWidth/2)),nextHeight=Math.max(height,Math.ceil(sourceHeight/2));
   const next=createCanvas(nextWidth,nextHeight),step=context2d(next);step.imageSmoothingEnabled=true;step.imageSmoothingQuality='high';step.drawImage(previous,0,0,nextWidth,nextHeight);
   if(owned)release(owned);owned=next;previous=next;sourceWidth=nextWidth;sourceHeight=nextHeight;
  }
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(previous,0,0,width,height);
 }finally{if(owned)release(owned)}
}
/** Clip a rectangle to one side of a straight cut; a narrow kerf separates the two pieces. */
export function cutHalfPlane(width,height,a,b,side,gap=0){
 const dx=b[0]-a[0],dy=b[1]-a[1],span=Math.hypot(dx,dy);
 if(span<.001)return [];
 const signed=p=>side*(dx*(p[1]-a[1])-dy*(p[0]-a[0]))+gap*span;
 let polygon=[[0,0],[width,0],[width,height],[0,height]],output=[];
 for(let i=0;i<polygon.length;i++){
  const start=polygon[i],end=polygon[(i+1)%polygon.length],d0=signed(start),d1=signed(end),inside0=d0>=0,inside1=d1>=0;
  if(inside0!==inside1){const t=d0/(d0-d1);output.push([start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t])}
  if(inside1)output.push(end);
 }
 return output;
}
function applySegments(ctx,out,item,g,sourceHeight){
 for(const segment of item.segments||[]){
  const [[u0,v0],[u1,v1]]=segment.line,a=[u0*out.width,warpY(v0,g.split,g.length)*sourceHeight],b=[u1*out.width,warpY(v1,g.split,g.length)*sourceHeight];
  const remove=cutHalfPlane(out.width,out.height,a,b,-segment.side,Math.max(.5,out.width*.001));
  if(!remove.length)continue;
  ctx.save();ctx.globalCompositeOperation='destination-out';ctx.fillStyle='#000';ctx.beginPath();remove.forEach((p,index)=>ctx[index?'lineTo':'moveTo'](...p));ctx.closePath();ctx.fill();ctx.restore();
 }
}
/** Erase on the finished piece so a brush can also remove generated stems and tiny split-off fragments. */
function eraseDetails(ctx,out,item,g,sourceHeight,extraCut){
 ctx.save();ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='#000';ctx.fillStyle='#000';ctx.lineCap='round';ctx.lineJoin='round';
 for(const cut of [...(item.cuts||[]),...(extraCut?[extraCut]:[])]){
  if(!cut.points?.length)continue;
  const point=p=>[p[0]*out.width,warpY(p[1],g.split,g.length)*sourceHeight];
  ctx.beginPath();cut.points.forEach((p,index)=>ctx[index?'lineTo':'moveTo'](...point(p)));
  if(cut.kind==='lasso'){if(cut.points.length<3)continue;ctx.closePath();ctx.fill()}
  else {ctx.lineWidth=cut.radius*2*sourceHeight;if(cut.points.length===1){const [x,y]=point(cut.points[0]);ctx.arc(x,y,cut.radius*sourceHeight,0,Math.PI*2);ctx.fill()}else ctx.stroke()}
 }
 ctx.restore();
}
/**
 * Shared by the editor and exported artwork; cuts never mutate a source image.
 * `k` scales the source photograph (see spriteScale in scale.js). Cuts, drawn stems, probe and crop are all ratio-based,
 * so every consumer that reads `sprite.crop` works at any k. `sprite.mask` keeps the probe's alpha (w×h, uncropped).
 * Drawn stems use renderer v2 for `item.sv===2` and the original renderer otherwise, so cuts stored on an older
 * sprite (sv 1) still line up with its pixels.
 */
export function composeSpecimen(img,item,asset,extraCut=null,createCanvas=browserCanvas,k=1){
 const scale=Number.isFinite(k)&&k>0?Math.min(1,k):1,sw=Math.max(1,Math.round((img.naturalWidth||img.width)*scale)),sh=Math.max(1,Math.round((img.naturalHeight||img.height)*scale));
 const src=createCanvas(sw,sh),ctx=context2d(src);
 const nativeTone=!!asset.saturation&&filterSupported(createCanvas);
 if(nativeTone)ctx.filter=`saturate(${asset.saturation})`;
 if(scale<1)drawReducedImage(ctx,img,sw,sh,createCanvas);else ctx.drawImage(img,0,0);
 ctx.filter='none';
 if(asset.saturation&&!nativeTone)desaturate(src,asset.saturation,createCanvas);
 const g=dimensions(item,asset),out=createCanvas(src.width,Math.max(1,Math.round(src.height*g.height)));let dest;try{dest=context2d(out)}catch(err){release(src);release(out);throw err}
 const top=Math.min(g.split,g.end)*src.height;
 const drawnStem=asset.stems&&g.length>1&&g.end>g.split,v2=item.sv===2;
 if(drawnStem&&!v2)paintStems(dest,asset,src,g.end*src.height,out.height,createCanvas);
 if(top>0)dest.drawImage(src,0,0,src.width,top,0,0,out.width,top);
 if(g.end>g.split){const sh=(g.end-g.split)*src.height;dest.drawImage(src,0,top,src.width,sh,0,top,out.width,drawnStem?sh:sh*g.length)}
 if(drawnStem&&v2)paintStemsV2(dest,asset,img,src,g.end,out.height,createCanvas);
 if(item.segments?.length)applySegments(dest,out,item,g,src.height);
 if(item.localCuts?.length)for(const entry of item.localCuts)applyLocalCut(dest,out,entry.cut,entry.part,createCanvas,g);
 if(item.cuts?.length||extraCut)eraseDetails(dest,out,item,g,src.height,extraCut);
 const fullWidth=out.width,fullHeight=out.height;
 let x=0,y=0,width=fullWidth,height=fullHeight,mask=null;
 if(!extraCut){
  const probeScale=Math.min(1,144/Math.max(fullWidth,fullHeight)),pw=Math.max(1,Math.ceil(fullWidth*probeScale)),ph=Math.max(1,Math.ceil(fullHeight*probeScale));
  const probe=createCanvas(pw,ph),pctx=context2d(probe);pctx.drawImage(out,0,0,pw,ph);const pixels=pctx.getImageData(0,0,pw,ph).data;release(probe);
  const alpha=new Uint8Array(pw*ph);for(let n=0;n<alpha.length;n++)alpha[n]=pixels[n*4+3];mask={w:pw,h:ph,data:alpha};
  let left=pw,topPixel=ph,right=-1,bottom=-1;
  for(let py=0;py<ph;py++)for(let px=0;px<pw;px++)if(alpha[py*pw+px]>12){left=Math.min(left,px);topPixel=Math.min(topPixel,py);right=Math.max(right,px);bottom=Math.max(bottom,py)}
  if(right>=left&&bottom>=topPixel){
   const padX=Math.max(1,Math.ceil(pw*.012)),padY=Math.max(1,Math.ceil(ph*.012));
   x=Math.max(0,Math.floor((left-padX)/probeScale));y=Math.max(0,Math.floor((topPixel-padY)/probeScale));
   const r=Math.min(fullWidth,Math.ceil((right+1+padX)/probeScale)),b=Math.min(fullHeight,Math.ceil((bottom+1+padY)/probeScale));width=Math.max(1,r-x);height=Math.max(1,b-y);
  }
 }
 release(src);
 const sprite=x===0&&y===0&&width===fullWidth&&height===fullHeight?out:createCanvas(width,height);
 if(sprite!==out){try{context2d(sprite).drawImage(out,x,y,width,height,0,0,width,height)}finally{release(out)}}
 sprite.crop={x,y,width,height,fullWidth,fullHeight,bottom:(y+height)/fullHeight};sprite.scale=scale;if(mask)sprite.mask=mask;
 return sprite;
}

const shade=(hex,f)=>'#'+[1,3,5].map(i=>Math.round(Math.min(255,parseInt(hex.slice(i,i+2),16)*f)).toString(16).padStart(2,'0')).join('');
/** Resolve each drawn stem to an actual opaque cut end. Missing ends do not receive invented connectors. */
function visibleStemRoots(src,asset,end,createCanvas){
 const pw=Math.min(256,src.width),ph=Math.min(256,src.height),probe=createCanvas(pw,ph),ctx=context2d(probe);
 ctx.drawImage(src,0,0,pw,ph);const alpha=ctx.getImageData(0,0,pw,ph).data;release(probe);
 const last=Math.min(ph-1,Math.floor(end/src.height*ph)-1),first=Math.max(0,Math.floor(last-ph*.38));
 return asset.stems.flatMap(([u,startCm,endCm,color])=>{
  const target=Math.round(u*(pw-1)),radius=Math.max(2,Math.round(pw*.045));
  for(let y=last;y>=first;y--){
   let best=-1,distance=Infinity;
   for(let x=Math.max(0,target-radius);x<=Math.min(pw-1,target+radius);x++)if(alpha[(y*pw+x)*4+3]>48&&Math.abs(x-target)<distance){best=x;distance=Math.abs(x-target)}
   if(best<0)continue;
   let left=best,right=best;while(left>0&&alpha[(y*pw+left-1)*4+3]>48)left--;while(right<pw-1&&alpha[(y*pw+right+1)*4+3]>48)right++;
   return [{x:(best+.5)/pw*src.width,y:Math.min(end,(y+.5)/ph*src.height),width:(right-left+1)/pw*src.width,startCm,endCm,color}];
  }
  return [];
 });
}
/** v1 (sv 1): follow the photograph's existing cut ends with tapered, gently curved, order-preserving stems. Kept exactly. */
function paintStems(ctx,asset,src,from,to,createCanvas){
 const roots=visibleStemRoots(src,asset,from,createCanvas);
 for(const {p0,p1,p2,p3,w0,w1,color} of naturalStemRoutesV1(asset,roots,src.width,src.height,to)){
  if(p3[1]-p0[1]<2)continue;
  ctx.save();const fill=ctx.createLinearGradient(0,p0[1],0,p3[1]);fill.addColorStop(0,color);fill.addColorStop(1,shade(color,.78));ctx.fillStyle=fill;
  ctx.beginPath();ctx.moveTo(p0[0]-w0/2,p0[1]);ctx.bezierCurveTo(p1[0]-w0*.44,p1[1],p2[0]-w1*.56,p2[1],p3[0]-w1/2,p3[1]);ctx.lineTo(p3[0]+w1/2,p3[1]);ctx.bezierCurveTo(p2[0]+w1*.56,p2[1],p1[0]+w0*.44,p1[1],p0[0]+w0/2,p0[1]);ctx.closePath();ctx.fill();
  ctx.strokeStyle=shade(color,1.22);ctx.globalAlpha=.27;ctx.lineWidth=Math.max(.5,w1*.16);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p0[0]-w0*.1,p0[1]);ctx.bezierCurveTo(p1[0]-w0*.1,p1[1],p2[0]-w1*.1,p2[1],p3[0]-w1*.1,p3[1]);ctx.stroke();ctx.restore();
 }
}

/** v2 probe: the original photograph (tone-corrected like the sprite) drawn uniformly into at most 512 px, as RGBA. */
function probePhoto(img,asset,createCanvas,max=512){
 const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,scale=Math.min(1,max/Math.max(iw,ih)),pw=Math.max(1,Math.round(iw*scale)),ph=Math.max(1,Math.round(ih*scale));
 const probe=createCanvas(pw,ph),ctx=context2d(probe);
 const nativeTone=!!asset.saturation&&filterSupported(createCanvas);
 if(nativeTone)ctx.filter=`saturate(${asset.saturation})`;
 ctx.drawImage(img,0,0,pw,ph);ctx.filter='none';
 const data=ctx.getImageData(0,0,pw,ph).data;release(probe);
 // Without canvas filters, tone the probe's pixels exactly (CSS saturate matrix): its alpha must stay untouched, because
 // the stem roots are measured from it.
 if(asset.saturation&&!nativeTone)saturatePixels(data,asset.saturation);
 return {data,width:pw,height:ph,scale:pw/iw};
}
/** Opaque column runs [x0,x1) in image px along the photograph's lowest two probe rows above `from`: where its lower edge slices something. */
function slicedRuns(probe,from){
 const {data,width:pw,height:ph,scale}=probe,last=Math.min(ph-1,Math.floor(from*scale)-1),runs=[];
 let start=-1;
 for(let x=0;x<=pw;x++){
  const solid=x<pw&&[last,last-1].some(y=>y>=0&&data[(y*pw+x)*4+3]>48);
  if(solid&&start<0)start=x;
  if(!solid&&start>=0){runs.push([Math.max(0,(start-1)/scale),Math.min(pw,x+1)/scale]);start=-1}
 }
 return runs;
}
/**
 * v2 bottom feather: fade the lowest 3% of the photograph where its edge cuts through leaves or petals, so they stop in
 * a soft edge rather than a ruler-straight one. Each stem's cut end stays opaque (a column 1.35× its width, softened at
 * the sides), because the drawn stem continues it.
 */
function featherPhotoBottom(ctx,sliced,from,roots,routes){
 const band=Math.max(2,from*.03),keep=[];
 for(const root of roots){
  const route=routes.find(r=>r.index===root.index),w=Math.max(route?.w0||0,root.merged?0:root.width||0)*1.35,soft=Math.max(1,(route?.w0||w)*.35);
  keep.push([root.x-w/2,root.x+w/2,soft]);
 }
 ctx.save();ctx.globalCompositeOperation='destination-out';
 const fade=ctx.createLinearGradient(0,from-band,0,from);fade.addColorStop(0,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,1)');ctx.fillStyle=fade;
 for(const [x0,x1] of sliced){
  // Strength 1 away from every kept column, ramping to 0 across its soft margin.
  const cuts=[x0,x1];for(const [a,b,soft] of keep)for(let k=0;k<=3;k++)cuts.push(a-soft*k/3,b+soft*k/3);
  const xs=[...new Set(cuts.filter(x=>x>=x0&&x<=x1))].sort((a,b)=>a-b);
  for(let i=1;i<xs.length;i++){
   const a=xs[i-1],b=xs[i],mid=(a+b)/2;if(b-a<.01)continue;
   let strength=1;for(const [l,r,soft] of keep){const d=mid<l?l-mid:mid>r?mid-r:-1;strength=Math.min(strength,d<0?0:Math.min(1,d/soft))}
   if(strength<=0)continue;ctx.globalAlpha=strength;ctx.fillRect(a,from-band,b-a,band+1);
  }
 }
 ctx.restore();
}
/** Points offset across the stem by `share` of its width; `pts` carry unit normals (nx,ny) pointing to the stem's right. */
function traceBand(ctx,pts,from,to){
 ctx.beginPath();
 pts.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](p.x+p.nx*p.w*from,p.y+p.ny*p.w*from));
 for(let i=pts.length-1;i>=0;i--){const p=pts[i];ctx.lineTo(p.x+p.nx*p.w*to,p.y+p.ny*p.w*to)}
 ctx.closePath();
}
/**
 * v2 cylinder shading, bottom layer first: [shade factor, alpha, from, to] across the width (−.5 left … .5 right; light from the left).
 * Base shade .8; core in the stem colour over the middle .62 of the width; highlight 1.18 at α ≈ .35 centred −.22 across;
 * a faint dark edge .6 on the shadow side. Each band is built from two or three softer ones so no edge reads as a line.
 */
const STEM_SHADING=[[.8,1,-.5,.5],[1,.5,-.37,.37],[1,.5,-.31,.31],[1,1,-.25,.25],[1.18,.2,-.3,-.14],[1.18,.2,-.27,-.17],[.6,.15,.38,.5],[.6,.15,.44,.5]];
/** A v2 route's outline points with unit normals, starting a little inside the photographed stub (hidden under it) so
 a slanted cut leaves no notch. A steered start (stemFix dir) leaves its stub at an angle, where that overlap would show. */
function stemOutline(route){
 const pts=stemPath(route,64);
 for(let i=0;i<pts.length;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],tx=b.x-a.x,ty=b.y-a.y,n=Math.hypot(tx,ty)||1;pts[i].nx=ty/n;pts[i].ny=-tx/n}
 const first=pts[0],back=route.steered?0:Math.max(1,first.w*.35);if(back)pts.unshift({...first,x:first.x+first.ny*back,y:first.y-first.nx*back});
 return pts;
}
/** v2 stem: a round, lit cylinder within its outline, blending from the stub's sampled colour to the catalogue colour over its first 30%. */
function paintStemV2(ctx,route,pts){
 const len=route.p3[1]-route.p0[1];
 const paint=(f,alpha,from,to)=>{
  const top=route.p0[1];let fill=shade(route.color,f);
  if(route.stub){fill=ctx.createLinearGradient(0,top,0,top+len*.3);fill.addColorStop(0,shade(route.stub,f));fill.addColorStop(1,shade(route.color,f))}
  ctx.globalAlpha=alpha;ctx.fillStyle=fill;traceBand(ctx,pts,from,to);ctx.fill();
 };
 // Every band lies within ±½ width of the centreline, so the outline needs no clip.
 ctx.save();for(const [f,alpha,from,to] of STEM_SHADING)paint(f,alpha,from,to);ctx.restore();
}
/** v2 measurements per photograph and lower edge (`end`, 0–1), in image px: they do not depend on the sprite's scale,
 so a stem looks the same at every zoom, and rebuilding a sprite (a length change) does not probe again. */
const stemMeasures=new WeakMap();
function measureStems(img,asset,end,createCanvas){
 let byEnd=stemMeasures.get(img);if(!byEnd){byEnd=new Map();stemMeasures.set(img,byEnd)}
 const key=`${asset.id}|${end}`;
 if(!byEnd.has(key)){
  const probe=probePhoto(img,asset,createCanvas),ih=img.naturalHeight||img.height,bottom=end*ih;
  byEnd.set(key,{roots:stemRoots(probe,asset,{bottom,scale:probe.scale,cmPixels:ih/Math.max(1,asset.height)}),sliced:slicedRuns(probe,bottom),width:img.naturalWidth||img.width,height:ih});
  while(byEnd.size>6)byEnd.delete(byEnd.keys().next().value);
 }
 return byEnd.get(key);
}
/**
 * v2 (sv 2): stems sized by their stubs, tangent to them, converged into the neck; drawn beneath the finished photograph.
 * They are painted normally on a canvas just large enough for them, then slid under the photograph in one
 * destination-over draw (layered destination-over fills on the full sprite are many times slower).
 */
function paintStemsV2(ctx,asset,img,src,end,to,createCanvas){
 const from=end*src.height,measured=measureStems(img,asset,end,createCanvas),sx=src.width/measured.width,sy=src.height/measured.height;
 const roots=measured.roots.map(root=>({...root,x:root.x*sx,y:Math.min(from,root.y*sy),tip:Math.min(from,root.tip*sy),width:root.width*sx}));
 const routes=naturalStemRoutes(asset,roots,src.width,src.height,to).filter(route=>route.p3[1]-route.p0[1]>=2);
 featherPhotoBottom(ctx,measured.sliced.map(([a,b])=>[a*sx,b*sx]),from,roots,routes);
 if(!routes.length)return;
 const outlines=routes.map(stemOutline),pad=2;
 // A slanted or rounded cut face below the root would sit on the drawn stem like a cap: clear the photograph inside
 // the stem's outline down to the cut's lowest point, so the drawn stem continues the stub there.
 routes.forEach((route,i)=>{
  const root=roots.find(r=>r.index===route.index);if(!root||root.merged||!(root.tip-route.p0[1]>1))return;
  ctx.save();ctx.beginPath();ctx.rect(0,route.p0[1]+.5,src.width,root.tip-route.p0[1]+1.5);ctx.clip();
  ctx.globalCompositeOperation='destination-out';traceBand(ctx,outlines[i],-.5,.5);ctx.fill();ctx.restore();
 });
 let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
 for(const pts of outlines)for(const p of pts){const r=p.w/2+pad;x0=Math.min(x0,p.x-r);x1=Math.max(x1,p.x+r);y0=Math.min(y0,p.y-r);y1=Math.max(y1,p.y+r)}
 x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(src.width,Math.ceil(x1));y1=Math.min(Math.ceil(to),Math.ceil(y1));
 if(x1<=x0||y1<=y0)return;
 const layer=createCanvas(x1-x0,y1-y0);
 try{
  const lctx=context2d(layer);lctx.translate(-x0,-y0);
  routes.forEach((route,i)=>paintStemV2(lctx,route,outlines[i]));
  ctx.save();ctx.globalCompositeOperation='destination-over';ctx.drawImage(layer,x0,y0);ctx.restore();
 }finally{release(layer)}
}

/**
 * One key light, high and to the left in front of the arrangement: every cast shadow falls down and to the right along
 * `dir`. How far it reaches and how soft it is depends on what receives it: a stem in front shades what is just behind it;
 * stems behind the vessel, and the vessel itself, throw theirs onto the wall. Reach and blur are fractions of the frame
 * size (canvas shadowBlur and CSS drop-shadow blur share one scale); colours per scene.
 */
export const LIGHT=Object.freeze({
 dir:[.6,.8],
 front:{reach:.0086,blur:.006,color:{paper:'#30372d24',stone:'#30372d24',night:'#07100b55'}},
 back:{reach:.014,blur:.02,color:{paper:'#30372d10',stone:'#30372d10',night:'#07100b26'}},
 vessel:{reach:.019,blur:.016,color:{paper:'#34382f35',stone:'#34382f35',night:'#07100b88'}}
});
/** A LIGHT shadow in px for a frame `size` px wide: {x,y,blur,color}. `kind` is front, back or vessel. */
export function lightShadow(kind,size,scene){
 const light=LIGHT[kind]||LIGHT.front;
 return {x:LIGHT.dir[0]*light.reach*size,y:LIGHT.dir[1]*light.reach*size,blur:light.blur*size,color:light.color[scene]||light.color.paper};
}
/** Where the stage floor meets the wall, as a fraction of the frame height. */
export const HORIZON=.795;
/** The vessel's rectangle in px; every pass that draws the vessel image uses it, so their pixels coincide. */
const vesselRect=(g,size)=>[g.left/100*size,g.top/100*size,g.width/100*size,g.height/100*size];

/**
 * Draw one botanical at its stage transform. `shadow` is a lightShadow() or null; `tone`, when below 1, desaturates it
 * like CSS saturate() (natively, or without canvas filters where they are unsupported).
 */
function drawBotanical(ctx,size,item,asset,getSprite,{alpha=1,tone=1,shadow=null,createCanvas=browserCanvas}={}){
 const src=getSprite(item),g=dimensions(item,asset);if(!src)return;
 const crop=src.crop||{x:0,y:0,width:src.width,height:src.height,fullWidth:src.width,fullHeight:src.height,bottom:item.cropAnchorY??1};
 const fullH=item.h/100*size*g.height,fullW=item.h/100*size*g.ratio;
 const left=-fullW*g.anchor+fullW*crop.x/crop.fullWidth;
 const pivot=Number.isFinite(item.cropAnchorSourceY)?warpY(item.cropAnchorSourceY,g.split,g.length)/g.height:(item.cropAnchorY??1);
 const top=fullH*(crop.y/crop.fullHeight-pivot);
 const width=fullW*crop.width/crop.fullWidth,height=fullH*crop.height/crop.fullHeight;
 ctx.save();ctx.translate(item.x/100*size,item.y/100*size);ctx.rotate(item.angle*Math.PI/180);ctx.scale(item.flip?-1:1,1);ctx.globalAlpha=alpha;
 if(shadow){ctx.shadowColor=shadow.color;ctx.shadowBlur=shadow.blur;ctx.shadowOffsetX=shadow.x;ctx.shadowOffsetY=shadow.y}
 if(hasFlex(item.flex))drawFlexImage(ctx,src,{left,top,width,height},createFlexChain(item.flex,flexExtent(item,asset,g)*size),tone,createCanvas);
 else if(tone<1)drawToned(ctx,src,tone,left,top,width,height,createCanvas);else ctx.drawImage(src,left,top,width,height);
 ctx.restore();
}

/** Rasterize once before shadow/tone: triangle edges must never cast individual shadows. */
function drawFlexImage(ctx,src,rect,chain,tone,createCanvas){
 const mesh=flexGrid(rect,chain),xs=mesh.vertices.map(v=>v.point[0]),ys=mesh.vertices.map(v=>v.point[1]);
 const left=Math.floor(Math.min(...xs))-2,top=Math.floor(Math.min(...ys))-2,width=Math.ceil(Math.max(...xs))-left+2,height=Math.ceil(Math.max(...ys))-top+2;
 const k=Math.min(1,4096/Math.max(width,height)),out=createCanvas(Math.max(1,Math.ceil(width*k)),Math.max(1,Math.ceil(height*k)));
 try{
  const c=context2d(out);c.scale(k,k);c.translate(-left,-top);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  for(const indices of mesh.triangles){
   const [v0,v1,v2]=indices.map(i=>mesh.vertices[i]),[p0,p1,p2]=[v0,v1,v2].map(v=>v.point);
   const [s0,s1,s2]=[v0,v1,v2].map(v=>[v.uv[0]*src.width,v.uv[1]*src.height]);
   const sx1=s1[0]-s0[0],sy1=s1[1]-s0[1],sx2=s2[0]-s0[0],sy2=s2[1]-s0[1],det=sx1*sy2-sx2*sy1;
   if(Math.abs(det)<1e-10)continue;
   const dx1=p1[0]-p0[0],dy1=p1[1]-p0[1],dx2=p2[0]-p0[0],dy2=p2[1]-p0[1];
   const a=(dx1*sy2-dx2*sy1)/det,b=(dy1*sy2-dy2*sy1)/det,cx=(sx1*dx2-sx2*dx1)/det,d=(sx1*dy2-sx2*dy1)/det;
   // Canvas clips antialias each side separately. Subpixel overlap keeps shared triangle edges from turning into seams.
   const center=[(p0[0]+p1[0]+p2[0])/3,(p0[1]+p1[1]+p2[1])/3],area=Math.abs(dx1*dy2-dx2*dy1);
   const edge=Math.max(Math.hypot(dx1,dy1),Math.hypot(dx2,dy2),Math.hypot(p2[0]-p1[0],p2[1]-p1[1]));
   const expand=1+.6/k/Math.max(.01,area/(3*edge)),clip=[p0,p1,p2].map(p=>[center[0]+(p[0]-center[0])*expand,center[1]+(p[1]-center[1])*expand]);
   c.save();c.beginPath();c.moveTo(...clip[0]);c.lineTo(...clip[1]);c.lineTo(...clip[2]);c.closePath();c.clip();
   c.transform(a,b,cx,d,p0[0]-a*s0[0]-cx*s0[1],p0[1]-b*s0[0]-d*s0[1]);c.drawImage(src,0,0);c.restore();
  }
  if(tone<1)drawToned(ctx,out,tone,left,top,width,height,createCanvas);else ctx.drawImage(out,left,top,width,height);
 }finally{release(out)}
}

/** Add an opening's outline to the current path as its own closed subpath, so several openings form a union. */
function traceOpening(ctx,size,opening){
 const x=opening.center[0]/100*size,y=opening.center[1]/100*size,rx=Math.max(1,opening.radius[0]/100*size),ry=Math.max(1,opening.radius[1]/100*size),rotation=opening.rotation||0;
 if(opening.shape==='rect')ctx.rect(x-rx,y-ry,rx*2,ry*2);
 else{ctx.moveTo(x+rx*Math.cos(rotation),y+rx*Math.sin(rotation));ctx.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);ctx.closePath()}
}
/** Add a capsule (stage cm: base, tip, radius) to the current path as a closed clockwise subpath. */
function traceCapsule(ctx,size,{base,tip,radius}){
 const k=size/100,x0=base[0]*k,y0=base[1]*k,x1=tip[0]*k,y1=tip[1]*k,r=Math.max(.5,radius*k),a=Math.atan2(y1-y0,x1-x0);
 ctx.moveTo(x1+r*Math.cos(a-Math.PI/2),y1+r*Math.sin(a-Math.PI/2));
 ctx.arc(x1,y1,r,a-Math.PI/2,a+Math.PI/2);ctx.arc(x0,y0,r,a+Math.PI/2,a+Math.PI*3/2);ctx.closePath();
}
function kenzanColors(material,guide,night){
 if(guide)return ['#596456','#9aa18c','#465044'];
 if(material==='steel')return night?['#303535','#656b68','#242929']:['#4d5554','#9a9e97','#363d3c'];
 if(material==='blackened-brass')return night?['#1f1d18','#4c4432','#15140f']:['#2d2920','#6f6248','#211e18'];
 return night?['#30291c','#665735','#211b12']:['#584a31','#9a8557','#3a3122'];
}
function drawKenzan(ctx,size,center,radius,fixture,{guide,night}){
 const x=center[0]/100*size,y=center[1]/100*size,rx=Math.max(2,radius[0]/100*size),ry=Math.max(1.2,radius[1]/100*size),colors=kenzanColors(fixture.material,guide,night);
 ctx.save();ctx.shadowColor=night?'#080b0973':'#2f332b45';ctx.shadowBlur=Math.max(1,size*.002);ctx.shadowOffsetY=Math.max(.5,size*.0008);
 const base=ctx.createLinearGradient(x-rx,y-ry,x+rx,y+ry);base.addColorStop(0,colors[0]);base.addColorStop(.48,colors[1]);base.addColorStop(1,colors[2]);
 ctx.fillStyle=base;ctx.strokeStyle=colors[0];ctx.lineWidth=Math.max(.65,size*.00055);ctx.beginPath();ctx.ellipse(x,y+ry*.16,rx,ry,0,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.restore();
 const rows=guide?3:5,cols=guide?7:11,pin=Math.max(.8,size*(guide ? .0015 : .0022));ctx.strokeStyle=colors[1];ctx.fillStyle=colors[1];ctx.lineWidth=Math.max(.45,size*.00034);
 for(let row=0;row<rows;row++){
  const ny=rows===1?0:(row/(rows-1)*1.3-.65),span=Math.sqrt(Math.max(0,1-ny*ny))*.78;
  for(let col=0;col<cols;col++){
   const nx=cols===1?0:(col/(cols-1)*2-1)*span,px=x+nx*rx,py=y+ny*ry*.78;
   ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px,py-pin);ctx.stroke();ctx.beginPath();ctx.arc(px,py-pin,Math.max(.45,size*.00034),0,Math.PI*2);ctx.fill();
  }
 }
 if(fixture.water&&!guide){ctx.save();ctx.fillStyle=night?'#afc9c119':'#d8e8e122';ctx.beginPath();ctx.ellipse(x,y,rx*1.12,ry*1.25,0,0,Math.PI*2);ctx.fill();ctx.restore()}
}
function drawWire(ctx,size,center,radius,{guide,night}){
 const x=center[0]/100*size,y=center[1]/100*size,rx=Math.max(3,radius[0]/100*size),ry=Math.max(2,radius[1]/100*size),step=Math.max(size*.006,rx/9);
 ctx.fillStyle=night?'#14181730':'#5d61582a';ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=guide?(night?'#c5cec099':'#53604f99'):(night?'#a5aaa36b':'#343a365f');ctx.lineWidth=Math.max(.55,size*(guide ? .00065 : .0005));
 for(let offset=-rx-ry*2;offset<=rx+ry*2;offset+=step){
  ctx.beginPath();ctx.moveTo(x+offset-ry,y-ry);ctx.lineTo(x+offset+ry,y+ry);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+offset+ry,y-ry);ctx.lineTo(x+offset-ry,y+ry);ctx.stroke();
 }
 ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.stroke();
}
/** Kenzan colours per material: side band light, mid and dark, top face, pin shaft, pin tip. */
const KENZAN_COLORS={
 brass:['#9a8352','#5f4e2d','#2c2414','#3b3121','#4d3f25','#e2cd94'],
 'blackened-brass':['#433c31','#2a2620','#13110e','#1b1814','#27221c','#ad9d80'],
 steel:['#a3a9a4','#626a67','#2c3231','#3a403e','#424947','#e6e9e5']
};
/** Still water over the holder: a cool cast that lifts dark metal a little and dims bright brass. */
const WATER_TINT={paper:'#8aa39c',stone:'#8aa39c',night:'#4d625d'};
const mixHex=(hex,to,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*(1-t)+parseInt(to.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
function holderPalette(holder,night){
 const c=(KENZAN_COLORS[holder.material]||KENZAN_COLORS.brass).map(hex=>night?shade(hex,.6):hex),water=night?WATER_TINT.night:WATER_TINT.paper;
 // A 'partial' holder stands deeper below the rim: more water between it and the eye.
 const deep=holder.water&&holder.deep;
 return {side:c.slice(0,3),face:c[3],shaft:c[4],tip:c[5],wetShaft:holder.water?mixHex(c[4],water,deep?.4:.22):c[4],tint:holder.water?water+(deep?(night?'3d':'4d'):(night?'26':'33')):null};
}
/** A holder's on-screen measures in px at `k` px/cm: plate band, pin height and the submerged part of each pin. */
function holderMeasures(holder,k){
 const cos=Math.sqrt(Math.max(0,1-holder.ratio*holder.ratio)),pin=KENZAN.pin*cos*k;
 return {rx:holder.rx*k,ry:holder.ry*k,plate:KENZAN.plate*cos*k,pin,wet:holder.water?Math.min(pin,KENZAN.water*cos*k):0};
}
/** Trace the plate (top face and side band) of a holder whose top-face centre is at x,y px. */
function traceHolderBody(ctx,x,y,{rx,ry,plate}){
 ctx.beginPath();ctx.moveTo(x+rx,y);ctx.lineTo(x+rx,y+plate);ctx.ellipse(x,y+plate,rx,ry,0,0,Math.PI);ctx.lineTo(x-rx,y);ctx.ellipse(x,y,rx,ry,0,Math.PI,Math.PI*2);ctx.closePath();
}
/**
 * Pins, back rows first; one path per row for shafts and one for tips, so a row covers the rows behind it. Each pin is a
 * dark shaft (its submerged part tinted in a water vessel) with a bright tip; on small stages the tips are thinner.
 */
function drawPins(ctx,x,y,holder,k,pal,pins,thin){
 const m=holderMeasures(holder,k),lw=Math.max(.5,.06*k),tip=thin?Math.max(.3,.03*k):Math.max(.45,.045*k);
 ctx.lineWidth=lw;ctx.lineCap='round';
 for(let i=0;i<pins.length;){
  const v=pins[i].v;let j=i;while(j<pins.length&&pins[j].v===v)j++;
  const py=y+v*holder.ratio*k,row=pins.slice(i,j).map(p=>{const n=pinNoise(p);return [x+(p.u+n[0]*.04)*k,m.pin*(1+n[1]*.05)]});i=j;
  if(m.wet>0){ctx.strokeStyle=pal.wetShaft;ctx.beginPath();for(const [px] of row){ctx.moveTo(px,py);ctx.lineTo(px,py-m.wet)}ctx.stroke()}
  ctx.strokeStyle=pal.shaft;ctx.beginPath();for(const [px,h] of row)if(h>m.wet){ctx.moveTo(px,py-m.wet);ctx.lineTo(px,py-h)}ctx.stroke();
  ctx.fillStyle=pal.tip;ctx.beginPath();for(const [px,h] of row){ctx.moveTo(px+tip,py-h);ctx.arc(px,py-h,tip,0,Math.PI*2)}ctx.fill();
 }
}
/** A pin's fixed jitter in [-1,1]²: hand-set pins are not a perfect lattice (sideways offset, height). */
const pinNoise=({u,v})=>{const h=Math.sin(u*12.9898+v*78.233)*43758.5453,f=h-Math.floor(h);return [f*2-1,((f*7.13)%1)*2-1]};
/** One opaque holder at x,y px (top-face centre): contact shadow, side band, top face, its rim, water tint, then the pin field. */
function paintHolder(ctx,x,y,holder,k,{night,thin}){
 const pal=holderPalette(holder,night),m=holderMeasures(holder,k);
 ctx.save();
 softEllipse(ctx,x+.15*k,y+m.plate+m.ry*.1,m.rx*1.07,m.ry*1.12,Math.max(1,.35*k),night?'#000000a0':'#1d211a66');
 traceHolderBody(ctx,x,y,m);
 const side=ctx.createLinearGradient(x-m.rx,0,x+m.rx,0);side.addColorStop(0,pal.side[1]);side.addColorStop(.22,pal.side[0]);side.addColorStop(.62,pal.side[1]);side.addColorStop(1,pal.side[2]);
 ctx.fillStyle=side;ctx.fill();
 const face=ctx.createLinearGradient(0,y-m.ry,0,y+m.ry);face.addColorStop(0,shade(pal.face,.75));face.addColorStop(1,pal.face);
 ctx.fillStyle=face;ctx.beginPath();ctx.ellipse(x,y,m.rx,m.ry,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=pal.side[0];ctx.globalAlpha=.6;ctx.lineWidth=Math.max(.5,.05*k);ctx.beginPath();ctx.ellipse(x,y,m.rx,m.ry,0,.04*Math.PI,.96*Math.PI);ctx.stroke();ctx.globalAlpha=1;
 if(pal.tint){traceHolderBody(ctx,x,y,m);ctx.fillStyle=pal.tint;ctx.fill()}
 drawPins(ctx,x,y,holder,k,pal,kenzanPins(holder),thin);
 ctx.restore();
}
const holderSprites=new Map();
/**
 * Paint a holder at its stage position. With a canvas factory the holder is rendered once per (size, holder, material,
 * scene) into a small cached canvas, so repaints cost one drawImage; the cached pixels match a direct paint.
 */
function drawHolder(ctx,size,holder,options){
 // The vessel's front wall hides the part of the holder below its inner front edge.
 if(!Number.isFinite(holder.lip)){drawHolderAt(ctx,size,holder,options);return}
 ctx.save();ctx.beginPath();ctx.rect(0,0,size,holder.lip*size/100);ctx.clip();drawHolderAt(ctx,size,holder,options);ctx.restore();
}
function drawHolderAt(ctx,size,holder,{night,createCanvas}){
 const k=size/100,x=holder.center[0]*k,y=holder.center[1]*k,thin=size<360,factory=createCanvas||(typeof document==='undefined'?null:browserCanvas);
 if(!factory){paintHolder(ctx,x,y,holder,k,{night,thin});return}
 const m=holderMeasures(holder,k),pad=Math.ceil(.6*k+4),left=Math.floor(x-m.rx-pad),top=Math.floor(y-m.ry-m.pin-pad);
 const key=[size,holder.center,holder.rx,holder.ratio,holder.material,holder.water,holder.deep,night].join('|');
 let sprite=holderSprites.get(key);
 if(!sprite){
  const w=Math.ceil(x+m.rx+pad)-left,h=Math.ceil(y+m.plate+m.ry+pad)-top,c=factory(w,h),cctx=c.getContext('2d');
  if(!cctx){release(c);paintHolder(ctx,x,y,holder,k,{night,thin});return}
  paintHolder(cctx,x-left,y-top,holder,k,{night,thin});sprite=c;holderSprites.set(key,sprite);
  if(holderSprites.size>12){const [first]=holderSprites.keys();release(holderSprites.get(first));holderSprites.delete(first)}
 }
 ctx.drawImage(sprite,left,top);
}
/** Draw only support mechanics intended to remain visible in the finished work. A visible kenzan is opaque metal on pins
 (the guide keeps its light outline version); `createCanvas` lets it be cached (see drawHolder). */
export function paintFixture(ctx,size,asset,{guide=false,night=false,createCanvas=null}={}){
 if(!asset?.fixture||asset.fixture.visibility==='hidden')return;
 const geometry=vesselGeometry(asset),fixture=geometry.fixture;
 if(!fixture||!['visible','partial','subtle'].includes(fixture.visibility))return;
 const targets=(fixture.targets||[0]).map(index=>geometry.openings[index]).filter(Boolean);
 if(!targets.length)return;
 ctx.save();ctx.beginPath();for(const opening of targets)traceOpening(ctx,size,opening);ctx.clip();
 if(!guide&&isKenzan(asset)){
  ctx.globalAlpha=fixture.visibility==='subtle'?.55:1;
  for(const holder of kenzanHolders(asset))drawHolder(ctx,size,holder,{night,createCanvas});
  if(fixture.kind==='pin-frog-wire')for(const center of fixture.centers)drawWire(ctx,size,center,fixture.radius,{guide,night});
  ctx.restore();return;
 }
 ctx.globalAlpha=(guide ? .5 : fixture.visibility==='visible' ? .74 : fixture.visibility==='partial' ? .5 : .3)*(night ? .82 : 1);
 for(const center of fixture.centers){
  if(fixture.kind==='kenzan'||fixture.kind==='pin-frog-wire')drawKenzan(ctx,size,center,fixture.radius,fixture,{guide,night});
  if(fixture.kind==='chicken-wire'||fixture.kind==='wire-grid'||fixture.kind==='pin-frog-wire')drawWire(ctx,size,center,fixture.radius,{guide,night});
 }
 ctx.restore();
}
/** These shared passes keep a layered export pixel-for-pixel aligned with the editor draft. */
export function paintSceneBackground(ctx,size,s,scenes){
 paintOrganicRoom(ctx,size,s);
}
/** A botanical with its LIGHT shadow: stems in front cast a tight one, stems behind the vessel a soft, distant one. */
export function paintBotanicalLayer(ctx,size,s,item,assets,getSprite){
 drawBotanical(ctx,size,item,assets[item.type],getSprite,{shadow:lightShadow(item.aboveVessel?'front':'back',size,s.scene)});
}
const OFFSCREEN=10000;
/** A soft ellipse without ctx.filter: the shape is drawn far outside the canvas and only its shadow lands (identity transform). */
function softEllipse(ctx,x,y,rx,ry,blur,color){
 ctx.save();ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.shadowOffsetX=OFFSCREEN;ctx.shadowOffsetY=0;ctx.fillStyle='#000';
 ctx.beginPath();ctx.ellipse(x-OFFSCREEN,y,Math.max(.5,rx),Math.max(.5,ry),0,0,Math.PI*2);ctx.fill();ctx.restore();
}
/**
 * Ground pass: what the vessel does to the floor and wall, without canvas filters. A tight contact shadow along the
 * measured footprint (vesselFoot in scale.js), a faint cast shadow reaching back and to the right across the floor, and
 * the vessel's silhouette shadow on the wall only (above HORIZON). The export paints it straight after the background;
 * the stage paints the same pass into its scene layer.
 */
export function paintGroundPass(ctx,size,s,assets,images){
 const vessel=assets[s.vessel];if(!vessel)return;
 if(['generated-atelier','generated-editorial'].includes(vessel.source)){paintOrganicGround(ctx,size,vessel,isNightScene(s.scene));return;}
 const night=isNightScene(s.scene),k=size/100,foot=vesselFoot(vessel);
 softEllipse(ctx,(foot.cx+1.2)*k,(foot.bottom-.4)*k,foot.half*1.15*k,Math.max(.8,foot.arc*1.3)*k,size*.024,night?'#07100b2e':'#2f332b1f');
 // The foot ring seen from above the table is an ellipse whose front edge is the vessel's lowest point: centred a little
 // above it, so the shadow hugs the foot instead of lying in front of it like a dish.
 const ry=Math.max(.35,foot.arc);
 softEllipse(ctx,foot.cx*k,(foot.bottom-ry*.6)*k,foot.half*1.08*k,ry*k,size*.005,night?'#07100b8c':'#2b2e2861');
 const img=images?.[s.vessel];if(!img)return;
 const shadow=lightShadow('vessel',size,s.scene),[x,y,w,h]=vesselRect(vesselGeometry(vessel),size);
 ctx.save();ctx.beginPath();ctx.rect(0,0,size,size*HORIZON);ctx.clip();
 ctx.shadowColor=shadow.color;ctx.shadowBlur=shadow.blur;ctx.shadowOffsetX=OFFSCREEN+shadow.x;ctx.shadowOffsetY=shadow.y;ctx.drawImage(img,x-OFFSCREEN,y,w,h);ctx.restore();
}
/** The vessel image; by default with its ground shadows below it and its visible support above it (the original single pass). */
export function paintVesselLayer(ctx,size,s,assets,images,{ground=true,fixture=true}={}){
 const vessel=assets[s.vessel],img=images[s.vessel];if(!vessel)return;
 if(ground)paintGroundPass(ctx,size,s,assets,images);
 if(img)ctx.drawImage(img,...vesselRect(vesselGeometry(vessel),size));
 if(fixture)paintFixture(ctx,size,vessel,{night:isNightScene(s.scene)});
}
/** How far above an opening its back lip may rise (cm): a stem entering the mouth passes in front of it. */
const LIP_CM=.5;
const stemFeet=new WeakMap();
/**
 * Where the stem leaves a sprite's visible bottom, in stage cm ({x,y,width,dir?,slack}), from the sprite's alpha probe:
 * among the opaque runs of its lowest two opaque rows, the stem-wide ones (leaves are wider) nearest the anchor, gathered
 * within 1.5 cm so a bundle counts as one; `dir` points up the stem from there, `slack` is the probe's resolution.
 * Null without a probe. Cached per sprite and placement.
 */
function stemFoot(item,asset,sprite){
 const mask=sprite?.mask,g=dimensions(item,asset),wide=item.h*g.ratio;if(!mask||!(wide>0))return null;
 const key=`${item.x}|${item.y}|${item.h}|${item.angle}|${item.flip}|${g.pivotY}`,cached=stemFeet.get(sprite);
 if(cached?.key===key)return cached.foot;
 const {w,h,data}=mask;let last=-1,foot=null;
 for(let y=h-1;y>=0&&last<0;y--)for(let x=0;x<w;x++)if(data[y*w+x]>48){last=y;break}
 if(last>=0){
  const runs=[];let start=-1;
  for(let x=0;x<=w;x++){const solid=x<w&&(data[last*w+x]>48||(last>0&&data[(last-1)*w+x]>48));if(solid&&start<0)start=x;if(!solid&&start>=0){runs.push([start,x]);start=-1}}
  const cm=px=>px/w*wide,mm=stemMmOf(asset),narrow=Math.max(1.2,2.2*(mm?mm[1]/10:.5)),stems=runs.filter(([a,b])=>cm(b-a)<=narrow),pool=stems.length?stems:runs;
  const ax=g.anchor*w,gap=([a,b],x)=>x<a?a-x:x>b?x-b:0,near=pool.reduce((best,run)=>!best||gap(run,ax)<gap(best,ax)?run:best,null);
  if(near){
   const bundle=pool.filter(([a,b])=>cm(Math.max(0,a-near[1],near[0]-b))<=1.5),x0=Math.min(...bundle.map(r=>r[0])),x1=Math.max(...bundle.map(r=>r[1]));
   const flip=item.flip?-1:1,r=item.angle*Math.PI/180,tall=item.h*g.height/h,toStage=(lx,ly)=>[lx*Math.cos(r)-ly*Math.sin(r),lx*Math.sin(r)+ly*Math.cos(r)];
   const lx=((x0+x1)/2/w-g.anchor)*wide*flip,ly=((last+1)/h*g.height-g.pivotY)*item.h,[dx,dy]=toStage(lx,ly);
   // Direction: the same stem-wide runs about 1.5 cm higher, within 1 cm of the foot's span on either side.
   const up=Math.max(2,Math.round(1.5/tall)),top=last-up,reach=1/wide*w;let dir=null;
   if(top>=0){
    const higher=[];let begin=-1;
    for(let x=0;x<=w;x++){const solid=x<w&&data[top*w+x]>48;if(solid&&begin<0)begin=x;if(!solid&&begin>=0){higher.push([begin,x]);begin=-1}}
    const above=higher.filter(([a,b])=>cm(b-a)<=narrow&&b>=x0-reach&&a<=x1+reach);
    if(above.length){const cx=(Math.min(...above.map(q=>q[0]))+Math.max(...above.map(q=>q[1])))/2;dir=toStage((cx-(x0+x1)/2)/w*wide*flip,-up*tall)}
   }
   foot={x:item.x+dx,y:item.y+dy,width:cm(x1-x0),slack:1.5*Math.max(wide/w,tall),...(dir?{dir}:{})};
  }
 }
 stemFeet.set(sprite,{key,foot});
 return foot;
}
/** seatClip for an item as drawn: measured at the stem's real foot when its sprite is at hand. */
const clipOf=(item,a,vessel,getSprite)=>seatClip(item,a,vessel,getSprite?stemFoot(item,a,getSprite(item)):null);
/**
 * Every stem that stands in the vessel, as drawn: {interior:[{item,asset,clip}], rim:[…]} (see seatClip in scale.js).
 * The stage asks this first, so it allocates its interior and rim canvases only when something will be painted.
 */
export function seatedClips(s,assets,getSprite=null){
 const vessel=assets[s.vessel],out={interior:[],rim:[]};if(!vessel)return out;
 for(const item of s.items){
  const asset=assets[item.type],clip=asset&&clipOf(item,asset,vessel,getSprite);
  if(clip&&(clip.kind==='interior')===!item.aboveVessel)out[clip.kind].push({item,asset,clip});
 }
 return out;
}
/**
 * Interior pass: each seated stem behind the vessel is drawn again (no shadow) inside its capsule, within its opening
 * and the back lip just above it (above the clip's floor), so it visibly enters the mouth or stands on the support; the
 * fixture is painted after it. `look(item)` may return drawBotanical options (the guide's alpha and tone); `clips` reuses seatedClips().interior.
 * Returns how many stems it drew.
 */
export function paintInteriorPass(ctx,size,s,assets,getSprite,{look=null,clips=null}={}){
 const vessel=assets[s.vessel];if(!vessel)return 0;
 const openings=vesselGeometry(vessel).openings,list=clips||seatedClips(s,assets,getSprite).interior;
 for(const {item,asset,clip} of list){
  const opening=openings[clip.opening]||openings[0];
  ctx.save();
  ctx.beginPath();traceOpening(ctx,size,opening);traceOpening(ctx,size,{...opening,center:[opening.center[0],opening.center[1]-LIP_CM]});ctx.clip();
  if(Number.isFinite(clip.floor)){ctx.beginPath();ctx.rect(0,0,size,clip.floor/100*size);ctx.clip()}
  ctx.beginPath();traceCapsule(ctx,size,clip);ctx.clip();
  drawBotanical(ctx,size,item,asset,getSprite,look?.(item)||{});
  ctx.restore();
 }
 return list.length;
}
/**
 * Rim pass: where a seated stem in front of the vessel enters below the front rim, the vessel image (no shadow) is drawn
 * over its lowest part: the union of the seatClip capsules, below the opening's centre line, outside the opening.
 * The capsules hug the stem, so leaves near the base keep their own edges. With `getSprite` the capsule follows the
 * stem where it really leaves the sprite; `clips` reuses seatedClips().rim. Returns how many stems it covered.
 */
export function paintRimPass(ctx,size,s,assets,images,getSprite=null,{clips=null}={}){
 const vessel=assets[s.vessel],img=images?.[s.vessel];if(!vessel||!img)return 0;
 const g=vesselGeometry(vessel),groups=new Map(),list=clips||seatedClips(s,assets,getSprite).rim;
 for(const {clip} of list){if(!groups.has(clip.opening))groups.set(clip.opening,[]);groups.get(clip.opening).push(clip)}
 for(const [index,group] of groups){
  const opening=g.openings[index]||g.openings[0],centerY=opening.center[1]/100*size;
  ctx.save();
  ctx.beginPath();for(const clip of group)traceCapsule(ctx,size,clip);ctx.clip();
  ctx.beginPath();ctx.rect(0,centerY,size,size-centerY);ctx.clip();
  ctx.beginPath();ctx.rect(0,0,size,size);traceOpening(ctx,size,opening);ctx.clip('evenodd');
  ctx.drawImage(img,...vesselRect(g,size));
  ctx.restore();
 }
 return list.length;
}
/**
 * Stems that stand on a visible kenzan, or in its water, as drawn (stage cm): {front:[…], back:[…]} by side, each
 * {item, asset, base:[x,y], up:[ux,uy], width, holder (or null off the pins), opening, water, waterline:[x,y], ratio}.
 * The base and direction are measured from the sprite when `getSprite` is given (like seatClip); a stem must point upward
 * to stand in water; detached cut pieces never do. The waterline is KENZAN.water above the base, along the stem.
 */
export function kenzanSeats(s,assets,getSprite=null){
 const vessel=assets[s.vessel],out={front:[],back:[]},holders=kenzanHolders(vessel);if(!holders.length)return out;
 for(const item of s.items){
  const asset=assets[item.type];if(!asset||isDetachedPiece(item))continue;
  const foot=getSprite?stemFoot(item,asset,getSprite(item)):null,base=foot?[foot.x,foot.y]:[item.x,item.y];
  const seat=seatState({...item,x:base[0],y:base[1]},asset,vessel);if(!seat.seated)continue;
  const r=(item.angle||0)*Math.PI/180,n=Array.isArray(foot?.dir)&&foot.dir[1]<0?Math.hypot(...foot.dir):0;
  const up=n?[foot.dir[0]/n,foot.dir[1]/n]:[Math.sin(r),-Math.cos(r)];if(up[1]>-.25)continue;
  const holder=holders.find(h=>onHolder(h,base).on)||null,water=holders[0].water;if(!holder&&!water)continue;
  const width=foot?.width>0?Math.min(2.5,Math.max(.25,foot.width)):stemWidthCm(item,asset),rise=KENZAN.water/-up[1];
  out[item.aboveVessel?'front':'back'].push({item,asset,base,up,width,holder,opening:seat.opening,water,waterline:[base[0]+up[0]*rise,base[1]-KENZAN.water],ratio:(holder||holders[0]).ratio});
 }
 return out;
}
/**
 * Veil a seated stem's submerged part: the vessel and holder are laid at 40% over the stem's own pixels below its
 * waterline (within 0.6 cm of its axis), so it reads at 60% like the pins under water while its shadow and its
 * neighbours keep their tone. Without a canvas factory or sprite the whole capsule is veiled.
 */
function veilSubmerged(ctx,size,s,seat,assets,img,g,{night,getSprite,createCanvas}){
 const k=size/100,vessel=assets[s.vessel],radius=Math.min(.6,Math.max(.3,seat.width/2+.15)),capsule={base:seat.base,tip:seat.waterline,radius};
 const background=c=>{if(img)c.drawImage(img,...vesselRect(g,size));for(const holder of kenzanHolders(vessel))drawHolder(c,size,holder,{night,createCanvas})};
 ctx.save();
 ctx.beginPath();traceCapsule(ctx,size,capsule);ctx.clip();
 ctx.beginPath();ctx.rect(0,seat.waterline[1]*k,size,size);ctx.clip();
 ctx.globalAlpha=.4;
 const factory=createCanvas||(typeof document==='undefined'?null:browserCanvas);
 const x0=Math.floor((Math.min(seat.base[0],seat.waterline[0])-radius)*k),x1=Math.ceil((Math.max(seat.base[0],seat.waterline[0])+radius)*k);
 const y0=Math.floor(seat.waterline[1]*k),y1=Math.ceil((seat.base[1]+radius)*k);
 // Two small canvases: the stem alone, then the background composited into its pixels ('source-in' with a full-size
 // source, so every canvas implementation clears the same pixels).
 const w=x1-x0,h=y1-y0,mask=factory&&getSprite&&w>0&&h>0?factory(w,h):null,under=mask?factory(w,h):null;
 const mctx=mask?.getContext('2d'),uctx=under?.getContext('2d');
 if(mctx&&uctx){
  try{
   mctx.translate(-x0,-y0);drawBotanical(mctx,size,seat.item,seat.asset,getSprite,{createCanvas:factory});
   uctx.translate(-x0,-y0);background(uctx);
   mctx.setTransform(1,0,0,1,0,0);mctx.globalCompositeOperation='source-in';mctx.drawImage(under,0,0);
   ctx.drawImage(mask,x0,y0);
  }finally{release(mask);release(under)}
 }else{if(mask)release(mask);if(under)release(under);background(ctx)}
 ctx.restore();
}
/**
 * Where stems stand on a kenzan: drawn over the stems of one side (`front` after the stems in front, `back` after the
 * interior pass), each seat in its opening. In water, the stem's submerged part (below its waterline, within a capsule
 * round it) is veiled by the vessel and holder at 40%, leaving the stem at 60% like the pins under water; the pins in
 * front of the base, within 0.6 cm of it, are drawn again over the stem; and a meniscus rings the stem at the waterline.
 * `seats` reuses kenzanSeats(). Returns how many stems it touched.
 */
export function paintKenzanPass(ctx,size,s,assets,images,{seats=null,side='front',getSprite=null,createCanvas=null}={}){
 const vessel=assets[s.vessel],list=(seats||kenzanSeats(s,assets,getSprite))[side]||[];if(!vessel||!list.length)return 0;
 const g=vesselGeometry(vessel),k=size/100,night=isNightScene(s.scene),img=images?.[s.vessel],thin=size<360;
 for(const seat of list){
  const opening=g.openings[seat.opening]||g.openings[0];
  ctx.save();ctx.beginPath();traceOpening(ctx,size,opening);ctx.clip();
  if(seat.water)veilSubmerged(ctx,size,s,seat,assets,img,g,{night,getSprite,createCanvas});
  if(seat.holder){
   const at=onHolder(seat.holder,seat.base),front=kenzanPins(seat.holder).filter(p=>p.v>at.v+.02&&Math.abs(p.u-at.u)<1);
   ctx.save();ctx.beginPath();ctx.rect((seat.base[0]-.6)*k,0,1.2*k,size);ctx.clip();
   drawPins(ctx,seat.holder.center[0]*k,seat.holder.center[1]*k,seat.holder,k,holderPalette(seat.holder,night),front,thin);
   ctx.restore();
  }
  if(seat.water){
   // The meniscus: a short bright lip where the water meets the front of the stem.
   const [x,y]=seat.waterline,rx=(Math.min(seat.width,1.2)/2+.06)*k,ry=Math.max(.5,rx*seat.ratio);
   ctx.lineWidth=Math.max(.6,.03*k);ctx.lineCap='round';ctx.strokeStyle=night?'#cfe0da59':'#ffffff8c';
   ctx.beginPath();ctx.ellipse(x*k,y*k,rx,ry,0,.18*Math.PI,.82*Math.PI);ctx.stroke();
  }
  ctx.restore();
 }
 return list.length;
}
/**
 * Inserted stem ends and the support, in draft order. On a kenzan the holder comes first, then the stems behind the vessel
 * that stand on it, then the pins and water in front of their bases; elsewhere the stems' inserted ends, then the support
 * over them. The stage paints the same order by lifting #fixture-layer under #interior-layer on a kenzan.
 */
export function paintInsertedPass(ctx,size,s,assets,images,getSprite,{clips=null,seats=null,look=null,createCanvas=null}={}){
 const vessel=assets[s.vessel],night=isNightScene(s.scene);if(!vessel)return 0;
 if(!isKenzan(vessel)){const n=paintInteriorPass(ctx,size,s,assets,getSprite,{look,clips});paintFixture(ctx,size,vessel,{night,createCanvas});return n}
 paintFixture(ctx,size,vessel,{night,createCanvas});
 const n=paintInteriorPass(ctx,size,s,assets,getSprite,{look,clips});
 paintKenzanPass(ctx,size,s,assets,images,{seats,side:'back',getSprite,createCanvas});
 return n;
}
export function paintSceneFinish(ctx,size,s){
 const night=isNightScene(s.scene);
 const vignette=ctx.createRadialGradient(size*.5,size*.45,size*.42,size*.5,size*.48,size*.78);vignette.addColorStop(.55,'#00000000');vignette.addColorStop(1,night?'#05090628':'#26302410');ctx.fillStyle=vignette;ctx.fillRect(0,0,size,size);
}
/**
 * The arrangement's shape for the window light's shadow (B10), at frame size `size`: every botanical (no cast shadow) and
 * the vessel image. Only the alpha matters.
 */
export function paintLightSilhouette(ctx,size,s,assets,getSprite,images){
 for(const item of s.items){const a=assets[item.type];if(a)drawBotanical(ctx,size,item,a,getSprite)}
 const vessel=assets[s.vessel],img=images?.[s.vessel];if(vessel&&img)ctx.drawImage(img,...vesselRect(vesselGeometry(vessel),size));
}
/** The window light (ambience.js) over a painted background when `s.light` is set: room tone, then the window patch with
 the arrangement's shadow cut out of it. `{ambient, patch}` pick the parts: the draft paints the room tone under the ground
 shadows and the patch over them, as the stage does. Returns whether a light was painted. */
export function paintLightPass(ctx,size,s,assets,getSprite,images,createCanvas=browserCanvas,{ambient=true,patch=true}={}){
 if(['generated-atelier','generated-editorial'].includes(assets[s.vessel]?.source))return false;
 if(!lightOf(s.light))return false;
 return paintLight(ctx,size,s,{createCanvas,horizon:HORIZON,ambient,patch,paintSilhouette:(c,S)=>paintLightSilhouette(c,S,s,assets,getSprite,images)});
}
/** The whole draft, bottom to top: scene, window light (when set), ground shadows, stems behind, vessel, their inserted ends and the support (on a
 kenzan: holder, stems, pins and water in front of them), stems in front, pins and water over their bases, front rim, finish.
 `createCanvas` (node renders) lets the kenzan be cached like in the browser. */
export function paintArrangement(ctx,size,s,assets,scenes,getSprite,images,createCanvas=null){
 paintSceneBackground(ctx,size,s,scenes);
 const lit=!!lightOf(s.light);
 if(lit)paintLightPass(ctx,size,s,assets,getSprite,images,createCanvas||browserCanvas,{patch:false});
 paintGroundPass(ctx,size,s,assets,images);
 if(lit)paintLightPass(ctx,size,s,assets,getSprite,images,createCanvas||browserCanvas,{ambient:false});
 for(const item of s.items.filter(i=>!i.aboveVessel))paintBotanicalLayer(ctx,size,s,item,assets,getSprite);
 paintVesselLayer(ctx,size,s,assets,images,{ground:false,fixture:false});
 const seats=kenzanSeats(s,assets,getSprite);
 paintInsertedPass(ctx,size,s,assets,images,getSprite,{seats,createCanvas});
 for(const item of s.items.filter(i=>i.aboveVessel))paintBotanicalLayer(ctx,size,s,item,assets,getSprite);
 paintKenzanPass(ctx,size,s,assets,images,{seats,side:'front',getSprite,createCanvas});
 paintRimPass(ctx,size,s,assets,images,getSprite);
 paintSceneFinish(ctx,size,s);
}

/** The guide's muted look for botanicals: grayscale(.38) then saturate(.72), as one saturate(). */
const GUIDE_TONE=.62*.72;
/** Exact silhouette and layer map; it never invents a direction or endpoint. Stems behind the vessel are hidden by its
 silhouette (except where they enter the openings), so the faded vessel reads in front of them as in the draft. */
export function paintCompositionGuide(ctx,size,s,assets,scenes,getSprite,images,createCanvas=browserCanvas){
 const colors=scenes[s.scene],night=isNightScene(s.scene),bg=ctx.createLinearGradient(0,0,size,size);bg.addColorStop(0,colors[0]);bg.addColorStop(1,colors[1]);ctx.fillStyle=bg;ctx.fillRect(0,0,size,size);
 ctx.fillStyle=night?'#10171320':'#ffffff66';ctx.fillRect(0,0,size,size);ctx.fillStyle=night?'#17211c66':'#bfc2b744';ctx.fillRect(0,size*.8,size,size*.2);
 const vessel=images[s.vessel],rect=vesselRect(vesselGeometry(assets[s.vessel]),size),n=Math.max(1,s.items.length);
 const back=s.items.filter(i=>!i.aboveVessel),front=s.items.filter(i=>i.aboveVessel);
 const look=index=>({alpha:.24+index/n*.34,tone:GUIDE_TONE,createCanvas});
 if(back.length){
  const layer=createCanvas(size,size);
  try{
   const lctx=context2d(layer);back.forEach((item,index)=>drawBotanical(lctx,size,item,assets[item.type],getSprite,look(index)));
   if(vessel){lctx.globalCompositeOperation='destination-out';lctx.drawImage(vessel,...rect)}
   ctx.drawImage(layer,0,0);
  }finally{release(layer)}
 }
 if(vessel){ctx.save();ctx.globalAlpha=night?.34:.27;drawToned(ctx,vessel,.35,...rect,createCanvas);ctx.restore()}
 paintInteriorPass(ctx,size,s,assets,getSprite,{look:item=>look(back.indexOf(item))});
 front.forEach((item,index)=>drawBotanical(ctx,size,item,assets[item.type],getSprite,look(back.length+index)));
 paintFixture(ctx,size,assets[s.vessel],{guide:true,night});
 const insertion=vesselGeometry(assets[s.vessel]).insertion;ctx.save();ctx.fillStyle=night?'#dfe8d8aa':'#4f604d88';ctx.beginPath();ctx.arc(insertion[0]/100*size,insertion[1]/100*size,size*.006,0,Math.PI*2);ctx.fill();ctx.restore();
}
