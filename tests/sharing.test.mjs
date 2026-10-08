// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {cleanLineage,extendLineage,canvasSignature} from '../dist/editor-state.js?v=hn3';
import {studies} from '../dist/studies.js';
import {dist} from './helpers/catalog.mjs';

const isStudy=id=>studies.some(study=>study.id===id);
const app=readFileSync(`${dist}app.js`,'utf8'),html=readFileSync(`${dist}index.html`,'utf8');

test('lineage: at most three entries {t, s?}, titles folded and capped at 40 characters, junk dropped and never thrown',()=>{
 for(const junk of [null,undefined,'x',42,{t:'a'},[null,1,'a',{},{t:''},{t:'   '},{t:7},{s:'cherry'}]])assert.deepEqual(cleanLineage(junk,{isStudy}),[]);
 assert.deepEqual(cleanLineage([{t:'  风\n经过\t的地方  '}],{isStudy}),[{t:'风 经过 的地方'}]);
 const long='花'.repeat(60);assert.equal(cleanLineage([{t:long}])[0].t.length,40);
 assert.equal([...cleanLineage([{t:'🌸'.repeat(50)}])[0].t].length,40,'cut by code point, not by UTF-16 unit');
 assert.deepEqual(cleanLineage([{t:'a'},{t:'b'},{t:'c'},{t:'d'}]),[{t:'b'},{t:'c'},{t:'d'}],'the latest three are kept');
 assert.deepEqual(cleanLineage([{t:'A Branch',s:'cherry'}],{isStudy}),[{t:'A Branch',s:'cherry'}]);
 assert.deepEqual(cleanLineage([{t:'A Branch',s:'no-such-study'}],{isStudy}),[{t:'A Branch'}],'an unknown study id is dropped, the title kept');
 assert.deepEqual(cleanLineage([{t:'x',s:'<script>'}],{isStudy:()=>true}),[{t:'x'}],'a study id must look like one');
 assert.deepEqual(cleanLineage([{t:'x',s:'cherry',extra:1}],{isStudy}),[{t:'x',s:'cherry'}],'only t and s survive');
 assert.deepEqual(cleanLineage([{t:'<b>"x"</b>'}]),[{t:'<b>"x"</b>'}],'markup is kept as text; app.js escapes it wherever it shows');
});

test('extendLineage appends a remix source once and keeps the last three',()=>{
 assert.deepEqual(extendLineage(undefined,{t:'One'}),[{t:'One'}]);
 assert.deepEqual(extendLineage([{t:'One'}],{t:'One'}),[{t:'One'}],'the same source is not repeated');
 assert.deepEqual(extendLineage([{t:'A',s:'cherry'},{t:'B'},{t:'C'}],{t:'D'},{isStudy}),[{t:'B'},{t:'C'},{t:'D'}]);
 assert.deepEqual(extendLineage([{t:'A'}],{t:''}),[{t:'A'}],'an empty title adds nothing');
});

test('lineage does not make a canvas count as changed',()=>{
 const base={version:2,id:'one',title:'t',intention:'',vessel:'round',items:[]};
 assert.equal(canvasSignature(base),canvasSignature({...base,lineage:[{t:'x'}]}));
});

test('app.js: lineage is validated, escaped wherever it shows, and set by studies and remixes',()=>{
 assert.match(app,/intention:String\(v\.intention\|\|''\)\.slice\(0,600\),\.\.\.lineageField\(v\.lineage\)/,'validate() keeps a cleaned lineage');
 assert.match(app,/lineage:\[\{t:study\.title\[localeIndex\(lang\)\],s:study\.id\}\]/,'a study remembers where it came from');
 assert.match(app,/next\.lineage=extendLineage\(shared\.lineage,\{t:title\}/,'a remix credits the shared draft');
 // Lineage titles are user text: wherever one reaches markup it goes through esc().
 assert.doesNotMatch(app,/\$\{lineageNote\([^)]*\)\}/,'never interpolated raw');
 assert.equal([...app.matchAll(/\$\{esc\(lineageNote\((w\.state|snapshot)\)\)\}/g)].length,2,'gallery card and recipe dialog');
 const arrive=app.slice(app.indexOf('async function arriveShare('),app.indexOf('async function remixShared('));
 assert.match(arrive,/note=lineageNote\(shared\)/);assert.match(arrive,/<p class="art-lineage">\$\{esc\(note\)\}<\/p>/);
 assert.doesNotMatch(arrive,/\$\{note\}/);
});

