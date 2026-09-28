// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
// Separate transparent botanical studies, each generated as its own asset.
// These supplement, rather than replace, the original Flower Book photographs.
export const studySpecimens = [
 {id:'study-sedum-bud',family:'sedum',name:'景天',en:'Stonecrop',ja:'セダム',group:'bloom',color:'玫粉',colorEn:'dusty rose',colorJa:'くすみローズ',swatch:'#a46578',pose:'含苞双枝',poseEn:'Two budding heads',poseJa:'二輪のつぼみ',height:42,anchor:.51},
 {id:'study-dahlia-side',family:'dahlia',name:'大丽花',en:'Dahlia',ja:'ダリア',group:'bloom',color:'珊瑚杏',colorEn:'coral apricot',colorJa:'珊瑚色の杏',swatch:'#d79074',pose:'半开侧面',poseEn:'Half-open side view',poseJa:'半開きの横顔',height:39,anchor:.52},
 {id:'study-rose-half-open',family:'rose',name:'玫瑰',en:'Rose',ja:'バラ',group:'bloom',color:'玫粉',colorEn:'dusty rose pink',colorJa:'くすみローズ',swatch:'#c78393',pose:'半开斜视',poseEn:'Half-open oblique view',poseJa:'半開きの斜め姿',height:40,anchor:.52},
 {id:'study-peony-early',family:'peony',name:'芍药',en:'Peony',ja:'芍薬',group:'bloom',color:'乳白',colorEn:'warm ivory',colorJa:'温かみのある白',swatch:'#e7e0ce',pose:'初开侧垂',poseEn:'Early side-opening bloom',poseJa:'咲き始めの横顔',height:42,anchor:.43},
 {id:'study-chrysanthemum-late',family:'chrysanthemum',name:'菊花',en:'Chrysanthemum',ja:'菊',group:'bloom',color:'暖白',colorEn:'warm white',colorJa:'温かな白',swatch:'#e6dfc9',pose:'舒展侧面',poseEn:'Loose side bloom',poseJa:'横に広がる花',height:40,anchor:.45},
 {id:'study-hydrangea-transition',family:'hydrangea',name:'绣球',en:'Hydrangea',ja:'アジサイ',group:'bloom',color:'蓝紫绿',colorEn:'blue violet and green',colorJa:'青紫と緑',swatch:'#8b8ca9',pose:'半开斜视',poseEn:'Transitional half-bloom',poseJa:'咲き途中の斜め姿',height:43,anchor:.55}
].map(a=>({...a,source:'generated-botanical-study',format:'png',width:1024,heightPx:1536,split:.64,thumbnail:false}));
