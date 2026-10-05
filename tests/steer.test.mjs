// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** A11 (stems stay in the vessel: steer, seat cues, duplicate) and B3 (cut pieces pivot on their real cut end). */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assetById,vessels,studies,studyState,initial,makeItem,dist} from './helpers/catalog.mjs';
import {
 mouthBase,mouthSpan,slideBase,seatState,seatPoint,cutEnd,cutEndSource,anchorAt,pieceHead,reseatPiece,companionFit,
 tipPoint,isKenzan,isDetachedPiece
} from '../dist/scale.js?v=hn2';
import {vesselGeometry,dimensions,sourceToStage,warpY} from '../dist/geometry.js?v=28';

const near=(p,q,eps=1e-6)=>Math.hypot(p[0]-q[0],p[1]-q[1])<=eps;
const distance=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
const stage=(uv,item,a)=>sourceToStage(uv,item,a).map(v=>v*100);
const round=assetById.round;
/** A detached piece of a pine branch, cut at source UV `end` with a v2 frame recorded at `frame` (length/trim at cut time).
 Its pivot row is the cut end's, as the stage keeps a piece's pivot at its own visible bottom (stemStyle). */
function piece(end,{frame={split:assetById.pine.split,length:1,end:1},v=2,...options}={}){
 const a=assetById.pine,height=warpY(frame.end,frame.split,frame.length),anchor=[end[0],warpY(end[1],frame.split,frame.length)/height];
 return makeItem('pine',{x:50,y:60,angle:0,cropAnchorSourceY:end[1],localCuts:[{part:'detached',anchor,cut:{v,w:4,h:4,d:'',k:'',...(v===2?{frame}:{})}}],...options});
}

test('mouthBase is mouthSpan clamped, for every vessel; slideBase stays in the mouth and never jumps at the start of a drag',()=>{
 for(const v of vessels){
  for(const front of [false,true])for(const x of [-20,0,30,48,50,52.5,70,120,NaN]){
   const s=mouthSpan(v,x,.55,{front}),b=mouthBase(v,x,.55,{front});
   assert.deepEqual(b,[Math.min(s.hi,Math.max(s.lo,Number.isFinite(x)?x:s.center)),s.y],`${v.id} ${x}`);
  }
  const s=mouthSpan(v,vesselGeometry(v).insertion[0]);
  for(const x0 of [s.lo-.5,s.center,s.hi+.5]){
   const own=mouthSpan(v,x0);
   assert.equal(slideBase(v,x0,x0),x0,`${v.id}: no jump at ${x0}`);
   assert.ok(slideBase(v,x0,x0+30)<=Math.max(own.hi,x0)+1e-9&&slideBase(v,x0,x0-30)>=Math.min(own.lo,x0)-1e-9,`${v.id}: stays in the mouth`);
  }
  // A base outside the stretch can slide back in, but not further out.
  const out=s.hi+.5,own=mouthSpan(v,out);
  if(own.hi===s.hi){assert.equal(slideBase(v,out,out+3),out);assert.equal(slideBase(v,out,s.center),s.center)}
 }
});

test('cutEnd: a detached piece stands on the anchor of its last cut, in source coordinates that survive length changes',()=>{
 const a=assetById.pine,end=[.3,.8];
 const p=piece(end);
 assert.ok(isDetachedPiece(p));
 assert.ok(near(cutEndSource(p,a),end,1e-9));
 assert.ok(near(cutEnd(p,a),stage(end,p,a),1e-9));
 assert.ok(near(seatPoint(p,a),cutEnd(p,a)));
 // Lengthening after the cut: the v2 frame keeps the anchor on the same source pixel.
 const longer={...p,length:1.4};assert.ok(near(cutEndSource(longer,a),end,1e-9));
 // Cut on a longer stem (frame length 1.4): the stored frame, not the current length, decodes the anchor.
 const atCut=piece(end,{frame:{split:a.split,length:1.4,end:1},length:1});assert.ok(near(cutEndSource(atCut,a),end,1e-9));
 // v1 cuts carry no frame: their anchor follows the current length, as their mask does.
 const v1=piece(end,{v:1});const g=dimensions(v1,a);
 assert.ok(near(cutEndSource(v1,a),[end[0],end[1]],1e-9)&&g.length===1);
 // Not a piece, no anchor, no asset: no cut end; such items stand on (x, y).
 const stem=makeItem('pine',{x:40,y:62}),main=makeItem('pine',{localCuts:[{part:'main',anchor:[.5,.5],cut:{v:1}}]}),bare=makeItem('pine',{localCuts:[{part:'detached',cut:{}}]});
 for(const item of [stem,main,bare])assert.equal(cutEnd(item,a),null);
 assert.equal(cutEnd(p,null),null);assert.deepEqual(seatPoint(stem,a),[40,62]);
});

