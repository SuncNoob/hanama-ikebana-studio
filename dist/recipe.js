// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/**
 * The arrangement recipe (A18): what to buy and how long to cut each stem, measured from the draft at true scale (one stage
 * percent is one centimetre). Pure and DOM-free (tests/recipe.test.mjs covers all 50 studies); app.js renders the dialog and
 * share-cards.js paints the card. Every figure is an estimate and every text says so (约 / ≈ / 約).
 */
import {itemCm,stemCm,drawsStem,crownPoint,seatState,seatPoint,isKenzan,isDetachedPiece} from './scale.js?v=hn3';
import {vesselGeometry} from './geometry.js?v=soft2';
import {stemMaxCm,rolesOf,profileOf} from './botany.js?v=hn2';
import {nameOf,colorOf,supportName,vesselFacts} from './library.js?v=hn3';
import {materialNoun} from './prompt.js?v=hn4';

const LANG_INDEX={zh:0,en:1,ja:2};
/** The [zh, en, ja] entry for a language (anything unknown reads zh, as app.js does). */
const pick=(lang,list)=>list[LANG_INDEX[lang]??0];
const round=n=>Math.round(n);
/** No-break space: keeps "37 cm" and "× 2" on one line when a card wraps the text (share-cards.js). */
const NB='\u00a0';
/** Centimetres a kenzan pin holds: the cut end sits on the pins, which are about 1.5 cm deep. */
export const KENZAN_DIP=1.5;
/** Nearer than this to the vessel's centre line counts as centred (cm). */
const CENTRED_CM=2;
/** A lean under this many degrees from vertical is not worth a word. */
const LEAN_WORTHY=15;

/**
 * Centimetres of stem below the rim, by support: a visible kenzan 1.5 (the base already stands on its pins), integrated
 * openings min(6, half the height), a neck, wire, grid or crossbar 0.4 × height + 5 (rim to water, then 5 cm in water),
 * never deeper than the vessel. Estimates for a florist to adjust.
 */
export function immersionCm(vessel){
 const h=vesselGeometry(vessel).height,kind=vessel?.fixture?.kind;
 if(isKenzan(vessel))return KENZAN_DIP;
 if(kind==='integrated-holes'||kind==='kenzan'||kind==='pin-frog-wire')return Math.min(6,h*.5);
 return Math.max(0,Math.min(h-1,h*.4+5));
}

/**
 * The recipe of a draft: {vessel, rows, groups}.
 *  vessel  {asset, heightCm, mouthCm, support (fixture kind), dipCm}
 *  rows    one per bought stem (the pieces of a stem cut with the scissors share `originId`), tallest crown first, numbered n:
 *          {n, asset, type, family, itemId, originId, pieces, tipAboveRimCm (rim to the crown), sideCm (crown from the
 *          vessel's centre line, + right), leanDeg (base → crown from vertical, + right), cutCm (drawn length + the part
 *          below the rim), soldMaxCm (drawn-stem photographs: head + the species' usual stem, else null), tooLong, front (passes
 *          in front of the rim; never on a visible kenzan),
 *          seated, unseated (item ids to put back), bunchStems (stems in a bunch photograph, or null), crown ([x, y] stage cm)}
 *  groups  the shopping list: one per material name, colour and bunch, in row order: {asset, n (stems or bunches),
 *          stems (single stems they hold), rows (row numbers)}
 */
