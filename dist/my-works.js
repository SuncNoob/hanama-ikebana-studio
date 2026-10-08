// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/**
 * My Works durability (B9). DOM-free (Blob, TextEncoder and DecompressionStream only), so node tests cover it:
 * - the store-only zip writer the packs already used (zipFiles, crc32), and a zip reader that walks the central directory
 *   (readZip, unzipEntry; a re-zipped backup with deflated entries opens too where DecompressionStream has deflate-raw);
 * - the backup format: manifest.json {app:'hanama',version:1}, then for each work works/<id>.json with its record fields and
 *   the preview and artwork images beside it (backupFiles);
 * - restore: every work is checked strictly (the caller's validate), images are sniffed and capped at 15 MB, and a work
 *   replaces the one on this device with the same id only when it is newer (readBackup, keepIncoming);
 * - small helpers for resilient loading (withTimeout, failedIds).
 */

/** What a backup's manifest.json says. */
export const BACKUP_APP='hanama',BACKUP_VERSION=1;
/** Largest image restored from a backup, like a photo imported into My Works. */
export const MAX_BACKUP_IMAGE=15*1024*1024;
/** Largest works/<id>.json read from a backup (a draft link holds at most 30 000 characters; cut masks make files bigger). */
export const MAX_BACKUP_JSON=4*1024*1024;
/** Largest backup file opened, and most entries read from it. */
export const MAX_BACKUP_FILE=1024*1024*1024,MAX_BACKUP_ENTRIES=6000;
const ID=/^[A-Za-z0-9_-]{1,80}$/;

let crcTable=null;
/** CRC-32 of a byte array, from a 256-entry table built on first use. */
export function crc32(data){if(!crcTable){crcTable=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0}}let c=0xffffffff;for(const v of data)c=crcTable[(c^v)&0xff]^(c>>>8);return (c^0xffffffff)>>>0}
/** A store-only (uncompressed) zip of [name, Blob] pairs, names in UTF-8. */
export async function zipFiles(files){const enc=new TextEncoder(),parts=[],central=[];let offset=0;for(const [name,blob] of files){const data=new Uint8Array(await blob.arrayBuffer()),filename=enc.encode(name),crc=crc32(data),local=new Uint8Array(30+filename.length),lv=new DataView(local.buffer);lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x0800,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,filename.length,true);local.set(filename,30);parts.push(local,data);const cd=new Uint8Array(46+filename.length),dv=new DataView(cd.buffer);dv.setUint32(0,0x02014b50,true);dv.setUint16(4,20,true);dv.setUint16(6,20,true);dv.setUint16(8,0x0800,true);dv.setUint32(16,crc,true);dv.setUint32(20,data.length,true);dv.setUint32(24,data.length,true);dv.setUint16(28,filename.length,true);dv.setUint32(42,offset,true);cd.set(filename,46);central.push(cd);offset+=local.length+data.length}const length=central.reduce((n,a)=>n+a.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,length,true);ev.setUint32(16,offset,true);return new Blob([...parts,...central,end],{type:'application/zip'})}

/** A reading error with a code the app turns into a sentence: 'zip' (not a zip it can read), 'manifest' (not a Hanama backup). */
export class BackupError extends Error{constructor(code,message=code){super(message);this.name='BackupError';this.code=code}}

/**
 * The entries of a zip from its central directory: [{name, method, size, crc, data}], where `data` is the stored (maybe
 * compressed) bytes, a view into `bytes`. Directories are left out. Throws BackupError('zip') when the archive is not one
 * it can read (no end record, zip64, encrypted, or an entry outside the file).
 */
