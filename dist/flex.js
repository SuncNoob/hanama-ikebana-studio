// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** Eight absolute stem directions, in radians from local +Y. Units are chosen by the caller. */
export const FLEX_SEGMENTS=8;
export const FLEX_MAX_ANGLE=1.1;
const limit=n=>Math.max(-FLEX_MAX_ANGLE,Math.min(FLEX_MAX_ANGLE,Number.isFinite(n)?n:0));
export function normalizeFlex(value){return Array.isArray(value)&&value.length?Array.from({length:FLEX_SEGMENTS},(_,i)=>limit(value[i])):[]}
export function hasFlex(value){return Array.isArray(value)&&value.some(n=>Number.isFinite(n)&&Math.abs(n)>1e-8)}
/** Fixed-length forward kinematics. The uncropped source-to-pivot distance defines its extent. */
export function createFlexChain(value,extent){
 const angles=normalizeFlex(value),height=Math.max(0,Number.isFinite(extent)?extent:0),length=height/FLEX_SEGMENTS;
 const points=[[0,0]],directions=[];
 for(let i=0;i<FLEX_SEGMENTS;i++){
  const a=angles[i]||0,d=[Math.sin(a),Math.cos(a)],p=points[i];directions.push(d);points.push([p[0]+d[0]*length,p[1]+d[1]*length]);
 }
 return {angles,extent:height,length,points,directions,active:height>1e-10&&hasFlex(angles)};
}
/** A photograph point in local X / upward Y. The inserted part below its root stays rigid. */
export function bendPoint(point,chain){
 const [x,y]=point;if(!chain.active||y<=0)return [x,y];
 const i=Math.min(FLEX_SEGMENTS-1,Math.floor(y/chain.length)),p=chain.points[i],d=chain.directions[i],along=y-i*chain.length;
 return [p[0]+d[0]*along+d[1]*x,p[1]+d[1]*along-d[0]*x];
}
/**
 * Invert against the nearest valid centre-line segment (and its rigid tip extension).
 * Wide photographic cards can overlap at a bent joint; nearest centre-line wins in that overlap.
 */
export function unbendPoint(point,chain){
 if(!chain.active||point[1]<=0)return [...point];
 let best=null,bestError=Infinity,bestDistance=Infinity;
 const consider=(candidate,distance)=>{
  const q=bendPoint(candidate,chain),error=Math.hypot(q[0]-point[0],q[1]-point[1]);
  if(error<bestError-1e-9||(Math.abs(error-bestError)<=1e-9&&distance<bestDistance)){best=candidate;bestError=error;bestDistance=distance}
 };
 for(let i=0;i<FLEX_SEGMENTS;i++){
  const p=chain.points[i],d=chain.directions[i],dx=point[0]-p[0],dy=point[1]-p[1];
  const projected=dx*d[0]+dy*d[1],along=Math.max(0,i===FLEX_SEGMENTS-1?projected:Math.min(chain.length,projected));
  const x=dx*d[1]-dy*d[0],y=i*chain.length+along;
  consider([x,y],Math.hypot(dx-d[0]*along,dy-d[1]*along));
 }
 return best||[...point];
}
/** Shared 4 × 16 native/export mesh, in photograph-down coordinates around the same root. */
export function flexGrid({left,top,width,height},chain,columns=4,rows=16){
 const vertices=[],triangles=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
  const uv=[x/columns,y/rows],p=bendPoint([left+uv[0]*width,-top-uv[1]*height],chain);
  vertices.push({uv,point:[p[0],-p[1]]});
  if(x<columns&&y<rows){const i=y*(columns+1)+x;triangles.push([i,i+columns+1,i+1],[i+columns+1,i+columns+2,i+1])}
 }
 return {vertices,triangles};
}
