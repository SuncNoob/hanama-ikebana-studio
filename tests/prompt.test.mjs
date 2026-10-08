// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildPrompt,materialGroups,materialNoun,pluralName,PACK_MODES,MODE_NAMES,PACK_NAMES,packReadme,OUTPUT_FORMATS,OUTPUT_FORMAT_ORDER} from '../dist/prompt.js?v=hn4';
import {isKenzan,arrangementMetrics,outOfScale} from '../dist/scale.js?v=hn3';
import {assetById,studies,studyState,initial,scenes,specimenFor,dist} from './helpers/catalog.mjs';

const MODES=['natural','creative','faithful'];
const CJK=/[぀-ヿ㐀-鿿豈-﫿]/;
const words=text=>text.trim().split(/\s+/).length;
const sentences=text=>text.split(/(?<=[.!?])\s+|\n+/).map(s=>s.trim()).filter(Boolean);
const materialsLine=text=>text.match(/^Materials: (.*)\.$/m)?.[1]||'';
/** The count a Materials entry starts with: "2 irises", "a bunch of …", "3 bunches of …". */
const entryCount=entry=>{const m=entry.match(/^(\d+)\b/);return m?+m[1]:/^a bunch\b/.test(entry)?1:NaN};
const origins=items=>new Set(items.map(i=>i.originId||i.id)).size;
const prompt=(s,extras={})=>buildPrompt(s,assetById,scenes,extras);
/** One study stem cut with the scissors: two pieces sharing its origin, the upper one moved in front of the rim. */
function scissorsSplit(s,index=0){
 const item=s.items[index];
 const pieces=[{...item,id:`${item.id}-a`,originId:item.id,pieceLabel:'A'},{...item,id:`${item.id}-b`,originId:item.id,pieceLabel:'B',aboveVessel:true}];
 return {...s,items:[...s.items.slice(0,index),...pieces,...s.items.slice(index+1)]};
}

test('every study prompt in every mode starts the same way, stays in English and within 320 words',()=>{
 for(const study of studies){
  const s=studyState(study,'en');
  for(const generation of MODES)for(const guide of [false,true]){
   const text=prompt({...s,generation},{guide}),noted=prompt({...s,generation,intention:'For a quiet hallway table.'},{guide});
   assert.match(text,/^Create an image/,`${study.id} ${generation}`);
   for(const t of [text,noted])assert.doesNotMatch(t,CJK,`${study.id} ${generation}: CJK in an English prompt`);
   assert.ok(words(text)<=320,`${study.id} ${generation}${guide?' +guide':''}: ${words(text)} words`);
   assert.doesNotMatch(text,/Nearer the camera|Further back/,'one materials list only');
  }
 }
});

test('branches, fronds and leaves are counted as pieces, not as whole plants',()=>{
 const wrong=/\b\d+ (Japanese maples?|willows?|cherry blossoms|\w+ leafs|\w+ foliages)\b/;
 for(const study of studies)for(const generation of MODES){
  const text=prompt({...studyState(study,'en'),generation});
  assert.doesNotMatch(text,wrong,`${study.id}: ${text.match(wrong)?.[0]}`);
 }
 const single=family=>Object.values(assetById).find(a=>a.family===family&&!a.bundle&&a.en),noun=(family,n)=>materialNoun(single(family),n);
 assert.equal(noun('maple',2),'2 branches of Japanese maple');
 assert.equal(noun('willow',1),'1 branch of willow');
 assert.equal(noun('sakura',2),'2 branches of cherry blossom');
 assert.equal(noun('pampas',2),'2 plumes of pampas grass');
 assert.equal(noun('fern',3),'3 fronds of fern');
 assert.equal(noun('fatsia-leaf',2),'2 fatsia leaves');
 assert.equal(noun('snow-willow',2),'2 stems of snow willow');
 assert.equal(noun('iris',2),'2 irises');
 assert.equal(pluralName('iris'),'irises');
 assert.equal(pluralName('lily of the valley'),'lilies of the valley');
 const bunch=Object.values(assetById).find(a=>a.bundle&&a.family==='narcissus');
 assert.equal(materialNoun(bunch,1),'a bunch of narcissus');
 assert.equal(materialNoun(bunch,2),'2 bunches of narcissus');
});