test('app.js: a shared draft arrives on a card with three choices, and study links open the study',()=>{
 for(const words of [['在我的花间里改一改','Remix in my atelier','自分のアトリエでアレンジ'],['收进我的作品','Keep in My Works','マイ作品に保存'],['只是看看','Just look','見るだけ']])
  assert.ok(app.includes(`L('${words[0]}','${words[1]}','${words[2]}')`),words[1]);
 assert.match(app,/async function arriveShare\(shared\)/);
 assert.match(app,/if\(own\)return remixShared\(shared,\{credit:false\}\)/,'one\'s own link opens straight away');
 assert.match(app,/if\(bootShare\)\{const shared=bootShare;bootShare=null;arriveShare\(shared\)/,'boot shows the card after the first render');
 assert.match(app,/location\.hash\.startsWith\('#study='\)/);
 assert.match(app,/new URLSearchParams\(location\.search\)\.get\('study'\)/,'?study= works on the plain index.html');
 assert.match(app,/const studyLink=study=>`\$\{location\.origin\}\$\{location\.pathname\}\?study=\$\{encodeURIComponent\(study\.id\)\}`/);
 assert.doesNotMatch(app,/\/s\/\$\{/,'no links to per-study pages the host may not serve');
 assert.match(app,/data-study-share="\$\{study\.id\}" aria-label="\$\{esc\(shareLabel\(study\)\)\}"/);
});

test('index.html: link previews with absolute https URLs and an image that exists at 1200×630',()=>{
 const meta=(attr,name)=>html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]+)">`))?.[1];
 for(const name of ['og:type','og:site_name','og:title','og:description','og:url','og:image','og:image:alt'])assert.ok(meta('property',name),name);
 assert.equal(meta('name','twitter:card'),'summary_large_image');
 assert.equal(meta('property','og:url'),'https://flowerist.org/');
 for(const url of [meta('property','og:image'),meta('name','twitter:image')]){
  assert.match(url,/^https:\/\/flowerist\.org\/og\/[a-z0-9-]+\.jpg$/);
  const file=`${dist}${url.replace('https://flowerist.org/','')}`;assert.ok(existsSync(file),file);
  const jpg=readFileSync(file);
  assert.equal(jpg.readUInt16BE(0),0xffd8,'a JPEG');
  assert.ok(jpg.length>20000&&jpg.length<300000,'a real picture, light enough for crawlers');
  // Walk the JPEG segments to the frame header for the size.
  let at=2,size=null;
  while(at<jpg.length){const marker=jpg.readUInt16BE(at),len=jpg.readUInt16BE(at+2);if(marker>=0xffc0&&marker<=0xffc3){size=[jpg.readUInt16BE(at+7),jpg.readUInt16BE(at+5)];break}at+=2+len}
  assert.deepEqual(size,[Number(meta('property','og:image:width')),Number(meta('property','og:image:height'))]);
  assert.deepEqual(size,[1200,630]);
 }
});

test('index.html: Share and Recipe buttons are labelled in all three languages',()=>{
 const tag=id=>html.match(new RegExp(`<button[^>]*id="${id}"[^>]*>`))?.[0]||'';
 const share=tag('share-current');assert.ok(share);
 for(const attr of ['data-aria-zh','data-aria-en','data-aria-ja'])assert.ok(share.includes(attr),attr);
 assert.ok(tag('recipe-button').includes('data-title-en'));
 assert.ok(html.includes('<span data-zh="分享" data-en="Share" data-ja="共有">分享</span>'));
 assert.ok(html.includes('<span data-zh="配方" data-en="Recipe" data-ja="レシピ">配方</span>'));
 assert.ok(app.includes("'配方：买什么、剪多长':'レシピ：用意する花材と切る長さ'"),'the recipe title has its Japanese');
});
