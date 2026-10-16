// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {arrangementRecipe,immersionCm,recipeLines,recipeText,recipeLabel,RECIPE_TEXT,groupText,placeText,KENZAN_DIP} from '../dist/recipe.js?v=hn3';
import {isKenzan,crownPoint} from '../dist/scale.js?v=hn3';
import {vesselGeometry} from '../dist/geometry.js?v=restore1';
import {assetById,studies,studyState,initial} from './helpers/catalog.mjs';

const LANGS=['zh','en','ja'];
const CJK=/[぀-ヿ㐀-鿿豈-﫿]/;
/** Visible text: no-break spaces read as spaces. */
const plain=text=>String(text).replace(/ /g,' ');
const origins=items=>new Set(items.map(i=>i.originId||i.id)).size;
/** One study stem cut with the scissors: two pieces sharing its origin, the upper one moved in front of the rim. */
function scissorsSplit(s,index=0){
 const item=s.items[index];
 const pieces=[{...item,id:`${item.id}-a`,originId:item.id,pieceLabel:'A'},{...item,id:`${item.id}-b`,originId:item.id,pieceLabel:'B',aboveVessel:true}];
 return {...s,items:[...s.items.slice(0,index),...pieces,...s.items.slice(index+1)]};
}

test('every study: one seated row per bought stem, tallest crown first, cut lengths between 5 and 150 cm',()=>{
 for(const study of studies){
  const s=studyState(study,'en'),recipe=arrangementRecipe(s,assetById);
  assert.equal(recipe.rows.length,origins(s.items),study.id);
  assert.deepEqual(recipe.rows.map(row=>row.n),recipe.rows.map((_,i)=>i+1),study.id);
  for(let i=1;i<recipe.rows.length;i++)assert.ok(recipe.rows[i].crown[1]>=recipe.rows[i-1].crown[1],`${study.id}: rows sorted by crown height`);
  for(const row of recipe.rows){
   assert.ok(row.seated,`${study.id}: ${row.type} is not in the vessel`);
   assert.deepEqual(row.unseated,[]);
   assert.ok(Number.isInteger(row.cutCm)&&row.cutCm>=5&&row.cutCm<=150,`${study.id}: ${row.type} cut ${row.cutCm} cm`);
   assert.ok(row.cutCm>=row.tipAboveRimCm,`${study.id}: ${row.type} is cut shorter than it stands above the rim`);
   if(row.soldMaxCm!==null)assert.equal(row.tooLong,row.cutCm>row.soldMaxCm);
  }
  // The shopping list holds every bought stem once.
  assert.equal(recipe.groups.reduce((n,g)=>n+g.n,0),recipe.rows.length,study.id);
  assert.deepEqual(recipe.groups.flatMap(g=>g.rows).sort((p,q)=>p-q),recipe.rows.map(row=>row.n),study.id);
  assert.equal(recipe.vessel.asset.id,s.vessel);
 }
});

test('the part below the rim follows the support: kenzan pins, integrated openings, then necks, wire, grids and crossbars',()=>{
 for(const vessel of Object.values(assetById).filter(a=>a.fixture)){
  const h=vesselGeometry(vessel).height,dip=immersionCm(vessel),kind=vessel.fixture.kind;
  if(isKenzan(vessel))assert.equal(dip,KENZAN_DIP,vessel.id);
  else if(kind==='integrated-holes')assert.equal(dip,Math.min(6,h*.5),vessel.id);
  else{assert.ok(Math.abs(dip-Math.min(h-1,h*.4+5))<1e-9,vessel.id);assert.ok(dip<h,vessel.id)}
 }
 // A study on a kenzan adds only the pin depth to what is drawn.
 const iris=studyState(studies.find(st=>st.id==='iris'),'en');
 assert.ok(isKenzan(assetById[iris.vessel]));
 assert.equal(arrangementRecipe(iris,assetById).vessel.dipCm,KENZAN_DIP);
});

