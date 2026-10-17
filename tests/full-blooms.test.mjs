import test from 'node:test';
import assert from 'node:assert/strict';
import {fullBloomSpecimens} from '../dist/full-bloom-catalog.js';
import {assetById,makeItem} from './helpers/catalog.mjs';
import {matchesMaterialColor} from '../dist/material-colors.js';
import {stemStretchSplit} from '../dist/stem-length.js';
import {warpY} from '../dist/geometry.js';
import {planSlot,seatState} from '../dist/scale.js?v=scale4';

test('full hydrangeas offer four distinct colors; white-pink lilies occur under both filters',()=>{
 const hyd=fullBloomSpecimens.filter(a=>a.family==='hydrangea');assert.equal(hyd.length,4);
 for(const color of ['white','pink','purple','blue','green'])assert.ok(hyd.some(a=>matchesMaterialColor(a,color)),color);
 const white=assetById['lily-white-open'],pink=assetById['lily-white-pink-open'];
 assert.ok(matchesMaterialColor(white,'white'));assert.ok(matchesMaterialColor(pink,'white'));assert.ok(matchesMaterialColor(pink,'pink'));
 assert.ok(assetById['photo-hydrangea']&&assetById['photo-lily']&&assetById['pose-lily-alternate']);
});
test('new full flowers keep their heads fixed when stem length changes, and seat at the vessel mouth',()=>{
 for(const a of fullBloomSpecimens){
  const item=makeItem(a.id),split=stemStretchSplit(item,a);assert.ok(split>a.bendLimit-.001&&split>a.tip[1]);
  assert.equal(warpY(a.tip[1],split,.6),warpY(a.tip[1],split,2.4));
  const s={vessel:'editorial-aubergine',items:[]},plan=planSlot(s,a,assetById);
  assert.ok(plan.fit&&Number.isFinite(plan.fit.x)&&Number.isFinite(plan.fit.y));
  assert.ok(seatState({...item,...plan.fit},a,assetById[s.vessel]).seated);
 }
});
