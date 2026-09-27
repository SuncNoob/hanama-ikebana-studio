import assert from 'node:assert/strict';
import test from 'node:test';
import {decodeCutMask,encodeCutMask,splitAlphaMask} from '../dist/local-cut.js';

const specimen=(w,h)=>{
 const alpha=new Uint8Array(w*h);
 const rect=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)alpha[y*w+x]=255};
 return {alpha,rect,at:(x,y)=>y*w+x};
};

test('a leaf cut creates two independent masks without touching a neighboring specimen',()=>{
 const w=100,h=80,{alpha,rect,at}=specimen(w,h);
 rect(30,10,33,70);rect(33,30,52,40);rect(75,25,90,38);
 const result=splitAlphaMask(alpha,w,h,[36,25],[36,45]);
 assert.equal(result.ok,true);
 const detached=decodeCutMask(result.cut.d,w*h),kerf=decodeCutMask(result.cut.k,w*h);
 assert.equal(detached[at(48,35)],1);
 assert.equal(detached[at(31,60)],0);
 assert.equal(detached[at(80,30)],0);
 assert.equal(kerf[at(36,35)],1);
 assert.equal(kerf[at(80,30)],0);
 for(let p=0;p<alpha.length;p++)if(alpha[p]){
  const main=!detached[p]&&!kerf[p],piece=!!detached[p]&&!kerf[p];
  assert.equal(Number(main)+Number(piece),kerf[p]?0:1);
 }
 assert.equal(encodeCutMask(detached),result.cut.d);
});

test('a long gesture crossing two attached leaves cuts only the local run closest to its middle',()=>{
 const w=130,h=90,{alpha,rect,at}=specimen(w,h);
 rect(10,10,13,80);rect(13,20,42,27);rect(13,50,42,57);
 const result=splitAlphaMask(alpha,w,h,[19,10],[19,72]);
 assert.equal(result.ok,true);
 const detached=decodeCutMask(result.cut.d,w*h),kerf=decodeCutMask(result.cut.k,w*h);
 assert.equal(detached[at(30,53)],1);
 assert.equal(detached[at(30,24)],0);
 assert.equal(kerf[at(19,53)],1);
 assert.equal(kerf[at(19,24)],0);
});

test('a stroke that misses or fails to sever material leaves the original intact',()=>{
 const w=80,h=80,{alpha,rect}=specimen(w,h);
 rect(30,15,35,70);
 assert.equal(splitAlphaMask(alpha,w,h,[2,2],[18,18]).reason,'miss');
 assert.equal(splitAlphaMask(alpha,w,h,[25,30],[32,30]).reason,'not-separated');
});

test('a second cut keeps the proximal side of an already detached branch',()=>{
 const w=90,h=70,{alpha,rect,at}=specimen(w,h);
 rect(10,8,13,65);rect(13,25,75,31);
 const first=splitAlphaMask(alpha,w,h,[23,20],[23,36]);
 assert.equal(first.ok,true);
 const firstPiece=decodeCutMask(first.cut.d,w*h),firstKerf=decodeCutMask(first.cut.k,w*h);
 const alpha2=alpha.map((value,p)=>firstPiece[p]&&!firstKerf[p]?value:0);
 const anchor=first.anchors.detached;
 const second=splitAlphaMask(alpha2,w,h,[48,20],[48,36],{rootPoint:[anchor[0]*w,anchor[1]*h]});
 assert.equal(second.ok,true);
 const distal=decodeCutMask(second.cut.d,w*h);
 assert.equal(distal[at(65,28)],1);
 assert.equal(distal[at(35,28)],0);
});