test('a stem cut into two pieces is bought once and noted as cut',()=>{
 const s=studyState(studies.find(st=>st.id==='peony-first'),'en'),before=arrangementRecipe(s,assetById),split=scissorsSplit(s,0),after=arrangementRecipe(split,assetById);
 assert.equal(after.rows.length,before.rows.length);
 assert.equal(after.groups.reduce((n,g)=>n+g.n,0),before.groups.reduce((n,g)=>n+g.n,0));
 const row=after.rows.find(r=>r.originId===s.items[0].id);
 assert.equal(row.pieces,2);assert.equal(row.front,true);
 const lines=recipeLines(after,'en').rows.find(r=>r.n===row.n);
 assert.ok(lines.notes.some(note=>plain(note)==='cut into 2 pieces'));
 assert.ok(lines.notes.includes(recipeLabel('front','en')));
});

test('Spring Garden is honest about muscari and narcissus: longer than they are sold, in all three languages',()=>{
 const s=studyState(studies.find(st=>st.id==='spring-garden'),'en'),recipe=arrangementRecipe(s,assetById);
 const long=recipe.rows.filter(row=>row.tooLong).map(row=>row.family).sort();
 assert.deepEqual(long,['muscari','narcissus']);
 const words={zh:'通常只卖到约',en:'Usually sold up to ≈',ja:'流通は約'};
 for(const lang of LANGS){
  const lines=recipeLines(recipe,lang);
  assert.equal(lines.rows.filter(row=>row.warn).length,2);
  for(const row of lines.rows.filter(r=>r.warn))assert.ok(row.warn.startsWith(words[lang]),row.warn);
 }
});

test('a stem out of the vessel is flagged with its item id so the dialog can put it back',()=>{
 const s=studyState(studies.find(st=>st.id==='tulip-lean'),'en'),item=s.items[0];
 const moved={...s,items:s.items.map(i=>i===item?{...i,x:8,y:20}:i)},recipe=arrangementRecipe(moved,assetById);
 const row=recipe.rows.find(r=>r.itemId===item.id);
 assert.equal(row.seated,false);assert.deepEqual(row.unseated,[item.id]);
 for(const lang of LANGS){
  const text=recipeText(recipe,lang);
  assert.ok(text.includes(recipeLabel('unseated',lang)),lang);
 }
});

test('words in all three languages: approximate figures, no Chinese in English, no Chinese-only wording in Japanese',()=>{
 for(const key of Object.keys(RECIPE_TEXT)){assert.equal(RECIPE_TEXT[key].length,3,key);for(const text of RECIPE_TEXT[key])assert.ok(text.trim(),key)}
 for(const study of studies){
  const s=studyState(study,'en'),recipe=arrangementRecipe(s,assetById);
  for(const lang of LANGS){
   const lines=recipeLines(recipe,lang,{title:s.title});
   for(const row of lines.rows){
    const cut=plain(row.cut),place=plain(row.place);
    assert.match(cut,lang==='en'?/^Cut ≈\d+ cm$/:lang==='ja'?/^約\d+ cmに切る$/:/^剪约 \d+ cm$/,`${study.id} ${lang} ${cut}`);
    assert.match(place,lang==='en'?/^(Head|Tip) ≈\d+ cm (above|below) the rim, /:lang==='ja'?/^(花は|枝先は)口(から|より)約\d+ cm[上下]、/:/^(花头|枝梢)(高出|低于)瓶口约 \d+ cm，/,`${study.id} ${lang} ${place}`);
   }
   const text=plain(recipeText(recipe,lang,{title:lang==='en'?study.title[1]:lang==='ja'?study.title[2]:study.title[0]}));
   assert.doesNotMatch(text,/\t|\|/,'pasted text needs no tabs or table bars');
   if(lang==='en')assert.doesNotMatch(text,CJK,`${study.id}: Chinese or Japanese in the English recipe`);
   if(lang==='ja')assert.doesNotMatch(text,/剪约|花头|瓶口|配方|准备|约 /,`${study.id}: Chinese wording in the Japanese recipe`);
   if(lang==='zh')assert.doesNotMatch(text,/[ぁ-ゟ゠-ヿ]/,`${study.id}: kana in the Chinese recipe`);
  }
 }
});

