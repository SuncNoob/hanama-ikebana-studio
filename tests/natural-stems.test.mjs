// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import assert from 'node:assert/strict';
import test from 'node:test';
import {naturalStemRoutes} from '../dist/natural-stems.js';

const asset={anchor:.5,height:12,group:'bloom'};

test('several visible cut ends keep their order and taper toward the vase',()=>{
 const routes=naturalStemRoutes(asset,[
  {x:160,y:300,width:24,startCm:.6,endCm:.5,color:'#63804b'},
  {x:55,y:315,width:18,startCm:.5,endCm:.4,color:'#698452'},
  {x:105,y:305,width:20,startCm:.6,endCm:.4,color:'#5d7844'}
 ],220,400,1000);
 assert.deepEqual(routes.map(route=>route.p0[0]),[55,105,160]);
 for(const key of ['p0','p1','p2','p3'])for(let index=1;index<routes.length;index++)assert.ok(routes[index-1][key][0]<routes[index][key][0],`${key} crosses its neighbor`);
 for(const route of routes){assert.ok(route.w1<route.w0);assert.ok(route.p0[1]<route.p1[1]&&route.p1[1]<route.p2[1]&&route.p2[1]<route.p3[1]);assert.ok(Math.abs(route.p1[0]-route.p0[0])>0.01)}
});

test('fine cosmos stems remain fine even with an oversized catalogue width',()=>{
 const [route]=naturalStemRoutes({...asset,family:'cosmos'},[{x:65,y:170,width:90,startCm:1.2,endCm:.9,color:'#66794a'}],150,300,850);
 assert.ok(route.w0<=.24*300/12+.001);
 assert.ok(route.w1<=.24*.86*300/12+.001);
});
