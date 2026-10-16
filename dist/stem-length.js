// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** Opt-in photographic stem stretching. Old drafts retain their original split until edited. */
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
// The protected top contains the flower; only the lower photographed stem is resampled.
const lowerStem={rose:.62,camellia:.6,calla:.46,sakura:.7,eucalyptus:.72,cosmos:.58,pine:.7,iris:.56,pampas:.68,maple:.74,chrysanthemum:.57,ranunculus:.6};
export const supportsStemStretch=asset=>asset?.source==='generated-editorial'&&!asset.stems;
export function normalizeStemSplit(value,item,asset){
 if(!supportsStemStretch(asset)||!Number.isFinite(value))return null;
 const end=1-clamp(item?.trim||0,0,60)/100;
 return value>=.1&&value<=.9&&value<end-.015?value:null;
}
export function stemStretchSplit(item,asset){
 const stored=normalizeStemSplit(item?.stemSplit,item,asset);if(stored!==null)return stored;
 if(!supportsStemStretch(asset))return null;
 const end=Math.min(1-clamp(item?.trim||0,0,60)/100,Number.isFinite(item?.cropAnchorSourceY)?item.cropAnchorSourceY:1);
 const protectedTop=Math.max(asset.bendLimit??.4,(asset.tip?.[1]??.2)+.12);
 const split=Math.min(Math.max(lowerStem[asset.family]??.65,protectedTop),end-.08);
 return split>=protectedTop&&end-split>=.035?Math.round(split*10000)/10000:null;
}
/** A never-edited editorial photograph is 100%, even if the old solver stored an inert .9. */
export function stemLengthRatio(item,asset){
 return supportsStemStretch(asset)&&normalizeStemSplit(item?.stemSplit,item,asset)===null?1:(item?.length??1);
}
/** Called inside the existing slider checkpoint/input/persist lifecycle. */
export function setStemLength(item,asset,ratio){
 const split=stemStretchSplit(item,asset);if(split===null)return false;
 item.stemSplit=split;item.length=clamp(Number.isFinite(ratio)?ratio:1,.6,2.4);return true;
}
