// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
export const materialColorGroups = [
  {id:'white', zh:'白', en:'White', ja:'白', pattern:/白|象牙|奶|乳|麦|white|cream|ivory/i},
  {id:'pink', zh:'粉', en:'Pink', ja:'ピンク', pattern:/粉|玫|珊瑚|pink|rose|blush|coral/i},
  {id:'red', zh:'红', en:'Red', ja:'赤', pattern:/红|莓|猩|red|burgundy|crimson|scarlet|berry|russet/i},
  {id:'warm', zh:'橙黄', en:'Gold', ja:'黄・橙', pattern:/橙|杏|黄|金|赭|orange|apricot|yellow|gold|chartreuse/i},
  {id:'purple', zh:'紫', en:'Purple', ja:'紫', pattern:/紫|violet|purple|mauve|lavender|lilac|orchid|magenta/i},
  {id:'blue', zh:'蓝', en:'Blue', ja:'青', pattern:/蓝|blue|cornflower/i},
  {id:'green', zh:'绿', en:'Green', ja:'緑', pattern:/绿|青|green|chartreuse/i},
  {id:'silver', zh:'银灰', en:'Silver', ja:'銀・灰', pattern:/银|灰|褐|黑|棕|silver|gray|grey|brown|russet/i}
];

export function matchesMaterialColor(specimen, groupId){
  if(groupId==='all')return true;
  const group=materialColorGroups.find(entry=>entry.id===groupId);
  return !!group&&group.pattern.test(`${specimen.color||''} ${specimen.colorEn||''}`);
}
