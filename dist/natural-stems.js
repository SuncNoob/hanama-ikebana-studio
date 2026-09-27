/** Plan restrained extensions from visible cut ends. Endpoints keep their order, so nearby stems never cross. */
export function naturalStemRoutes(asset,roots,width,sourceHeight,bottom){
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
