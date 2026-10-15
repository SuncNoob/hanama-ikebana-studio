// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
// New studio arrangements share one light direction, material treatment and vessel.
const arrangements={
 'pine-day':[{type:'editorial-pine',to:[-14,44]},{type:'editorial-calla',to:[16,32]},{type:'editorial-camellia',to:[-5,18]}],
 'cherry-day':[{type:'editorial-sakura',to:[-16,43],s:1.1},{type:'editorial-rose',to:[5,22]},{type:'editorial-eucalyptus',to:[21,28],s:.9,flip:true}],
 'iris-stone':[{type:'editorial-iris',to:[-10,37]},{type:'editorial-cosmos',to:[13,25],s:.85},{type:'editorial-eucalyptus',to:[-18,20],s:.8}],
 'maple-dusk':[{type:'editorial-maple',to:[-14,40]},{type:'editorial-chrysanthemum',to:[12,23],s:.9},{type:'editorial-ranunculus',to:[-5,17],s:.85}],
 'pampas-night':[{type:'editorial-pampas',to:[-10,45]},{type:'editorial-chrysanthemum',to:[12,22],s:.85},{type:'editorial-cosmos',to:[-16,23],s:.85}],
 'warm-dusk':[{type:'editorial-rose',to:[-12,30]},{type:'editorial-calla',to:[15,36],s:.9},{type:'editorial-eucalyptus',to:[-24,20],s:.85},{type:'editorial-cosmos',to:[13,20],s:.8}]
};
export function atelierCase(preset,study){return {...study,vessel:preset.id==='iris-stone'?'editorial-fluted':preset.id==='pampas-night'?'editorial-terracotta':'editorial-aubergine',items:arrangements[preset.id]||study.items,scene:preset.scene,light:preset.light};}
