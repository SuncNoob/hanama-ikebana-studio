// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/**
 * Window light and time of day (B10, 窗光 · 时辰). DOM-free: every canvas comes from the injected `createCanvas`, so the
 * stage, the export and node tests share one painter. A light is optional (`s.light`); without one nothing here runs and
 * the draft looks exactly as before.
 *
 * The look has two parts:
 * - the room tone (paintLightAmbient): the wall, and for moonlight the floor, are multiplied a little darker so the light
 *   can read, plus a faint soft-light colour grade on the wall. It never touches the botanical layers.
 * - the window patch (lightPatch): four sheared panes of light on the wall at a small working size (≤180 px), with the
 *   arrangement's own silhouette, offset by the light's direction, cut out of it; a ×3 downsample gives the penumbra
 *   without ctx.filter (Safari). The patch is screened over the wall only (0 to the horizon).
 */

/**
 * The lights. `patch` is the colour of the window light, `strength` its screen opacity, `window` the window's box in the
 * working square [x0,y0,x1,y1] (fractions), `skew` how far the panes shear (fraction of their height), `dx`/`dy` the
 * shadow's offset (fractions; positive dx means light from the left), `ambient`/`floor` multiply colours for the wall and
 * the floor (null: unchanged) and `grade` a soft-light [colour, alpha ≤ .1] for the wall.
 */
export const LIGHTS=Object.freeze({
 morning:Object.freeze({patch:'#fff2d6',ambient:'#ddd8ca',floor:null,strength:.75,dx:.08,dy:.04,window:[.2,.1,.74,.7],skew:.2,grade:['#ffe2b0',.08]}),
 noon:Object.freeze({patch:'#ffffff',ambient:'#eceae3',floor:null,strength:.35,dx:.025,dy:.06,window:[.22,0,.82,.6],skew:.05,grade:null}),
 dusk:Object.freeze({patch:'#ffc489',ambient:'#d9cbb5',floor:'#f1e6d6',strength:.7,dx:.14,dy:.02,window:[.28,.18,.98,.74],skew:.35,grade:['#ff9a4a',.1]}),
 moon:Object.freeze({patch:'#9fb6d6',ambient:'#7d8a86',floor:'#a3ada9',strength:.38,dx:-.09,dy:.04,window:[.06,.08,.68,.7],skew:-.2,grade:['#5b78a8',.08]})
});
/** The light keys in menu order (after "none"). */
export const LIGHT_KEYS=Object.freeze(Object.keys(LIGHTS));
/** A stored light value as a LIGHTS key, or null for none or anything unknown (validate() keeps only a known key). */
export const lightOf=v=>typeof v==='string'&&Object.hasOwn(LIGHTS,v)?v:null;
/** Where the floor meets the wall, as a fraction of the frame height (compositor.js HORIZON). */
const WALL=.795;
/** The working size of the patch for a frame `size` px wide: a quarter of it, at most 180 px. */
export const lightWorkSize=size=>Math.max(24,Math.round(Math.min(180,size/4)));

/** The room tone for `key` over a painted background: wall (and floor) multiply, then the wall's soft-light grade. The
 floor tone is left out on the night scene, whose floor is already dark. */
export function paintLightAmbient(ctx,size,key,{horizon=WALL,night=false}={}){
 const L=LIGHTS[lightOf(key)];if(!L)return false;
 const wall=size*horizon;
 ctx.save();
 ctx.globalCompositeOperation='multiply';ctx.fillStyle=L.ambient;ctx.fillRect(0,0,size,wall);
 if(L.floor&&!night){ctx.fillStyle=L.floor;ctx.fillRect(0,wall,size,size-wall)}
 if(L.grade){ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=Math.min(.1,L.grade[1]);ctx.fillStyle=L.grade[0];ctx.fillRect(0,0,size,wall)}
 ctx.restore();
 return true;
}

