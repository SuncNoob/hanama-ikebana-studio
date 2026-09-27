import assert from 'node:assert/strict';
import test from 'node:test';
import {decodeCutMask,encodeCutMask,splitAlphaMask,splitBotanicalMask} from '../dist/local-cut.js';

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

test('a fine side twig can be separated from a much larger trunk',()=>{
 for(const thickness of [1,2]){
  const w=300,h=200,{alpha,rect,at}=specimen(w,h);
  rect(25,15,125,180);
  rect(126,70,145,70+thickness-1);
  rect(225,50,236,72); // Another specimen must remain untouched.
  const result=splitAlphaMask(alpha,w,h,[136,65],[136,76]);
  assert.equal(result.ok,true,`thickness ${thickness}: ${result.reason}`);
  const detached=decodeCutMask(result.cut.d,w*h),kerf=decodeCutMask(result.cut.k,w*h);
  assert.equal(detached[at(143,70)],1);
  assert.equal(detached[at(70,70)],0);
  assert.equal(detached[at(230,60)],0);
  assert.equal(kerf[at(230,60)],0);
 }
});

test('a short deliberate stroke across a thin twig is enough to split its tip',()=>{
 const w=80,h=80,{alpha,rect,at}=specimen(w,h);
 rect(10,10,13,70);rect(14,30,43,30);
 const result=splitAlphaMask(alpha,w,h,[25,27],[25,33]);
 assert.equal(result.ok,true,result.reason);
 const detached=decodeCutMask(result.cut.d,w*h),kerf=decodeCutMask(result.cut.k,w*h);
 assert.equal(detached[at(38,30)],1);
 assert.equal(detached[at(11,50)],0);
 assert.equal(kerf[at(25,30)],1);
});

test('preferStart cuts the first crossed twig instead of a later main trunk',()=>{
 const w=120,h=110,{alpha,rect,at}=specimen(w,h);
 rect(20,10,24,100);rect(25,40,80,42);rect(25,74,55,76);
 const result=splitAlphaMask(alpha,w,h,[60,35],[0,70],{preferStart:true});
 assert.equal(result.ok,true,result.reason);
 const detached=decodeCutMask(result.cut.d,w*h),kerf=decodeCutMask(result.cut.k,w*h);
 assert.equal(detached[at(70,41)],1);
 assert.equal(detached[at(22,20)],0);
 assert.equal(detached[at(45,75)],0);
 assert.equal(kerf[at(22,56)],0);
});

test('a woody branch can be cut when fine green needles bridge around the cut',()=>{
 const w=110,h=100,rgba=new Uint8ClampedArray(w*h*4),at=(x,y)=>y*w+x;
 const paint=(x0,y0,x1,y1,[red,green,blue])=>{
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)rgba.set([red,green,blue,255],at(x,y)*4);
 };
 const wood=[96,63,38],needle=[58,114,69];
 paint(25,10,28,90,wood); // Rooted main stem.
 paint(29,30,78,32,wood); // Branch to be detached.
 paint(29,69,59,71,wood); // Unrelated lower branch.
 paint(34,22,35,30,needle);
 paint(34,22,52,23,needle);
 paint(51,22,52,30,needle); // Green bridge bypasses the intended woody cut.
 for(let x=54;x<=86;x+=2)paint(x,12,x,29,needle); // A small spray of thin green needles.
 const alpha=Uint8Array.from({length:w*h},(_,p)=>rgba[p*4+3]);
 const a=[40,39],b=[40,18];
 assert.equal(splitAlphaMask(alpha,w,h,a,b,{preferStart:true}).reason,'not-separated');

 const result=splitBotanicalMask(rgba,w,h,a,b,{preferStart:true,woodyFallback:true});
 assert.equal(result.ok,true,result.reason);
 const detached=decodeCutMask(result.cut.d,w*h),kerf=decodeCutMask(result.cut.k,w*h);
 assert.equal(detached[at(70,31)],1);
 assert.equal(detached[at(26,75)],0);
 assert.equal(detached[at(55,70)],0);
 assert.equal(kerf[at(55,70)],0);
});
