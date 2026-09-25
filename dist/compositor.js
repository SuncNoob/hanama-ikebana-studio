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

function traceOpening(ctx,size,opening){
 const x=opening.center[0]/100*size,y=opening.center[1]/100*size,rx=Math.max(1,opening.radius[0]/100*size),ry=Math.max(1,opening.radius[1]/100*size);
 if(opening.shape==='rect')ctx.rect(x-rx,y-ry,rx*2,ry*2);
 else ctx.ellipse(x,y,rx,ry,opening.rotation||0,0,Math.PI*2);
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
/** Draw only support mechanics intended to remain visible in the finished work. */
export function paintFixture(ctx,size,asset,{guide=false,night=false}={}){
 if(!asset?.fixture||asset.fixture.visibility==='hidden')return;
 const geometry=vesselGeometry(asset),fixture=geometry.fixture;
 if(!fixture||!['visible','partial','subtle'].includes(fixture.visibility))return;
 const targets=(fixture.targets||[0]).map(index=>geometry.openings[index]).filter(Boolean);
 if(!targets.length)return;
 ctx.save();ctx.beginPath();for(const opening of targets)traceOpening(ctx,size,opening);ctx.clip();
 ctx.globalAlpha=(guide ? .5 : fixture.visibility==='visible' ? .74 : fixture.visibility==='partial' ? .5 : .3)*(night ? .82 : 1);
 for(const center of fixture.centers){
  if(fixture.kind==='kenzan'||fixture.kind==='pin-frog-wire')drawKenzan(ctx,size,center,fixture.radius,fixture,{guide,night});
  if(fixture.kind==='chicken-wire'||fixture.kind==='wire-grid'||fixture.kind==='pin-frog-wire')drawWire(ctx,size,center,fixture.radius,{guide,night});
 }
 ctx.restore();
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
 paintFixture(ctx,size,assets[s.vessel],{night});
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
 paintFixture(ctx,size,assets[s.vessel],{guide:true,night});
 const insertion=vesselGeometry(assets[s.vessel]).insertion;ctx.save();ctx.fillStyle=night?'#dfe8d8aa':'#4f604d88';ctx.beginPath();ctx.arc(insertion[0]/100*size,insertion[1]/100*size,size*.006,0,Math.PI*2);ctx.fill();ctx.restore();
}
