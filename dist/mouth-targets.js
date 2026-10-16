// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import {vesselGeometry} from './geometry.js?v=soft2';
import {isKenzan,mouthSpan} from './scale.js?v=hn3';

/** Legal stem support spans in square-stage percent coordinates (Y points down).
 * Each opening keeps its own span; visible kenzan vessels use each actual holder.
 * The runtime projects onto a span, preserving a drop's horizontal position.
 */
export function mouthTargets(vessel){
 if(!vessel)return [];
 const g=vesselGeometry(vessel);
 const centers=isKenzan(vessel)&&g.fixture?.centers?.length?g.fixture.centers:g.openings.map(o=>o.center);
 return centers.map(([x])=>{
  const back=mouthSpan(vessel,x,.82),front=mouthSpan(vessel,x,.82,{front:true});
  return {left:back.lo,right:back.hi,y:back.y,frontY:front.y};
 });
}
