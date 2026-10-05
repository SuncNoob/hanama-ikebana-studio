// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** The first-generation catalogue that predates the photo libraries, plus the scene palettes and the shared colour correction.
 Moved verbatim out of app.js so node tests and dev scripts can build the same asset map; app.js imports them unchanged. */
export const legacyFlowers=[
 {id:'sakura',family:'sakura',name:'樱花',en:'Cherry blossom',group:'branch',color:'淡粉',pose:'原版花枝',swatch:'#dfb7bc',height:53,width:350,heightPx:493,anchor:.469,split:.56,thumbnail:true},
 {id:'calla',family:'calla',name:'马蹄莲',en:'Calla lily',group:'bloom',color:'象牙白',pose:'原版正面',swatch:'#ebe7d3',height:49,width:201,heightPx:470,anchor:.259,split:.4,thumbnail:true},
 {id:'chrysanthemum',family:'chrysanthemum',name:'秋菊',en:'Chrysanthemum',group:'bloom',color:'赭橙',pose:'原版正面',swatch:'#bc692f',height:35,width:269,heightPx:486,anchor:.531,split:.58,thumbnail:true},
 {id:'pine',family:'pine',name:'松枝',en:'Pine branch',group:'branch',color:'松绿',pose:'原版虬枝',swatch:'#596a45',height:57,width:394,heightPx:495,anchor:.443,split:.6,thumbnail:true},
 {id:'maple',family:'maple',name:'枫枝',en:'Japanese maple',group:'branch',color:'秋红',pose:'原版舒展',swatch:'#98483e',height:45,width:432,heightPx:472,anchor:.534,split:.65,thumbnail:true},
 {id:'pampas',family:'pampas',name:'蒲苇',en:'Pampas grass',group:'branch',color:'麦白',pose:'自然穗形',swatch:'#d4c5ae',height:58,width:223,heightPx:501,anchor:.404,split:.6,thumbnail:true}
];
/** The two original vessels (listed after the book and new vessels, as before). */
export const legacyVessels=[
 {id:'round',name:'窑变圆瓶',shortName:'窑变圆瓶',en:'Bronze and blue glazed round ceramic vase',color:'窑变釉',colorEn:'variegated bronze-blue glaze',height:23,width:748,heightPx:734,group:'low',style:'japanese',mouth:[.5,.05],insertion:[50,66],openings:[{shape:'ellipse',center:[.5,.05],radius:[.12,.025],frontRimY:.09}],fixture:{kind:'neck',visibility:'hidden',name:'瓶口支撑',en:'Concealed neck support',prompt:'The small glazed neck itself supports the stems below the rim; no separate support is visible.'}},
 {id:'bottle',name:'褐釉长颈瓶',shortName:'褐釉长颈瓶',en:'Dark brown glazed bottle vase',color:'褐釉',colorEn:'dark brown glaze',height:29,width:818,heightPx:978,group:'tall',style:'japanese',mouth:[.5,.04],insertion:[50,60],openings:[{shape:'ellipse',center:[.5,.04],radius:[.13,.024],frontRimY:.075}],fixture:{kind:'neck',visibility:'hidden',name:'瓶口支撑',en:'Concealed neck support',prompt:'The narrow glazed neck itself supports the stems below the rim; no separate support is visible.'}}
];
/** Scene palettes: [wall, floor, zh description, en description]. validate() accepts exactly these keys. */
export const scenes={paper:['#f5f4ef','#dedfd7','温暖的米灰色石灰墙与浅色石台','warm greige limewash wall and pale stone surface'],stone:['#e2e6e2','#aeb9b2','青灰色墙面与自然石台','blue-gray wall and natural stone surface'],night:['#566259','#27312b','深墨绿色背景与沉静的暗调光影','deep ink-green backdrop with subdued dark tones']};
/** Modest color correction is shared by the canvas and exported artwork; original files remain intact. */
export const saturationTune={ 'photo-poppy':.78,'photo-ranunculus':.82,'photo-anemone':.88,'photo-cosmos':.88,'photo-dahlia':.86,'photo-zinnia':.86,'photo-celosia':.86,'photo-sunflower':.9,'photo-aster':.9,'photo-peony':.89,'photo-cornflower':.9,'photo-chrysanthemum':.9 };
/** Apply saturationTune to a specimen list in place (the same loop app.js ran inline). */
export function applyTone(specimens){for(const asset of specimens)if(saturationTune[asset.id])asset.saturation=saturationTune[asset.id];return specimens}