export function readZip(bytes,{maxEntries=MAX_BACKUP_ENTRIES}={}){
 if(!(bytes instanceof Uint8Array))bytes=new Uint8Array(bytes);
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),fail=why=>{throw new BackupError('zip',why)};
 let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-22-65535);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break}
 if(end<0)fail('no end of central directory');
 const count=view.getUint16(end+10,true),size=view.getUint32(end+12,true),start=view.getUint32(end+16,true);
 if(count===0xffff||start===0xffffffff)fail('zip64 is not supported');
 if(count>maxEntries)fail('too many entries');
 if(start+size>end)fail('central directory out of range');
 const dec=new TextDecoder(),out=[];let p=start;
 for(let n=0;n<count;n++){
  if(p+46>end||view.getUint32(p,true)!==0x02014b50)fail('bad central directory entry');
  const flags=view.getUint16(p+8,true),method=view.getUint16(p+10,true),crc=view.getUint32(p+16,true),packed=view.getUint32(p+20,true),unpacked=view.getUint32(p+24,true);
  const nameLength=view.getUint16(p+28,true),extra=view.getUint16(p+30,true),comment=view.getUint16(p+32,true),local=view.getUint32(p+42,true);
  const name=dec.decode(bytes.subarray(p+46,p+46+nameLength));p+=46+nameLength+extra+comment;
  if(flags&1)fail('encrypted entries are not supported');
  if(local+30>bytes.length||view.getUint32(local,true)!==0x04034b50)fail('bad local header');
  const dataStart=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
  if(dataStart+packed>bytes.length)fail('entry out of range');
  if(name.endsWith('/'))continue;
  out.push({name,method,size:unpacked,crc,data:bytes.subarray(dataStart,dataStart+packed)});
 }
 return out;
}
/** The bytes of a readZip() entry: stored, or deflated where DecompressionStream('deflate-raw') exists. Checks size and CRC. */
export async function unzipEntry(entry,{max=Infinity}={}){
 if(entry.size>max)throw new BackupError('size');
 let data;
 if(entry.method===0)data=entry.data;
 else if(entry.method===8){
  if(typeof DecompressionStream!=='function')throw new BackupError('zip','deflate is not supported here');
  let stream;try{stream=new Blob([entry.data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))}catch{throw new BackupError('zip','deflate is not supported here')}
  data=new Uint8Array(await new Response(stream).arrayBuffer());
 }else throw new BackupError('zip',`compression method ${entry.method} is not supported`);
 if(data.length!==entry.size||crc32(data)!==entry.crc)throw new BackupError('zip','damaged entry');
 return data;
}

/** The image type of some bytes from their signature (JPEG, PNG or WebP), or null. */
export function imageType(bytes){
 const b=bytes,at=(i,...v)=>v.every((x,k)=>b[i+k]===x);
 if(b.length>3&&at(0,0xff,0xd8,0xff))return 'image/jpeg';
 if(b.length>8&&at(0,0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a))return 'image/png';
 if(b.length>12&&at(0,0x52,0x49,0x46,0x46)&&at(8,0x57,0x45,0x42,0x50))return 'image/webp';
 return null;
}
const extOf=type=>type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
/** The optional fields of a My Works record kept in a backup, beside id, title, updated and state. */
const RECORD_FIELDS=['sourceId','generation','artKind','prompt'];

/**
 * The files of a backup of `records` (My Works records: {id, state, title, updated, preview, art, …}), as [name, Blob]
 * pairs for zipFiles: manifest.json, then per work works/<id>.json and its images. Records without a usable id are left
 * out. `now` is the backup's time (ms).
 */
export function backupFiles(records,{now=Date.now()}={}){
 const json=v=>new Blob([JSON.stringify(v,null,1)],{type:'application/json'});
 const works=records.filter(r=>r&&typeof r.id==='string'&&ID.test(r.id)&&r.state&&typeof r.state==='object');
 const files=[['manifest.json',json({app:BACKUP_APP,version:BACKUP_VERSION,created:new Date(now).toISOString(),works:works.length})]];
 for(const r of works){
  const entry={id:r.id,title:String(r.title??''),updated:Number.isFinite(r.updated)?r.updated:now,state:r.state};
  for(const key of RECORD_FIELDS)if(r[key]!==undefined&&r[key]!==null)entry[key]=r[key];
  const images=[];
  for(const kind of ['preview','art']){
   const blob=r[kind];if(!blob||typeof blob.arrayBuffer!=='function'||!blob.size)continue;
   const name=`works/${r.id}.${kind}.${extOf(blob.type)}`;entry[kind]=name;images.push([name,blob]);
  }
  files.push([`works/${r.id}.json`,json(entry)],...images);
 }
 return files;
}
/** File name of a backup made at `now` (ms): hanama-backup-YYYY-MM-DD.zip in local time. */
export function backupName(now=Date.now()){const d=new Date(now),p=n=>String(n).padStart(2,'0');return `hanama-backup-${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}.zip`}