test('seatState measures a detached piece at its cut end (whatever its rotation) and everything else as before',()=>{
 const a=assetById.pine,mouth=mouthBase(round,50);
 const p=piece([.3,.6]);
 Object.assign(p,anchorAt(p,a,cutEndSource(p,a),mouth));
 assert.ok(near(cutEnd(p,a),mouth,1e-9),'anchorAt puts the cut end on the mouth');
 assert.ok(distance([p.x,p.y],mouth)>5,'the pivot itself is far from the mouth');
 assert.equal(seatState(p,a,round).seated,true);
 assert.equal(seatState({...p,...anchorAt({...p,angle:170},a,cutEndSource(p,a),mouth),angle:170},a,round).seated,true,'a piece is not judged by its rotation');
 const away={...p,...anchorAt(p,a,cutEndSource(p,a),[mouth[0]+20,mouth[1]-10])};
 assert.equal(seatState(away,a,round).seated,false);assert.ok(seatState(away,a,round).gap>5);
 // The same item without its cut is measured at its pivot.
 assert.equal(seatState({...p,localCuts:[]},a,round).seated,false);
});

test('pieceHead: the opaque mask point farthest from the cut end, with a faint-probe fallback',()=>{
 const a=assetById.pine,p=piece([.5,.9]),w=20,h=30,data=new Uint8Array(w*h);
 assert.equal(pieceHead(p,a,{w,h,data}),null,'an empty mask has no head');
 data[2*w+3]=200;data[25*w+10]=200;
 const g=dimensions(p,a),head=pieceHead(p,a,{w,h,data});
 assert.ok(near(head,[3.5/w,2.5/h*g.height],1e-9),'the top-left pixel is farthest from a cut end near the bottom');
 const faint=new Uint8Array(w*h);faint[1*w+1]=30;assert.ok(pieceHead(p,a,{w,h,data:faint}),'a faint piece still has a head');
 assert.equal(pieceHead(makeItem('pine'),a,{w,h,data}),null,'no cut end, no head');
});

test('reseatPiece: the cut end lands on the mouth and the piece points at where its head was (t6/t12 scenario)',()=>{
 const a=assetById.pine;
 for(const v of vessels){
  for(const [end,head,shift] of [[[.62,.38],[.95,.2],[12,8]],[[.4,.7],[.1,.15],[-9,14]],[[.5,.5],[.52,.05],[0,-10]]]){
   const p=piece(end,{aboveVessel:isKenzan(v)});Object.assign(p,{x:p.x+shift[0],y:p.y+shift[1]});
   const E0=cutEnd(p,a),H0=stage(head,p,a),fit=reseatPiece(p,a,v,head),placed={...p,...fit};
   const M=mouthBase(v,E0[0],.55,{front:!!p.aboveVessel}),E1=cutEnd(placed,a),H1=stage(head,placed,a);
   assert.ok(distance(E1,M)<=1,`${v.id}: cut end ${distance(E1,M).toFixed(2)} cm from the mouth`);
   assert.ok(seatState(placed,a,v).seated,`${v.id}: seated by its cut end`);
   const toward=Math.atan2(H0[1]-M[1],H0[0]-M[0]),points=Math.atan2(H1[1]-E1[1],H1[0]-E1[0]);
   assert.ok(Math.abs(Math.atan2(Math.sin(points-toward),Math.cos(points-toward)))<.01,`${v.id}: points at the old head`);
   // Rigid: the head moves by exactly the difference in reach.
   assert.ok(Math.abs(fit.miss-Math.abs(distance(H0,M)-distance(H0,E0)))<=.15,`${v.id}: honest miss`);
   assert.equal(placed.h,p.h);assert.equal(placed.length,p.length);
  }
 }
 // Without a head the piece only moves; without a cut end there is nothing to do.
 const p=piece([.5,.5]);const fit=reseatPiece(p,a,round,null);assert.equal(fit.angle,p.angle);assert.ok(distance(cutEnd({...p,...fit},a),mouthBase(round,cutEnd(p,a)[0]))<1e-6);
 assert.equal(reseatPiece(makeItem('pine'),a,round,[.5,.5]),null);
});

