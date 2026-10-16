// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {setStemLength,stemLengthRatio,stemStretchSplit,normalizeStemSplit} from '../dist/stem-length.js';
import {atelierSpecimens} from '../dist/editorial-catalog.js';
import {initial,assetById} from './helpers/catalog.mjs';
import {warpY} from '../dist/geometry.js';

test('a new editorial draft reads 100% without changing old saved geometry',()=>{
 const draft=initial(),snapshot=JSON.stringify(draft);
 for(const item of draft.items){assert.equal(stemLengthRatio(item,assetById[item.type]),1);assert.equal(Object.hasOwn(item,'stemSplit'),false)}
 assert.equal(JSON.stringify(draft),snapshot);
});
test('every new photograph has a lower stem band with the flower focus protected',()=>{
 for(const a of atelierSpecimens){
  const item={trim:6,cropAnchorSourceY:.94,length:.9},split=stemStretchSplit(item,a);
  assert.ok(split!==null&&split>a.tip[1]&&split>=a.bendLimit,a.id);
  assert.ok(.94-split>=.035,a.id);
  assert.equal(warpY(a.tip[1],split,.6),warpY(a.tip[1],split,2.4),`${a.id}: flower is never stretched`);
 }
});
test('shortening and lengthening change stem reach by centimetres while retaining a fixed source root',()=>{
 for(const item of initial().items){
  const a=assetById[item.type],before=structuredClone(item);
  assert.equal(setStemLength(item,a,1.5),true);const split=item.stemSplit,end=1-item.trim/100;
  const long=(warpY(end,split,item.length)-warpY(a.tip[1],split,item.length))*item.h;
  assert.equal(setStemLength(item,a,.6),true);
  const short=(warpY(end,split,item.length)-warpY(a.tip[1],split,item.length))*item.h;
  assert.ok(long-short>4,`${a.id}: needs a visible stem length change`);
  assert.deepEqual([item.x,item.y,item.h,item.angle,item.trim],[before.x,before.y,before.h,before.angle,before.trim]);
  const reopened=JSON.parse(JSON.stringify(item));assert.equal(stemLengthRatio(reopened,a),.6);assert.equal(normalizeStemSplit(reopened.stemSplit,reopened,a),split);
 }
});
test('malformed splits and an already clipped-away stem cannot stretch a flower head',()=>{
 const a=atelierSpecimens.find(a=>a.family==='rose');
 assert.equal(normalizeStemSplit(NaN,{trim:6},a),null);assert.equal(normalizeStemSplit(.99,{trim:6},a),null);
 assert.equal(stemStretchSplit({trim:60},a),null);
 assert.equal(setStemLength({trim:6},{source:'flower-book-photo'},1.5),false);
});