export function arrangementRecipe(s,assetById){
 const vessel=assetById?.[s?.vessel];
 if(!vessel)throw Error('Unknown vessel');
 const g=vesselGeometry(vessel),facts=vesselFacts(vessel),primary=g.openings.find(o=>o.primary)||g.openings[0];
 const rimY=primary?primary.center[1]:g.insertion[1],centerX=g.insertion[0],dip=immersionCm(vessel),kenzan=isKenzan(vessel);
 const origins=new Map();
 for(const item of s.items||[]){
  const a=assetById[item.type];if(!a)continue;
  const key=item.originId||item.id,o=origins.get(key)||{key,pieces:[]};o.pieces.push({item,a});origins.set(key,o);
 }
 const rows=[...origins.values()].map(o=>{
  // The piece still on its stem stands for the stem; detached pieces lie where they were put on purpose (see floatingItems).
  const kept=o.pieces.filter(p=>!isDetachedPiece(p.item)),main=kept[0]||o.pieces[0],{item,a}=main;
  const crown=crownPoint(item,a),base=seatPoint(item,a),cm=itemCm(item,a);
  const below=kenzan?KENZAN_DIP:Math.max(0,dip-Math.max(0,base[1]-rimY));
  const cutCm=round(cm+below);
  const soldMaxCm=drawsStem(a)?round(cm-stemCm(item,a)+stemMaxCm(a)):null;
  const unseated=kept.filter(p=>!seatState(p.item,p.a,vessel).seated).map(p=>p.item.id);
  const bunchStems=a.bundle&&Array.isArray(a.stems)&&a.stems.length>1?a.stems.length:null;
  return {
   asset:a,type:a.id,family:a.family,itemId:item.id,originId:o.key,pieces:o.pieces.length,crown,
   tipAboveRimCm:round(rimY-crown[1]),sideCm:round(crown[0]-centerX),leanDeg:round(Math.atan2(crown[0]-base[0],base[1]-crown[1])*180/Math.PI),
   cutCm,soldMaxCm,tooLong:soldMaxCm!==null&&cutCm>soldMaxCm,
   // On a visible kenzan every stem is drawn in front of the vessel and rises from the pins, so none crosses the rim.
   front:!kenzan&&o.pieces.some(p=>!!p.item.aboveVessel),seated:!unseated.length,unseated,bunchStems
  };
 }).sort((p,q)=>p.crown[1]-q.crown[1]);
 rows.forEach((row,i)=>row.n=i+1);
 const groups=new Map();
 for(const row of rows){
  const a=row.asset,key=[a.en||a.name,a.colorEn||a.color||'',a.bundle?1:0].join('|'),group=groups.get(key)||{asset:a,n:0,stems:0,rows:[]};
  group.n++;group.stems+=row.bunchStems||1;group.rows.push(row.n);groups.set(key,group);
 }
 return {vessel:{asset:vessel,heightCm:facts.heightCm,mouthCm:facts.mouthCm,support:facts.support,dipCm:dip},rows,groups:[...groups.values()]};
}