test('each origin is named once: one list, front stems first, cut pieces counted as one material',()=>{
 for(const study of studies){
  const s=studyState(study,'en'),text=prompt(s),entries=materialsLine(text).split('; ');
  const groups=materialGroups(s.items,assetById);
  assert.equal(entries.length,groups.length,study.id);
  assert.equal(entries.reduce((n,e)=>n+entryCount(e),0),origins(s.items),`${study.id}: ${materialsLine(text)}`);
  assert.equal(new Set(groups.map(g=>`${g.asset.en}|${!!g.asset.bundle}`)).size,groups.length,`${study.id}: a material is listed twice`);
  const firstBack=groups.findIndex(g=>!g.front);
  assert.ok(firstBack<0||groups.slice(firstBack).every(g=>!g.front),`${study.id}: front groups come first`);
 }
 const base=studyState(studies.find(st=>st.id==='magnolia'),'en'),split=scissorsSplit(base,0);
 assert.equal(split.items.length,base.items.length+1);
 const text=prompt(split),line=materialsLine(text);
 assert.match(line,/cut into two pieces/);
 assert.equal(line.split('; ').reduce((n,e)=>n+entryCount(e),0),origins(base.items),'the two pieces count as one stem');
 assert.match(line,/crossing in front of the rim/,'a piece in front of the rim puts its material in front');
});

test('the support sentence follows the vessel: kenzan stand in water, smoked glass shows the stems',()=>{
 let kenzan=0,glass=0;
 for(const study of studies){
  const s=studyState(study,'en'),vessel=assetById[s.vessel],text=prompt(s);
  if(isKenzan(vessel)){kenzan++;assert.match(text,/\bwater\b/,`${study.id}: a kenzan prompt without water`);assert.doesNotMatch(text,/discreet kenzan/)}
  if(/glass/.test(vessel.id)){glass++;assert.doesNotMatch(text,/rim hides/,`${study.id}: glass is not opaque`);assert.match(text,/through the smoked glass below the waterline/)}
 }
 assert.ok(kenzan>=16&&glass>=3,`kenzan ${kenzan}, glass ${glass}`);
 const trough=prompt(studyState(studies.find(st=>st.id==='fritillary-meadow'),'en'));
 assert.match(trough,/Three low blackened brass kenzan along the trough sit in calm, shallow, clear water, only partly visible/);
 const suiban=prompt(studyState(studies.find(st=>st.id==='iris'),'en'));
 assert.match(suiban,/A low brass kenzan sits in calm, shallow, clear water and stays naturally visible at the stem bases/);
});

test('the three modes say different things, and faithful no longer contradicts itself',()=>{
 for(const study of studies){
  const s=studyState(study,'en'),[natural,creative,faithful]=MODES.map(generation=>sentences(prompt({...s,generation})));
  const differ=(a,b)=>a.filter(x=>!b.includes(x)).length+b.filter(x=>!a.includes(x)).length;
  assert.ok(differ(natural,faithful)>1,`${study.id}: faithful differs from natural by one sentence or less`);
  assert.ok(differ(natural,creative)>0&&differ(creative,faithful)>0,study.id);
  assert.ok(!faithful.some(x=>/not a tracing/.test(x)),`${study.id}: faithful still says "not a tracing"`);
  assert.ok(faithful.some(x=>/^Stay as close to the draft as physics allows/.test(x)));
  assert.ok(creative.some(x=>/^Keep the same materials, count and silhouette/.test(x)));
 }
});

test('true scale comes from the measured draft, rounded to 5 cm; an out-of-scale draft makes no centimetre claims',()=>{
 for(const study of studies){
  const s=studyState(study,'en'),text=prompt(s),m=arrangementMetrics(s,assetById);
  const line=text.match(/^True scale: .*$/m)?.[0];
  assert.ok(line,`${study.id}: no scale line`);
  const rise=+line.match(/rises about (\d+) cm above the table/)[1];
  assert.equal(rise%5,0);
  assert.ok(Math.abs(rise-m.tallest.cmAboveTable)<=2.5,`${study.id}: ${rise} vs ${m.tallest.cmAboveTable}`);
  assert.match(line,new RegExp(`about ${Math.round(m.vesselCm)} cm tall`));
  assert.doesNotMatch(line,/the frame shows|spans about|× the vessel/,'avoid locking the scene to the square draft');
 }
 const s=studyState(studies.find(st=>st.id==='cherry'),'en');
 s.items[0]={...s.items[0],h:assetById[s.items[0].type].height*2};
 assert.ok(outOfScale(s.items[0],assetById[s.items[0].type]));
 const text=prompt(s,{outOfScale:true});
 assert.doesNotMatch(text,/\bcm\b/,'no centimetre claims when a stem is out of scale');
 assert.match(text,/Keep flower sizes as drawn relative to the vessel/);
 const unmeasured=prompt(studyState(studies.find(st=>st.id==='cherry'),'en'),{metrics:null});
 assert.match(unmeasured,/The draft is drawn at true botanical scale/,'without metrics the plain wording stays');
});

