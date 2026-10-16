// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** Node mirror of app.js's asset map for the tests and the dev scripts in qa/ (never loaded by the site, no canvas dependency).
 The spread order below must match app.js `specimens` / `vessels`; tests/studies.test.mjs checks that against the app.js source. */
import {fileURLToPath} from 'node:url';
import {newSpecimens} from '../../dist/catalog.js?v=hn2';
import {photoSpecimens} from '../../dist/photo-catalog.js?v=25';
import {bookSpecimens} from '../../dist/book-catalog.js?v=25';
import {foliageSpecimens} from '../../dist/foliage-catalog.js?v=hn2';
import {studySpecimens} from '../../dist/study-catalog.js?v=hn2';
import {poseSpecimens} from '../../dist/pose-catalog.js?v=hn2';
import {additionalPoseSpecimens} from '../../dist/additional-pose-catalog.js?v=hn2';
import {bookVessels} from '../../dist/book-vessels.js?v=hn3';
import {newVessels} from '../../dist/vessels.js?v=hn3';
import {atelierSpecimens,atelierVessels} from '../../dist/editorial-catalog.js?v=1';
import {atelierSpecimens as legacyAtelierSpecimens,atelierVessels as legacyAtelierVessels} from '../../dist/atelier-catalog.js?v=1';
import {studies} from '../../dist/studies.js?v=hn3';
import {applyRealScale} from '../../dist/scale.js?v=scale4';
import {legacyFlowers,legacyVessels,scenes,applyTone} from '../../dist/legacy-catalog.js?v=quiet2';
import {createItem,buildStudyState,buildDemoItems} from '../../dist/study-state.js?v=scale4';

export const dist=fileURLToPath(new URL('../../dist/',import.meta.url));
/** Names of the spreads, in app.js order. */
export const specimenOrder=['atelierSpecimens','legacyAtelierSpecimens','photoSpecimens','bookSpecimens','legacyFlowers','newSpecimens','foliageSpecimens','studySpecimens','poseSpecimens','additionalPoseSpecimens'];
export const vesselOrder=['atelierVessels','legacyAtelierVessels','bookVessels','newVessels','legacyVessels'];
const lists={atelierSpecimens,atelierVessels,legacyAtelierSpecimens,legacyAtelierVessels,photoSpecimens,bookSpecimens,legacyFlowers,newSpecimens,foliageSpecimens,studySpecimens,poseSpecimens,additionalPoseSpecimens,bookVessels,newVessels,legacyVessels};
export const specimens=specimenOrder.flatMap(name=>lists[name]);
applyRealScale(specimens);
applyTone(specimens);
export const browseSpecimens=specimens.filter(a=>!bookSpecimens.includes(a));
export const familyOrder=[...new Set(browseSpecimens.map(a=>a.family))];
export const vessels=vesselOrder.flatMap(name=>lists[name]);
export const assetById=Object.fromEntries([...specimens,...vessels].map(a=>[a.id,a]));
export const specimenFor=family=>atelierSpecimens.find(a=>a.family===family)||photoSpecimens.find(a=>a.family===family)||bookSpecimens.find(a=>a.family===family)||newSpecimens.find(a=>a.family===family)||foliageSpecimens.find(a=>a.family===family)||legacyFlowers.find(a=>a.family===family);
/** Absolute file path of an asset image, using app.js's assetPath() extension rule. */
export const assetFile=id=>assetById[id]?.path?`${dist}${assetById[id].path.replace(/^\//,'')}`:`${dist}assets/${id}.${assetById[id]?.format||(assetById[id]?.source==='flower-book'?'webp':'png')}`;
let serial=0;
/** Same defaults as app.js makeItem, with deterministic ids. */
export const makeItem=(type,options={})=>createItem(assetById[type],type,`qa-${++serial}`,options);
/** The first-run draft as app.js initial() builds it (English title). */
export const initial=()=>({version:2,id:`qa-draft-${++serial}`,title:'Light & Flowers',subtitle:'',vessel:'editorial-aubergine',scene:'paper',light:'morning',mood:'静寂',generation:'natural',intention:'Like a morning breeze through the garden: quiet, natural, and gently imperfect.',items:buildDemoItems({assetById,makeItem,specimenFor})});
export const studyState=(study,lang='en')=>buildStudyState(study,{assetById,lang,makeItem,initial});
export {studies,scenes,bookSpecimens};