test('companionFit: a duplicate of any seated study stem stands in the vessel beside it, apart from the original and not upright past 75°',()=>{
 let checked=0;
 for(const s of [initial(),...studies.map(study=>studyState(study))]){
  const v=assetById[s.vessel];
  for(const item of s.items){
   const a=assetById[item.type];if(!seatState(item,a,v).seated)continue;
   for(const side of [1,-1])for(const toward of [1,-1]){
    const fit=companionFit(item,a,v,{side,toward}),copy={...item,...fit};checked++;
    assert.ok(seatState(copy,a,v).seated,`${s.id} ${item.type}: copy seated`);
    assert.ok(distance(tipPoint(copy,a),tipPoint(item,a))>=3,`${s.id} ${item.type}: copy visible beside the original`);
    assert.ok(Math.abs(fit.angle)<=Math.max(75,Math.abs(item.angle))+1e-9,`${s.id} ${item.type}: ${fit.angle}°`);
    assert.ok(Math.abs(copy.x-mouthBase(v,item.x+1.5*side,.55,{front:!!item.aboveVessel})[0])<1e-9);
   }
  }
 }
 assert.ok(checked>900);
 // A stem with cuts only turns: its length and trim stay, so the cuts keep their place.
 const s=initial(),item={...s.items[0],cuts:[{kind:'brush',points:[[.5,.5]],radius:.02}]},a=assetById[item.type];
 const fit=companionFit(item,a,assetById[s.vessel]);assert.deepEqual(Object.keys(fit).sort(),['angle','x','y']);
});

test('app.js: steer, seat cues, vessel switch and duplicate are wired, with zh/en/ja strings',()=>{
 const app=readFileSync(`${dist}app.js`,'utf8'),html=readFileSync(`${dist}index.html`,'utf8');
 // Steer: the angle every frame through stemStyle, a drawn stem's length in 0.5 cm steps at ≤12 Hz, the exact value on release.
 assert.match(app,/function steerTo\(d,e\)\{/);
 assert.match(app,/clamp\(d\.angle0\+d\.turn,-135,135\)/);
 assert.match(app,/const wait=1000\/12-/);
 assert.match(app,/Math\.round\(d\.stemCm\*2\)\/2/);
 assert.match(app,/if\(d\.mode==='steer'\)\{if\(d\.stemCm!==null\)\{item\.length=/);
 assert.match(app,/move=px<=\(e\.pointerType==='touch'\?24:12\)\|\|e\.altKey\|\|e\.shiftKey\|\|!seated/);
 // The vessel switch has one path and re-seats with remapSeated.
 assert.equal(app.match(/state\.vessel=type/g)?.length,1);
 assert.match(app,/function switchVessel\(type\)\{[\s\S]*?remapSeated\(state\.items,from,to,assetById\)/);
 for(const text of [
  "L('拖动花头转向，拖根部圆点移动','Drag the flower to swing it; drag the base dot to move','花を引いて向きを変え、根元の点で移動')",
  "L('已在花器中','Already in the vessel','すでに花器に入っています')",
  "L('够不到原来的位置，已插回并保持方向','Too short to reach that spot — inserted, direction kept','届かないため、向きを保って挿し直しました')",
  "L('枝梗离开了花器口','The stem left the vessel','茎が花器から外れました')",
  "label:L('插回花器','Put back','挿し直す')",
  "L(`${n} 枝没有插进花器`,`${n} stem${n>1?'s':''} not in the vessel`,`${n}本が花器に入っていません`)",
  "L(' · 成组花材底部较宽，窄口瓶里可能露在瓶外',' · Grouped stems spread wider than this neck',' · 束の根元が口より広がります')"
 ])assert.ok(app.includes(text),text);
 assert.match(html,/<div id="seat-marks" class="seat-marks" aria-hidden="true">/);
 assert.match(html,/id="seat-all"[^>]*data-zh="全部插回" data-en="Seat all" data-ja="すべて挿し直す"/);
 assert.match(html,/id="seat-banner-close"[^>]*data-aria-zh="关闭提示" data-aria-en="Dismiss" data-aria-ja="閉じる"/);
 const stageLabel=html.match(/<div class="stage" id="stage"[^>]*>/)[0];
 for(const lang of ['zh','en','ja'])assert.match(stageLabel,new RegExp(`data-aria-${lang}="[^"]*(拖动花头转向|drag the flower to swing it|花を引いて向きを変え)`));
});