// ── Words ──
const approxCm=(n,lang)=>lang==='en'?`≈${n}${NB}cm`:lang==='ja'?`約${n}${NB}cm`:`约${NB}${n}${NB}cm`;
/** Headings and fixed lines, [zh, en, ja]. */
export const RECIPE_TEXT={
 kicker:['配方','Recipe','レシピ'],
 title:['花材配方','Arrangement recipe','いけばなレシピ'],
 vessel:['花器','Vessel','花器'],
 need:['准备','You will need','用意するもの'],
 steps:['剪与插 · 从最高的一枝开始','Cut and place · tallest first','切って挿す · 高いものから'],
 number:['序号','No.','番号'],
 material:['花材','Material','花材'],
 cut:['剪长','Cut length','切る長さ'],
 place:['位置','Placement','位置'],
 notes:['备注','Notes','メモ'],
 footer:['尺寸按草稿的真实比例量出，都是约数；以手边的花材为准。','Measured from the draft at true scale. Every size is approximate; trust the stems in your hands.','下書きの実寸から測った目安です。手元の花材に合わせてください。'],
 empty:['先添入花材，配方才会出现。','Add a stem and the recipe appears.','花材を加えるとレシピが表示されます。'],
 unseated:['还没插进花器','Not in the vessel yet','まだ花器に入っていません'],
 reseat:['插回花器','Put it in the vessel','花器に挿し直す'],
 front:['从瓶口前侧斜出','crosses in front of the rim','口の手前に出す']
};
export const recipeLabel=(key,lang)=>pick(lang,RECIPE_TEXT[key]||RECIPE_TEXT.title);
const zhUnit={branch:'枝',leaf:'片',frond:'片',plume:'支','stem of':'枝'};
const jaUnit={branch:'本',leaf:'枚',frond:'枚',plume:'本','stem of':'本'};
/** One material in the shopping list: "花毛茛（杏橙）× 2 枝", "2 ranunculus · apricot", "ラナンキュラス（杏色）× 2本"; bunches say how many stems they hold. */
export function groupText(group,lang){
 const a=group.asset,unit=profileOf(a)?.unit,name=nameOf(a,lang),color=colorOf(a,lang)||'',n=group.n;
 const each=a.bundle&&group.stems>n?group.stems:0;
 if(lang==='en')return `${materialNoun(a,n)}${color?` · ${color}`:''}${each?` (≈${each}${NB}stems)`:''}`;
 if(lang==='ja')return `${name}${color?`（${color}）`:''}×${NB}${n}${a.bundle?'束':jaUnit[unit]||'本'}${each?`（約${each}本）`:''}`;
 return `${name}${color?`（${color}）`:''}×${NB}${n}${NB}${a.bundle?'束':zhUnit[unit]||'枝'}${each?`（约 ${each}${NB}枝）`:''}`;
}
/** The vessel line: name, height, mouth and support. */
export function vesselText(recipe,lang){
 const v=recipe.vessel,name=nameOf(v.asset,lang),support=supportName(v.asset,lang),h=round(v.heightCm),m=round(v.mouthCm);
 if(lang==='en')return `${name} · ${approxCm(h,lang)} tall · mouth ${approxCm(m,lang)} · ${support}`;
 if(lang==='ja')return `${name} · 高さ${approxCm(h,lang)} · 口径${approxCm(m,lang)} · ${support}`;
 return `${name} · 高${approxCm(h,lang)} · 口宽${approxCm(m,lang)} · ${support}`;
}
const tipWord=a=>rolesOf(a).some(role=>role==='line'||role==='foliage')&&!rolesOf(a).includes('focal');
/** Where the crown goes, in plain words: "花头高出瓶口约 32 cm，偏左 9 cm" / "Head ≈32 cm above the rim, 9 cm left" / "口から約32 cm上、左へ9 cm". */
export function placeText(row,lang){
 const up=row.tipAboveRimCm,side=row.sideCm,abs=Math.abs(side),branch=tipWord(row.asset);
 if(lang==='en'){
  const head=branch?'Tip':'Head',height=up>=0?`${head} ≈${up}${NB}cm above the rim`:`${head} ≈${-up}${NB}cm below the rim`;
  return `${height}, ${abs<CENTRED_CM?'centred':`${abs}${NB}cm ${side<0?'left':'right'}`}`;
 }
 if(lang==='ja'){
  const head=branch?'枝先は':'花は',height=up>=0?`${head}口から約${up}${NB}cm上`:`${head}口より約${-up}${NB}cm下`;
  return `${height}、${abs<CENTRED_CM?'中央':`${side<0?'左':'右'}へ${abs}${NB}cm`}`;
 }
 const head=branch?'枝梢':'花头',height=up>=0?`${head}高出瓶口约 ${up}${NB}cm`:`${head}低于瓶口约 ${-up}${NB}cm`;
 return `${height}，${abs<CENTRED_CM?'居中':`偏${side<0?'左':'右'} ${abs}${NB}cm`}`;
}
export const cutText=(row,lang)=>lang==='en'?`Cut${NB}${approxCm(row.cutCm,lang)}`:lang==='ja'?`${approxCm(row.cutCm,lang)}に切る`:`剪${approxCm(row.cutCm,lang)}`;
/** The honest note for a stem longer than it is usually sold. */
export const soldText=(row,lang)=>{const n=row.soldMaxCm;return lang==='en'?`Usually sold up to ≈${n}${NB}cm — use a lower vessel or a hidden water tube`:lang==='ja'?`流通は約${n}${NB}cmまで：低い花器か隠した給水管を`:`通常只卖到约 ${n}${NB}cm：换矮一点的花器或藏一支保水管`};
/** Short notes for a row, in order: front of the rim, lean, pieces, bunch. */
export function rowNotes(row,lang){
 const notes=[],lean=row.leanDeg,abs=Math.abs(lean);
 if(row.front)notes.push(recipeLabel('front',lang));
 if(abs>=LEAN_WORTHY)notes.push(lang==='en'?`leaning ≈${abs}°${NB}${lean<0?'left':'right'}`:lang==='ja'?`${lean<0?'左':'右'}へ約${abs}°傾ける`:`向${lean<0?'左':'右'}斜约 ${abs}°`);
 if(row.pieces>1)notes.push(lang==='en'?`cut into ${row.pieces}${NB}pieces`:lang==='ja'?`${row.pieces}つに切り分ける`:`剪成 ${row.pieces}${NB}段`);
 if(row.bunchStems)notes.push(lang==='en'?`a bunch of ≈${row.bunchStems}${NB}stems`:lang==='ja'?`約${row.bunchStems}本の束`:`一束约 ${row.bunchStems}${NB}枝`);
 return notes;
}
/** A row's material name (a cut stem keeps one name). */
export const rowName=(row,lang)=>nameOf(row.asset,lang);

