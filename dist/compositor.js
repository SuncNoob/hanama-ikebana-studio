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
 const colors=scenes[s.scene],grad=ctx.createRadialGradient(size*.28,size*.22,0,size*.4,size*.4,size*.8);grad.addColorStop(0,colors[0]);grad.addColorStop(1,colors[1]);ctx.fillStyle=grad;ctx.fillRect(0,0,size,size);ctx.fillStyle=s.scene==='night'?'#11191018':'#aaa69312';ctx.fillRect(0,size*.8,size,size*.2);
 for(const item of s.items){const src=getSprite(item),g=dimensions(item,assets[item.type]),h=item.h/100*size,w=h*g.ratio;ctx.save();ctx.translate(item.x/100*size,item.y/100*size);ctx.rotate(item.angle*Math.PI/180);ctx.scale(item.flip?-1:1,1);ctx.drawImage(src,-w*g.anchor,-h*g.height,w,h*g.height);ctx.restore()}
 const v=images[s.vessel],g=vesselGeometry(assets[s.vessel]);ctx.save();ctx.shadowColor='#37312225';ctx.shadowBlur=size*.014;ctx.shadowOffsetX=size*.012;ctx.shadowOffsetY=size*.014;ctx.drawImage(v,g.left/100*size,g.top/100*size,g.width/100*size,g.height/100*size);ctx.restore();
}
