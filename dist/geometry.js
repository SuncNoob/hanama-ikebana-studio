// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** A specimen's original pixels are its editing coordinates. Only its lower stem stretches. */
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const vesselBounds=asset=>{
  const height=asset.height, width=height*asset.width/asset.heightPx;
  return {height,width,left:(100-width)/2,top:86-height};
};
/** Vessel-local normalized coordinates -> square-stage percent coordinates. */
export function vesselLocalToStage(asset,point) {
  const {height,width,left,top}=vesselBounds(asset);
  return [left+point[0]*width,top+point[1]*height];
}
/** Percent-based vase bounds, openings and support geometry, shared by stage and export. */
export function vesselGeometry(asset) {
  const {height,width,left,top}=vesselBounds(asset),mouth=asset.mouth||[.5,.05];
  const sourceOpenings=asset.openings?.length?asset.openings:[{shape:'ellipse',center:mouth,radius:[.12,.025],frontRimY:mouth[1]+.035}];
  const openings=sourceOpenings.map((opening,index)=>({
    ...opening,index,localCenter:opening.center,
    center:[left+opening.center[0]*width,top+opening.center[1]*height],
    radius:[opening.radius[0]*width,opening.radius[1]*height],
    frontRimY:top+(opening.frontRimY??opening.center[1]+opening.radius[1])*height,
    rotation:opening.rotation||0
  }));
  let fixtureGeometry=null;
  if(asset.fixture){
    const primary=sourceOpenings.find(o=>o.primary)||sourceOpenings[0];
    const localCenters=asset.fixture.centers||[asset.fixture.center||primary.center];
    const localRadius=asset.fixture.radius||[primary.radius[0]*.34,primary.radius[1]*.45];
    fixtureGeometry={...asset.fixture,localCenters,centers:localCenters.map(p=>[left+p[0]*width,top+p[1]*height]),radius:[localRadius[0]*width,localRadius[1]*height],targets:asset.fixture.targets||[sourceOpenings.indexOf(primary)]};
  }
  // Keep the legacy insertion formula byte-for-byte equivalent for old drafts.
  const insertion=asset.insertion||[left+mouth[0]*width,top+mouth[1]*height+Math.min(1.8,height*.1)];
  return {height,width,left,top,insertion,openings,fixture:fixtureGeometry};
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
  const height=warpY(end, split, length);
  const pivotY=Number.isFinite(item.cropAnchorSourceY)?warpY(item.cropAnchorSourceY,split,length):(item.cropAnchorY??1)*height;
  return {split, length, end, height, ratio:asset.width / asset.heightPx, anchor:asset.anchor ?? .5, pivotY};
}
/** Source UV -> square stage UV, including clipping, length, pivot, mirror, rotation. */
export function sourceToStage(point, item, asset) {
  const g = dimensions(item, asset);
  const scale = item.h / 100;
  const dx = (point[0] - g.anchor) * g.ratio * scale * (item.flip ? -1 : 1);
  const dy = (warpY(point[1], g.split, g.length) - g.pivotY) * scale;
  const a = item.angle * Math.PI / 180;
  return [item.x/100 + dx*Math.cos(a)-dy*Math.sin(a), item.y/100 + dx*Math.sin(a)+dy*Math.cos(a)];
}
export function stageToSource(point, item, asset) {
  const g = dimensions(item, asset), scale=item.h/100;
  const dx = point[0]-item.x/100, dy=point[1]-item.y/100;
  const a=item.angle*Math.PI/180;
  const localX=(dx*Math.cos(a)+dy*Math.sin(a))*(item.flip?-1:1);
  const localY=-dx*Math.sin(a)+dy*Math.cos(a);
  return [localX/(scale*g.ratio)+g.anchor, unwarpY(localY/scale+g.pivotY,g.split,g.length)];
}
export function simplifyPoints(points, max=128) {
  const step=Math.max(1,(points.length-1)/(max-1));
  const result=[];
  for(let i=0;i<points.length-1;i+=step){const p=points[Math.floor(i)];result.push(p.map(n=>Math.round(clamp(n,-3,4)*10000)/10000));}
  if(points.length)result.push(points.at(-1).map(n=>Math.round(clamp(n,-3,4)*10000)/10000));
  return result;
}
