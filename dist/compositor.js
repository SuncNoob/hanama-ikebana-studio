import {dimensions,vesselGeometry} from './geometry.js';
const browserCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
/** Shared by the editor and exported artwork; cuts never mutate a source image. */
export function composeSpecimen(img,item,asset,extraCut=null,createCanvas=browserCanvas){
 const src=createCanvas(img.naturalWidth||img.width,img.naturalHeight||img.height),ctx=src.getContext('2d');
 ctx.drawImage(img,0,0);ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='#000';ctx.fillStyle='#000';ctx.lineCap='round';ctx.lineJoin='round';
 for(const cut of [...(item.cuts||[]),...(extraCut?[extraCut]:[])]){
  if(!cut.points.length)continue;ctx.beginPath();cut.points.forEach((p,k)=>ctx[k?'lineTo':'moveTo'](p[0]*src.width,p[1]*src.height));
  if(cut.kind==='lasso'){if(cut.points.length<3)continue;ctx.closePath();ctx.fill()}
  else {ctx.lineWidth=cut.radius*2*src.height;if(cut.points.length===1){const p=cut.points[0];ctx.arc(p[0]*src.width,p[1]*src.height,cut.radius*src.height,0,Math.PI*2);ctx.fill()}else ctx.stroke()}
 }
 const g=dimensions(item,asset),out=createCanvas(src.width,Math.max(1,Math.round(src.height*g.height))),dest=out.getContext('2d');
 const top=Math.min(g.split,g.end)*src.height;
 if(top>0)dest.drawImage(src,0,0,src.width,top,0,0,out.width,top);
 if(g.end>g.split){const sh=(g.end-g.split)*src.height;dest.drawImage(src,0,top,src.width,sh,0,top,out.width,sh*g.length)}
 return out;
}
export function paintArrangement(ctx,size,s,assets,scenes,getSprite,images){
 const colors=scenes[s.scene],night=s.scene==='night';
 const wall=ctx.createLinearGradient(0,0,size,size);wall.addColorStop(0,colors[0]);wall.addColorStop(.56,colors[0]);wall.addColorStop(1,colors[1]);ctx.fillStyle=wall;ctx.fillRect(0,0,size,size);
 const light=ctx.createRadialGradient(size*.18,size*.12,0,size*.23,size*.18,size*.72);light.addColorStop(0,night?'#dfe9dc18':'#ffffff78');light.addColorStop(.48,night?'#b6c8b512':'#ffffff24');light.addColorStop(1,'#ffffff00');ctx.fillStyle=light;ctx.fillRect(0,0,size,size);
 const horizon=size*.795,floor=ctx.createLinearGradient(0,horizon,0,size);floor.addColorStop(0,night?'#202b25':'#d8d8cf');floor.addColorStop(1,night?'#141c18':'#bfc1b7');ctx.fillStyle=floor;ctx.fillRect(0,horizon,size,size-horizon);ctx.fillStyle=night?'#0d130f22':'#72796d16';ctx.fillRect(0,horizon,size,Math.max(1,size*.002));
 for(const [index,item] of s.items.entries()){
  const src=getSprite(item),g=dimensions(item,assets[item.type]),h=item.h/100*size,w=h*g.ratio;
  ctx.save();ctx.translate(item.x/100*size,item.y/100*size);ctx.rotate(item.angle*Math.PI/180);ctx.scale(item.flip?-1:1,1);ctx.globalAlpha=.97;ctx.shadowColor=night?'#07100b55':'#30372d24';ctx.shadowBlur=size*.006;ctx.shadowOffsetX=size*.005;ctx.shadowOffsetY=size*.007;ctx.drawImage(src,-w*g.anchor,-h*g.height,w,h*g.height);ctx.restore();
 }
 const v=images[s.vessel],g=vesselGeometry(assets[s.vessel]);ctx.save();ctx.filter=`blur(${size*.013}px)`;ctx.fillStyle=night?'#07100b88':'#4a4e4638';ctx.beginPath();ctx.ellipse(size*.515,size*.867,size*g.width/180,size*.021,-.03,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.save();ctx.shadowColor=night?'#07100b88':'#34382f35';ctx.shadowBlur=size*.016;ctx.shadowOffsetX=size*.014;ctx.shadowOffsetY=size*.013;ctx.drawImage(v,g.left/100*size,g.top/100*size,g.width/100*size,g.height/100*size);ctx.restore();
 const vignette=ctx.createRadialGradient(size*.5,size*.45,size*.42,size*.5,size*.48,size*.78);vignette.addColorStop(.55,'#00000000');vignette.addColorStop(1,night?'#05090628':'#26302410');ctx.fillStyle=vignette;ctx.fillRect(0,0,size,size);
}

/** Exact silhouette and layer map; it never invents a direction or endpoint. */
export function paintCompositionGuide(ctx,size,s,assets,scenes,getSprite,images){
 const colors=scenes[s.scene],night=s.scene==='night',bg=ctx.createLinearGradient(0,0,size,size);bg.addColorStop(0,colors[0]);bg.addColorStop(1,colors[1]);ctx.fillStyle=bg;ctx.fillRect(0,0,size,size);
 ctx.fillStyle=night?'#10171320':'#ffffff66';ctx.fillRect(0,0,size,size);ctx.fillStyle=night?'#17211c66':'#bfc2b744';ctx.fillRect(0,size*.8,size,size*.2);
 const vessel=images[s.vessel],vg=vesselGeometry(assets[s.vessel]);ctx.save();ctx.globalAlpha=night?.34:.27;ctx.filter='grayscale(.65)';ctx.drawImage(vessel,vg.left/100*size,vg.top/100*size,vg.width/100*size,vg.height/100*size);ctx.restore();
 for(const [index,item] of s.items.entries()){
  const src=getSprite(item),g=dimensions(item,assets[item.type]),h=item.h/100*size,w=h*g.ratio;
  ctx.save();ctx.translate(item.x/100*size,item.y/100*size);ctx.rotate(item.angle*Math.PI/180);ctx.scale(item.flip?-1:1,1);ctx.globalAlpha=.24+index/Math.max(1,s.items.length)*.34;ctx.filter='grayscale(.38) saturate(.72)';ctx.drawImage(src,-w*g.anchor,-h*g.height,w,h*g.height);ctx.restore();
 }
 const insertion=vesselGeometry(assets[s.vessel]).insertion;ctx.save();ctx.fillStyle=night?'#dfe8d8aa':'#4f604d88';ctx.beginPath();ctx.arc(insertion[0]/100*size,insertion[1]/100*size,size*.006,0,Math.PI*2);ctx.fill();ctx.restore();
}