/** The four sheared panes of the window (with mullions between them) as one path, in a working square of side S. */
function tracePanes(ctx,S,L){
 const [x0,y0,x1,y1]=L.window.map(v=>v*S),w=x1-x0,h=y1-y0,sk=L.skew*h,gap=S*.012,shear=y=>(y-y0)/h*sk;
 ctx.beginPath();
 for(const [px,py] of [[0,0],[1,0],[0,1],[1,1]]){
  const ax=x0+px*(w/2+gap/2),ay=y0+py*(h/2+gap/2),pw=w/2-gap/2,ph=h/2-gap/2;
  ctx.moveTo(ax+shear(ay),ay);ctx.lineTo(ax+pw+shear(ay),ay);ctx.lineTo(ax+pw+shear(ay+ph),ay+ph);ctx.lineTo(ax+shear(ay+ph),ay+ph);ctx.closePath();
 }
}

/**
 * The window patch for `key` in a new S×S canvas (transparent where no light falls), ready to be screened over the wall at
 * opacity LIGHTS[key].strength. `silhouette` is an S×S canvas holding the arrangement's shape (only its alpha is used) or
 * null; it is cut out of the light at the light's offset. A soft copy (downsampled ×3, so it upscales smooth) lies under a
 * sharper one at 60 %: a soft penumbra with a crisper core, like the light from a real window. Returns null without a light.
 */
export function lightPatch(key,S,silhouette,createCanvas){
 const L=LIGHTS[lightOf(key)];if(!L||!(S>0))return null;
 const light=createCanvas(S,S),lc=light.getContext('2d');if(!lc)return null;
 lc.fillStyle=L.patch;tracePanes(lc,S,L);lc.fill();
 if(silhouette){lc.globalCompositeOperation='destination-out';lc.drawImage(silhouette,L.dx*S,L.dy*S,S,S);lc.globalCompositeOperation='source-over'}
 const small=Math.max(1,Math.round(S/3)),soft=createCanvas(small,small),sc=soft.getContext('2d');
 const out=createCanvas(S,S),oc=out.getContext('2d');if(!sc||!oc)return light;
 sc.imageSmoothingEnabled=true;sc.drawImage(light,0,0,small,small);
 oc.imageSmoothingEnabled=true;oc.imageSmoothingQuality='high';oc.drawImage(soft,0,0,S,S);oc.globalAlpha=.6;oc.drawImage(light,0,0);
 return out;
}

/** Screen a lightPatch() canvas over the wall of a painted frame. */
export function screenLightPatch(ctx,size,key,patch,{horizon=WALL}={}){
 const L=LIGHTS[lightOf(key)];if(!L||!patch)return false;
 ctx.save();ctx.beginPath();ctx.rect(0,0,size,size*horizon);ctx.clip();
 ctx.globalCompositeOperation='screen';ctx.globalAlpha=L.strength;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(patch,0,0,size,size);ctx.restore();
 return true;
}

/**
 * The whole light over a painted background: room tone, then the window patch with the arrangement's shadow.
 * `paintSilhouette(ctx,S)` draws the arrangement (botanicals and vessel) at frame size S. `ambient: false` or
 * `patch: false` paints only the other part, so the ground shadows can go between them as on the stage (the room tone is
 * in the stage's scene layer, under the ground shadows; the patch is screened over that layer). Returns whether anything
 * was painted.
 */
export function paintLight(ctx,size,s,{paintSilhouette=null,createCanvas,horizon=WALL,ambient=true,patch:withPatch=true}={}){
 const key=lightOf(s?.light);if(!key||!createCanvas)return false;
 if(ambient)paintLightAmbient(ctx,size,key,{horizon,night:s.scene==='night'});
 if(!withPatch)return ambient;
 const S=lightWorkSize(size);let silhouette=null;
 if(paintSilhouette){silhouette=createCanvas(S,S);const sc=silhouette.getContext('2d');if(sc)paintSilhouette(sc,S);else silhouette=null}
 const patch=lightPatch(key,S,silhouette,createCanvas);
 screenLightPatch(ctx,size,key,patch,{horizon});
 for(const c of [silhouette,patch])if(c)try{c.width=c.height=0}catch{}
 return true;
}