test('camera, collage and guide sentences; mood and creative notes never fight the setting',()=>{
 const s=studyState(studies.find(st=>st.id==='cherry'),'en'),plain=prompt(s);
 assert.match(plain,/wallpaper-worthy editorial photograph/);
 assert.match(plain,/The draft is a collage, not a frame to trace/);
 assert.match(plain,/Show the whole vessel and its base/);
 assert.doesNotMatch(plain,/layout image/,'the guide sentence belongs to the zip only');
 assert.match(prompt(s,{guide:true}),/A faded layout image, if attached, only shows which stems pass in front of the rim/);
 // The first-run preset note is a mood cue, not an instruction to override the scene.
 const demo=initial(),preset=prompt(demo,{presetNote:demo.intention});
 assert.match(preset,/^Mood cue: Like a morning breeze/m);
 assert.doesNotMatch(preset,/Creative note|If the creative note|unless the creative note/);
 const zhPreset=prompt({...demo,intention:'像清晨的风掠过庭院，安静、自然，留一点不完美。'},{presetNote:demo.intention});
 assert.match(zhPreset,/^Mood cue: Like a morning breeze/m,'a localised preset is cued in English');
 const own=prompt({...s,intention:'In a tea room at dusk.'});
 assert.match(own,/Creative note: In a tea room at dusk\.\nIf the creative note explicitly describes a different setting or light, follow it\./);
 assert.match(own,/Preserve the draft's overall light unless the creative note describes another light/);
 assert.doesNotMatch(plain,/unless the creative note/);
 const night=prompt({...s,scene:'night',mood:'春意'});
 assert.match(night,/Mood: Spring — fresh, delicate spring colour under quiet evening light\./);
 assert.doesNotMatch(night,/morning light/);
});

test('the detail phrase follows the materials: petals for flowers, leaves and bark for branches only',()=>{
 const base=studyState(studies.find(st=>st.id==='cherry'),'en');
 assert.match(prompt(base),/Give each bloom/);
 const green={...base,items:[]};
 for(const family of ['pine','maple','eucalyptus'])green.items.push({...base.items[0],id:`g-${family}`,originId:null,type:specimenFor(family).id});
 const text=prompt(green);
 assert.match(text,/Give each branch and leaf/);
 assert.doesNotMatch(text,/petal/);
});

test('app.js builds the prompt once, with the preset cue and the zip-only guide sentence',()=>{
 const source=readFileSync(`${dist}app.js`,'utf8');
 assert.match(source.match(/^import .* from '\.\/prompt\.js[^']*';$/m)?.[0]||'',/^import \{buildPrompt,[^}]*\} from '\.\/prompt\.js\?v=hn4';$/,'app.js imports prompt.js with the shared specifier');
 assert.ok(source.includes('presetNote:intentionPresets.includes(s.intention)?intentionPresets[1]:false'),'an untouched preset note goes in as its English text');
 assert.ok(source.includes('{guide:true,format:session.format}'),'the zip prompt uses the selected format and mentions the guide');
 assert.equal(source.match(/buildPrompt\(/g).length,1,'one call site (promptFor)');
});

test('the pack readme is written for a person, in the reader\'s language first, with a file name per mode',()=>{
 const heads={zh:'中文',en:'ENGLISH',ja:'日本語'};
 for(const mode of PACK_MODES)for(const lang of ['zh','en','ja']){
  const text=packReadme(mode,lang),sections=text.trim().split('\n\n');
  assert.equal(sections.length,3);
  assert.deepEqual(sections.map(s=>s.split('\n')[0]),[heads[lang],...Object.keys(heads).filter(l=>l!==lang).map(l=>heads[l])]);
  for(const section of sections){
   for(const file of ['draft.png','prompt.txt','composition-guide.png','composition.json','recipe.png','recipe.txt'])assert.ok(section.includes(file),`${mode} ${lang}: ${file}`);
   assert.match(section,/https:\/\/chatgpt\.com\//);
   assert.equal((section.match(/^\d\. /gm)||[]).length,5,'five numbered steps');
  }
  assert.doesNotMatch(text,/Recalculate|GPT Image/,'steps for the person, not the model');
 }
 assert.match(packReadme('faithful','en'),/HANAMA · MINIMAL CORRECTION PACK/);
 assert.match(packReadme('creative','zh'),/花间 · 适度花艺润色创作包/);
 assert.equal(packReadme('natural','fr'),packReadme('natural','zh'),'an unknown language reads zh');
 for(const mode of PACK_MODES){
  assert.equal(MODE_NAMES[mode].length,3);assert.ok(MODE_NAMES[mode].every(Boolean));
  assert.match(PACK_NAMES[mode][1],/^[a-z-]+-pack$/,'English pack names stay ASCII');
 }
 assert.equal(new Set(PACK_MODES.map(m=>PACK_NAMES[m][1])).size,3);
});

test('wallpaper canvases expand the setting without changing the material count',()=>{
 const s=studyState(studies.find(st=>st.id==='cherry'),'en');
 assert.deepEqual(OUTPUT_FORMAT_ORDER,['phone','macbook','square']);
 for(const id of OUTPUT_FORMAT_ORDER){
  const f=OUTPUT_FORMATS[id],text=prompt(s,{format:id});
  assert.match(text,new RegExp(`${f.ratio.replace(':','\:')}, target ${f.width} × ${f.height} px`));
  assert.match(text,/without stretching or repeating the flowers/);
  assert.equal(materialsLine(text),materialsLine(prompt(s)));
  assert.match(packReadme('natural','en',id),new RegExp(`${f.width} × ${f.height} px`));
 }
 assert.match(prompt(s,{format:'phone'}),/space toward the upper third for a lock-screen clock/);
 assert.match(prompt(s,{format:'macbook'}),/negative space that works behind desktop icons/);
 assert.match(prompt(s,{format:'unknown'}),/1:1, target 2048 × 2048 px/);
 const source=readFileSync(`${dist}app.js`,'utf8');
 assert.match(source,/\{format:session\.format\}/);
 assert.match(source,/packReadme\(mode,lang,session\.format,session\.provider\)/);
 assert.match(source,/data-pack-format/);
 assert.match(source,/data-pack-provider/);
 assert.match(packReadme('natural','en','phone','gemini'),/https:\/\/gemini\.google\.com\//);
 assert.match(packReadme('natural','ja','macbook','gemini'),/Nano Banana/);
});

test('generation dialog: one three-language template, ChatGPT wording and the photo round trip',()=>{
 const source=readFileSync(`${dist}app.js`,'utf8'),html=readFileSync(`${dist}index.html`,'utf8');
 const dialog=source.slice(source.indexOf('async function generatePackageV3'),source.indexOf('$(\'#generate-button\').onclick'));
 assert.ok(dialog.length>2000);
 assert.ok(dialog.includes("const PACK_KICKER='DRAFT → IMAGE → ARTWORK'")||source.includes("const PACK_KICKER='DRAFT → IMAGE → ARTWORK'"));
 assert.doesNotMatch(dialog,/replaceAll\(from,to\)|'下载生图包 \.zip':/,'no ja string map over the zh dialog');
 assert.doesNotMatch(html,/GPT Image/,'index.html says ChatGPT');
 assert.match(dialog,/navigator\.clipboard\.write\(\[new ClipboardItem\(\{'image\/png':/);
 assert.match(dialog,/navigator\.share\(\{files:\[ready\.file\],text:session\.promptText\}\)/);
 assert.match(dialog,/href="https:\/\/chatgpt\.com\/" target="_blank" rel="noopener"/);
 // Photo records gain optional fields only; the works database keeps version 1 and the pending pack has its own database.
 assert.match(source,/indexedDB\.open\('hanama-artworks',1\)/);
 assert.match(source,/indexedDB\.open\('hanama-pending',1\)/);
 assert.match(source,/sourceId:snapshot\.id,generation:snapshot\.generation\|\|'natural',artKind:real\?'real':'generated'/);
 const uses=[...source.matchAll(/localStorage\.(?:get|set|remove)Item\(PENDING_STORE[^;]*/g)];
 assert.ok(uses.length>=4);
 for(const use of uses){
  const before=source.slice(Math.max(0,use.index-120),use.index);
  assert.match(before,/try\{[^}]*$|try\{entry=JSON\.parse\($/,`PENDING_STORE access outside try: ${use[0]}`);
 }
});