/**
 * Everything the dialog, the text and the card print, in one language: {title, vessel, groups, rows, footer, labels}. Rows
 * are {n, name, cut, place, notes, warn (or ''), unseated (or '')}.
 */
export function recipeLines(recipe,lang,{title=''}={}){
 const labels=Object.fromEntries(Object.keys(RECIPE_TEXT).map(key=>[key,recipeLabel(key,lang)]));
 return {
  title:String(title||''),labels,vessel:vesselText(recipe,lang),footer:labels.footer,
  groups:recipe.groups.map(group=>groupText(group,lang)),
  rows:recipe.rows.map(row=>({n:row.n,name:rowName(row,lang),cut:cutText(row,lang),place:placeText(row,lang),notes:rowNotes(row,lang),warn:row.tooLong?soldText(row,lang):'',unseated:row.seated?'':labels.unseated}))
 };
}
/**
 * Plain text for a chat app or recipe.txt: no tabs or tables, one line per stem plus indented detail lines. `title` and
 * `subtitle` head it, `url` ends it.
 */
export function recipeText(recipe,lang,{title='',subtitle='',url=''}={}){
 const lines=recipeLines(recipe,lang,{title}),sep=lang==='en'?': ':'：',out=[];
 out.push(`${lang==='en'?'HANAMA':lang==='ja'?'花間 HANAMA':'花间 HANAMA'} · ${lines.labels.title}`);
 if(lines.title)out.push(lang==='en'?`“${lines.title}”`:`「${lines.title}」`);
 if(subtitle)out.push(String(subtitle));
 out.push(`${lines.labels.vessel}${sep}${lines.vessel}`,'',lines.labels.need,...lines.groups.map(text=>`· ${text}`));
 if(lines.rows.length){
  out.push('',lines.labels.steps);
  for(const row of lines.rows){
   out.push(`${row.n}. ${row.name} · ${row.cut}`,`   ${row.place}${row.notes.length?` · ${row.notes.join(' · ')}`:''}`);
   if(row.warn)out.push(`   ! ${row.warn}`);
   if(row.unseated)out.push(`   ! ${row.unseated}`);
  }
 }else out.push('',lines.labels.empty);
 out.push('',lines.footer);
 if(url)out.push(url);
 return out.join('\n')+'\n';
}
