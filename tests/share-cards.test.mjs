// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {paintRecipeCard,wrapText,fitText,recipeFrame,cardFonts,CARD_FONTS} from '../dist/share-cards.js?v=hn3';
import {arrangementRecipe,recipeLines} from '../dist/recipe.js?v=hn3';
import {assetById,studies,studyState} from './helpers/catalog.mjs';

const CJK=/[　-ヿ㐀-鿿＀-￯]/u;
/** A 2D context that records text and measures it like a proportional font: CJK one em, everything else 0.55 em. */
function recorder(){
 const texts=[],images=[];let font='10px sans-serif',align='left';
 const size=()=>Number(font.match(/(\d+(?:\.\d+)?)px/)?.[1]||10);
 const measure=text=>[...String(text)].reduce((w,ch)=>w+(CJK.test(ch)?1:.55)*size(),0);
 return {texts,images,
  get font(){return font},set font(v){font=v},get textAlign(){return align},set textAlign(v){align=v},
  textBaseline:'alphabetic',fillStyle:'',strokeStyle:'',lineWidth:1,globalAlpha:1,
  save(){},restore(){},fillRect(){},strokeRect(){},beginPath(){},arc(){},fill(){},stroke(){},moveTo(){},lineTo(){},
  drawImage(...args){images.push(args)},
  measureText:text=>({width:measure(text)}),
  fillText(text,x,y){const w=measure(text);texts.push({text:String(text),x,y,w,align,left:align==='center'?x-w/2:x})}
 };
}
const W=1080,H=1350,art={width:1600,height:1600};

test('wrapText breaks Latin at spaces, CJK anywhere, keeps no-break spaces and closing punctuation with their words',()=>{
 const ctx=recorder();ctx.font='10px sans';
 const latin=wrapText(ctx,'Head ≈32 cm above the rim, 9 cm left',60);
 for(const line of latin)assert.ok(ctx.measureText(line).width<=60,line);
 assert.ok(latin.some(line=>line.includes('≈32 cm')),'"≈32 cm" stays whole');
 assert.ok(!latin.some(line=>/^\s|\s$/.test(line.replace(/ /g,'x'))),'no line starts or ends with a space');
 const cjk=wrapText(ctx,'花头高出瓶口约 37 cm，偏右 18 cm',40);
 for(const line of cjk)assert.ok(ctx.measureText(line).width<=40||line.length===1,line);
 assert.ok(!cjk.some(line=>/^[，。、]/.test(line)),'no line starts with closing punctuation');
 assert.equal(cjk.join('').replace(/\s/g,''),'花头高出瓶口约37 cm，偏右18 cm'.replace(/\s/g,''));
 assert.equal(fitText(ctx,'short',100),'short');
 assert.ok(fitText(ctx,'a very long title that cannot fit',60).endsWith('…'));
});

test('the frame holds every crown and the vessel',()=>{
 for(const study of studies){
  const recipe=arrangementRecipe(studyState(study,'en'),assetById),f=recipeFrame(recipe);
  assert.ok(f.side>=40&&f.side<=100&&f.sx>=0&&f.sy>=0&&f.sx+f.side<=100.0001&&f.sy+f.side<=100.0001,study.id);
  for(const row of recipe.rows)assert.ok(row.crown[0]>=f.sx-1e-6&&row.crown[0]<=f.sx+f.side+1e-6&&row.crown[1]>=f.sy-1e-6&&row.crown[1]<=f.sy+f.side+1e-6,`${study.id}: crown ${row.n} outside the picture`);
 }
});

test('every study card fits in all three languages: nothing clipped, every text inside the card, every stem numbered twice',()=>{
 for(const study of studies)for(const lang of ['zh','en','ja']){
  const s=studyState(study,lang),recipe=arrangementRecipe(s,assetById),lines=recipeLines(recipe,lang,{title:s.title});
  const ctx=recorder(),layout=paintRecipeCard(ctx,W,H,art,recipe,{...lines,subtitle:'after「Wind Through the Courtyard」',kicker:'HANAMA · RECIPE'},cardFonts(lang));
  assert.equal(layout.clipped,false,`${study.id} ${lang}`);
  assert.ok(layout.size>=Math.round(18*W/1080),`${study.id} ${lang}: step text ${layout.size}px`);
  for(const t of ctx.texts){
   assert.ok(t.left>=0&&t.left+t.w<=W+.5,`${study.id} ${lang}: "${t.text}" runs off the card (${Math.round(t.left)}–${Math.round(t.left+t.w)})`);
   assert.ok(t.y>0&&t.y<=H,`${study.id} ${lang}: "${t.text}" below the card`);
  }
  for(const row of recipe.rows)assert.ok(ctx.texts.filter(t=>t.text===String(row.n)).length>=2,`${study.id} ${lang}: stem ${row.n} needs a marker and a step`);
  assert.equal(ctx.images.length,1);
  const [,sx,sy,sw]=ctx.images[0];assert.ok(sx>=0&&sy>=0&&sw<=1600);
  // Every step's cut length is printed.
  const printed=ctx.texts.map(t=>t.text).join('\n');
  for(const row of lines.rows)assert.ok(printed.includes(row.cut)||printed.replace(/\n/g,'').includes(row.cut),`${study.id} ${lang}: ${row.cut}`);
 }
});

test('a long recipe of 24 stems shrinks to fit and says so only when it cannot',()=>{
 const base=studyState(studies.find(st=>st.id==='abundant'),'en');
 const items=Array.from({length:24},(_,i)=>({...base.items[i%base.items.length],id:`x${i}`,originId:null}));
 const recipe=arrangementRecipe({...base,items},assetById),ctx=recorder();
 const layout=paintRecipeCard(ctx,W,H,art,recipe,recipeLines(recipe,'ja',{title:base.title}),cardFonts('ja'));
 assert.equal(recipe.rows.length,24);
 assert.equal(layout.columns,2);
 for(const t of ctx.texts)assert.ok(t.left>=0&&t.left+t.w<=W+.5&&t.y<=H,t.text);
});

test('a 24-stem recipe gives up picture before it drops a step: every step printed in all three languages',()=>{
 for(const id of ['abundant','spring-garden'])for(const lang of ['zh','en','ja']){
  const base=studyState(studies.find(st=>st.id===id),lang);
  const items=Array.from({length:24},(_,i)=>({...base.items[i%base.items.length],id:`x${i}`,originId:null,x:base.items[i%base.items.length].x+(i%5)-2}));
  const recipe=arrangementRecipe({...base,items},assetById),ctx=recorder();
  const layout=paintRecipeCard(ctx,W,H,art,recipe,recipeLines(recipe,lang,{title:base.title}),cardFonts(lang));
  assert.equal(layout.clipped,false,`${id} ${lang}`);
  for(const row of recipe.rows)assert.ok(ctx.texts.filter(t=>t.text===String(row.n)).length>=2,`${id} ${lang}: step ${row.n} missing`);
 }
});

test('card fonts: a serif and a sans stack per language, zh by default',()=>{
 for(const lang of ['zh','en','ja']){assert.match(CARD_FONTS[lang].serif,/serif$/);assert.match(CARD_FONTS[lang].sans,/sans-serif$/)}
 assert.equal(cardFonts('fr'),CARD_FONTS.zh);
});
