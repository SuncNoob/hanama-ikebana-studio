// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
/** Splits allowed for now (none: scale.js now imports geometry.js?v=restore1 like everyone else). */
const tolerated={};

function importers(){
 const uses=new Map();
 const add=(target,spec,from)=>{if(!uses.has(target))uses.set(target,new Map());const specs=uses.get(target);if(!specs.has(spec))specs.set(spec,[]);specs.get(spec).push(from)};
 const scan=(dir,prefix)=>{for(const name of readdirSync(`${root}${dir}`).filter(n=>/\.m?js$/.test(n))){
  const source=readFileSync(`${root}${dir}/${name}`,'utf8');
  for(const [,spec] of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)'([^']+)'/g)){
   const local=spec.startsWith(prefix)?`./${spec.slice(prefix.length)}`:null;
   // Dev scripts may load a plain dist file on their own; a versioned one must match the site's specifier.
   if(local&&(dir==='dist'||local.includes('?')))add(local.replace(/^\.\//,'').replace(/\?.*$/,''),local,`${dir}/${name}`);
  }
 }};
 scan('dist','./');scan('tests','../dist/');scan('tests/helpers','../../dist/');if(existsSync(`${root}qa`))scan('qa','../dist/');
 return uses;
}

test('every module is imported with one identical specifier (dist, tests, test helpers and local qa scripts), and every import exists',()=>{
 for(const [target,specs] of importers()){
  assert.ok(existsSync(`${root}dist/${target}`),`missing module ${target}`);
  const list=[...specs.keys()].sort();
  if(tolerated[target]&&list.every(s=>tolerated[target].includes(s)))continue;
  assert.equal(list.length,1,`${target} is imported as ${list.map(s=>`${s} (${specs.get(s).join(', ')})`).join(' and ')}`);
 }
});

test('index.html loads the app module and stylesheets that exist',()=>{
 const html=readFileSync(`${root}dist/index.html`,'utf8');
 const refs=[...html.matchAll(/(?:src|href)="\/([^"?#]+\.(?:js|css))(\?[^"]*)?"/g)];
 assert.ok(refs.some(([,file])=>file==='app.js'));
 for(const [,file] of refs)assert.ok(existsSync(`${root}dist/${file}`),`index.html references missing ${file}`);
});