test('shopping lines count stems, bunches and leaves the way a florist does',()=>{
 const spring=arrangementRecipe(studyState(studies.find(st=>st.id==='spring-garden'),'en'),assetById);
 const muscari=spring.groups.find(g=>g.asset.family==='muscari');
 assert.equal(plain(groupText(muscari,'en')),'a bunch of muscari · blue (≈3 stems)');
 assert.match(plain(groupText(muscari,'zh')),/^葡萄风信子（.+）× 1 束（约 3 枝）$/);
 assert.match(plain(groupText(muscari,'ja')),/^ムスカリ（.+）× 1束（約3本）$/);
 const anemones=spring.groups.find(g=>g.asset.family==='anemone');
 assert.equal(anemones.n,2);assert.match(plain(groupText(anemones,'en')),/^2 anemones · /);
});

test('placement reads in plain words: centred within 2 cm, left and right by the crown',()=>{
 const asset=assetById['photo-ranunculus'];
 const row={asset,tipAboveRimCm:32,sideCm:-9};
 assert.equal(plain(placeText(row,'en')),'Head ≈32 cm above the rim, 9 cm left');
 assert.equal(plain(placeText(row,'zh')),'花头高出瓶口约 32 cm，偏左 9 cm');
 assert.equal(plain(placeText(row,'ja')),'花は口から約32 cm上、左へ9 cm');
 assert.equal(plain(placeText({...row,sideCm:1},'en')),'Head ≈32 cm above the rim, centred');
 assert.equal(plain(placeText({...row,tipAboveRimCm:-3,sideCm:4},'en')),'Head ≈3 cm below the rim, 4 cm right');
});

test('an empty canvas still makes a recipe: the vessel and a hint',()=>{
 const s={...initial(),items:[]},recipe=arrangementRecipe(s,assetById);
 assert.deepEqual(recipe.rows,[]);assert.deepEqual(recipe.groups,[]);
 for(const lang of LANGS)assert.ok(recipeText(recipe,lang).includes(recipeLabel('empty',lang)));
 assert.throws(()=>arrangementRecipe({...s,vessel:'no-such-vessel'},assetById));
});

test('the crown is what the height is measured to',()=>{
 const s=studyState(studies.find(st=>st.id==='pine'),'en'),recipe=arrangementRecipe(s,assetById);
 const g=vesselGeometry(assetById[s.vessel]),rim=(g.openings.find(o=>o.primary)||g.openings[0]).center[1];
 for(const row of recipe.rows){const item=s.items.find(i=>i.id===row.itemId);assert.equal(row.tipAboveRimCm,Math.round(rim-crownPoint(item,assetById[item.type])[1]))}
});

test('stems on a visible kenzan rise from the pins: none is told to cross in front of the rim',()=>{
 let kenzanRows=0;
 for(const study of studies){
  const s=studyState(study,'en');if(!isKenzan(assetById[s.vessel]))continue;
  const recipe=arrangementRecipe(s,assetById);
  for(const row of recipe.rows){kenzanRows++;assert.equal(row.front,false,`${study.id}: ${row.type}`)}
  for(const lang of LANGS)assert.ok(!recipeText(recipe,lang).includes(recipeLabel('front',lang)),`${study.id} ${lang}`);
 }
 assert.ok(kenzanRows>20,'the kenzan studies were checked');
 // A vessel with a neck still says so for a stem drawn in front of it.
 const peony=studyState(studies.find(st=>st.id==='peony-first'),'en');
 assert.ok(!isKenzan(assetById[peony.vessel]));
});
