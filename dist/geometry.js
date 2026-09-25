/** A specimen's original pixels are its editing coordinates. Only its lower stem stretches. */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
/** Percent-based vase bounds, shared by the stage and export. */
export function vesselGeometry(asset) {
  const height=asset.height, width=height*asset.width/asset.heightPx;
  const left=(100-width)/2, top=86-height, mouth=asset.mouth||[.5,.05];
  return {height,width,left,top,insertion:asset.insertion||[left+mouth[0]*width,top+mouth[1]*height+Math.min(1.8,height*.1)]};
}
export function warpY(y, split = .5, length = 1) {
  return y <= split ? y : split + (y - split) * length;
}
export function unwarpY(y, split = .5, length = 1) {
  return y <= split ? y : split + (y - split) / length;
}
export function dimensions(item, asset) {
  const split = asset.split ?? .5;
  const length = item.length ?? 1;
  const end = 1 - item.trim / 100;
  return {split, length, end, height:warpY(end, split, length), ratio:asset.width / asset.heightPx, anchor:asset.anchor ?? .5};
}
/** Source UV -> square stage UV, including clipping, length, pivot, mirror, rotation. */
export function sourceToStage(point, item, asset) {
  const g = dimensions(item, asset);
  const scale = item.h / 100;
  const dx = (point[0] - g.anchor) * g.ratio * scale * (item.flip ? -1 : 1);
  const dy = (warpY(point[1], g.split, g.length) - g.height) * scale;
  const a = item.angle * Math.PI / 180;
  return [item.x/100 + dx*Math.cos(a)-dy*Math.sin(a), item.y/100 + dx*Math.sin(a)+dy*Math.cos(a)];
}
export function stageToSource(point, item, asset) {
  const g = dimensions(item, asset), scale=item.h/100;
  const dx = point[0]-item.x/100, dy=point[1]-item.y/100;
  const a=item.angle*Math.PI/180;
  const localX=(dx*Math.cos(a)+dy*Math.sin(a))*(item.flip?-1:1);
  const localY=-dx*Math.sin(a)+dy*Math.cos(a);
  return [localX/(scale*g.ratio)+g.anchor, unwarpY(localY/scale+g.height,g.split,g.length)];
}
export function simplifyPoints(points, max=128) {
  const step=Math.max(1,(points.length-1)/(max-1));
  const result=[];
  for(let i=0;i<points.length-1;i+=step){const p=points[Math.floor(i)];result.push(p.map(n=>Math.round(clamp(n,-3,4)*10000)/10000));}
  if(points.length)result.push(points.at(-1).map(n=>Math.round(clamp(n,-3,4)*10000)/10000));
  return result;
}