/**
 * The works in a backup zip (bytes), as My Works records ready to store, plus how many parts were skipped:
 * {records, skipped, total}. `validate(state)` must return the checked draft or throw (strict: a work that fails is
 * skipped whole). Images must be JPEG, PNG or WebP of at most `maxImage` bytes; a bad artwork image drops the work, a bad
 * preview only the preview (records[i].preview is then null: the app draws a new one). Throws BackupError('zip') or
 * ('manifest') when the file is not a Hanama backup.
 */
export async function readBackup(bytes,{validate,maxImage=MAX_BACKUP_IMAGE,maxJson=MAX_BACKUP_JSON}={}){
 const entries=readZip(bytes),byName=new Map(entries.map(e=>[e.name,e]));
 const text=async(entry,max)=>JSON.parse(new TextDecoder().decode(await unzipEntry(entry,{max})));
 // A backup unzipped and zipped again (Finder's Compress, Explorer's Send to) keeps its files under one folder: read from there.
 const manifestEntry=byName.get('manifest.json')||entries.find(e=>/^[^/]+\/manifest\.json$/.test(e.name)&&!e.name.startsWith('__MACOSX/'));
 const root=manifestEntry?manifestEntry.name.slice(0,-'manifest.json'.length):'';let manifest=null;
 try{manifest=manifestEntry?await text(manifestEntry,64*1024):null}catch{}
 if(!manifest||manifest.app!==BACKUP_APP||!Number.isInteger(manifest.version)||manifest.version<1||manifest.version>BACKUP_VERSION)throw new BackupError('manifest');
 const image=async name=>{
  if(typeof name!=='string')return null;const entry=byName.get(root+name);if(!entry)return undefined;
  try{const data=await unzipEntry(entry,{max:maxImage}),type=imageType(data);return type?new Blob([data],{type}):undefined}catch{return undefined}
 };
 const records=[],seen=new Set();let skipped=0,total=0;
 for(const entry of entries){
  if(!entry.name.startsWith(root)||!/^works\/[^/]+\.json$/.test(entry.name.slice(root.length)))continue;total++;
  try{
   const w=await text(entry,maxJson);
   if(!w||typeof w!=='object'||typeof w.id!=='string'||!ID.test(w.id)||seen.has(w.id))throw Error('id');
   const state=validate(w.state);state.id=w.id;
   const record={id:w.id,state,title:String(w.title??state.title??'').slice(0,120)||String(state.title||''),updated:Number.isFinite(w.updated)&&w.updated>0?w.updated:0,preview:null,art:null};
   if(typeof w.sourceId==='string'&&ID.test(w.sourceId))record.sourceId=w.sourceId;
   if(['natural','creative','faithful'].includes(w.generation))record.generation=w.generation;
   if(['generated','real'].includes(w.artKind))record.artKind=w.artKind;
   if(typeof w.prompt==='string')record.prompt=w.prompt.slice(0,4000);
   const art=await image(w.art);if(art===undefined)throw Error('art');record.art=art;
   const preview=await image(w.preview);if(preview===undefined)skipped++;record.preview=preview||null;
   if(!record.art)delete record.artKind;
   seen.add(w.id);records.push(record);
  }catch{skipped++}
 }
 return {records,skipped,total};
}
/** Restore rule: an incoming work replaces the stored one with its id only when it is newer. */
export const keepIncoming=(existing,incoming)=>!existing||!(Number(existing.updated)>=Number(incoming.updated));

/** `promise`, or a rejection with makeError() after `ms` (calling onTimeout first, e.g. to stop an image download). */
export function withTimeout(promise,ms,makeError=()=>Error('timeout'),onTimeout=null){
 let timer;
 return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>{try{onTimeout?.()}catch{}reject(makeError())},ms)})]).finally(()=>clearTimeout(timer));
}
/** The ids whose Promise.allSettled results were rejected, in order. */
export const failedIds=(ids,results)=>ids.filter((_,i)=>results[i]?.status==='rejected');
