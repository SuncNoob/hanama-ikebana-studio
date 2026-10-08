// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/**
 * Share cards painted on a 2D context (A18). DOM-free: the caller hands in a context, the rendered draft and the words, so the
 * same code runs in the browser and in node (tests/share-cards.test.mjs uses a recording context). Text is measured and
 * wrapped with ctx.measureText; CJK lines may break between any two characters, Latin lines only at spaces.
 */
import {vesselGeometry} from './geometry.js?v=28';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
/** Characters a CJK line may not start with (kinsoku): they stay with the character before them. */
const NO_START=/^[，。、．・：；！？）」』】〕〉》’”%‰℃ー…\-–—,.;:!?)\]}]/;
/** Tokens for wrapping: runs of other characters (a no-break space joins them: "37 cm", "× 2"), single CJK characters and
 breakable spaces. */
function tokens(text){
 const out=[];
 for(const part of String(text).match(/[ \t\n]+|[^ \t\n\u3000-\u303f\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]+|./gu)||[]){
  if(out.length&&NO_START.test(part)&&!/^[ \t\n]/.test(out.at(-1)))out[out.length-1]+=part;else out.push(part);
 }
 return out;
}
const blank=token=>/^[ \t\n]+$/.test(token);
/** Lines of `text` no wider than `width` in the context's current font. A single token wider than the line is cut by character. */
export function wrapText(ctx,text,width){
 const lines=[];let line='';
 for(const token of tokens(text)){
  const next=line+token;
  if(!line||ctx.measureText(next).width<=width){line=blank(token)&&!line?'':next;continue}
  if(blank(token)){lines.push(line.trimEnd());line='';continue}
  lines.push(line.trimEnd());line=token;
  while(ctx.measureText(line).width>width&&line.length>1){let cut=line.length-1;while(cut>1&&ctx.measureText(line.slice(0,cut)).width>width)cut--;lines.push(line.slice(0,cut));line=line.slice(cut)}
 }
 if(line.trim())lines.push(line.trimEnd());
 return lines;
}
/** `text` cut to `width` with an ellipsis. */
export function fitText(ctx,text,width){
 let label=String(text);if(ctx.measureText(label).width<=width)return label;
 while(label&&ctx.measureText(label+'…').width>width)label=label.slice(0,-1);
 return label+'…';
}

/** Square crop (stage cm) around the crowns and the vessel: {sx, sy, side}. */
export function recipeFrame(recipe){
 const g=vesselGeometry(recipe.vessel.asset),bottom=g.top+g.height;
 let x0=g.left,x1=g.left+g.width,y0=g.top;
 for(const row of recipe.rows){x0=Math.min(x0,row.crown[0]);x1=Math.max(x1,row.crown[0]);y0=Math.min(y0,row.crown[1])}
 x0-=9;x1+=9;y0-=10;const y1=bottom+4;
 const side=clamp(Math.max(x1-x0,y1-y0),40,100),cx=(x0+x1)/2;
 return {sx:clamp(cx-side/2,0,100-side),sy:clamp(y1-side,0,100-side),side};
}

/** Per-language font stacks for cards: the serif artPoster uses for titles, and a sans for the small print. */
export const CARD_FONTS={
 zh:{serif:'"Noto Serif SC", "Songti SC", serif',sans:'"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif'},
 en:{serif:'Georgia, serif',sans:'-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Helvetica, Arial, sans-serif'},
 ja:{serif:'"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP", serif',sans:'"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif'}
};
export const cardFonts=lang=>CARD_FONTS[lang]||CARD_FONTS.zh;
const PALETTE={paper:'#f5f2e8',ink:'#354034',muted:'#6d7468',accent:'#a5533e',line:'#d9d6c9',marker:'#fffdf7'};
/**
 * The recipe card: the draft with numbered markers at the crowns, the shopping list beside it and the cut-and-place steps
 * below, sized to fit (the picture and the type shrink for long recipes).
 *  art     the rendered draft: an image or canvas of the whole 100 cm stage (any square size)
 *  recipe  arrangementRecipe() result (rows carry their crown point)
 *  labels  recipeLines() result plus optional {kicker, subtitle, brand, site}
 *  fonts   {serif, sans} CSS font-family lists
 * Returns the layout it chose: {imageSide, size, columns, frame}.
 */
export function paintRecipeCard(ctx,W,H,art,recipe,labels,fonts={}){
 const serif=fonts.serif||'Georgia, serif',sans=fonts.sans||'sans-serif',pad=Math.round(W*.06);
 ctx.save();
 ctx.fillStyle=PALETTE.paper;ctx.fillRect(0,0,W,H);
 ctx.textBaseline='alphabetic';ctx.textAlign='left';
 // Header: kicker, title, one line of subtitle or lineage.
 let y=pad+18;
 ctx.fillStyle=PALETTE.accent;ctx.font=`600 ${Math.round(W*.019)}px ${sans}`;ctx.fillText(fitText(ctx,labels.kicker||`HANAMA · ${labels.labels.title}`,W-2*pad),pad,y);
 y+=Math.round(W*.058);
 ctx.fillStyle=PALETTE.ink;ctx.font=`${Math.round(W*.046)}px ${serif}`;ctx.fillText(fitText(ctx,labels.title||labels.labels.title,W-2*pad),pad,y);
 if(labels.subtitle){y+=Math.round(W*.036);ctx.fillStyle=PALETTE.muted;ctx.font=`${Math.round(W*.021)}px ${sans}`;ctx.fillText(fitText(ctx,labels.subtitle,W-2*pad),pad,y)}
 const top=y+Math.round(W*.03),footerH=Math.round(W*.085),bottomLimit=H-pad-footerH;
 const frame=labels.frame||recipeFrame(recipe);
 // Pick the largest picture and type that hold everything.
 const rows=labels.rows,gap=Math.round(W*.035);
 const rowLines=(size,width)=>{ctx.font=`${size}px ${sans}`;return rows.map(row=>{
  const head=`${row.name} · ${row.cut}`,detail=[row.place,...row.notes].join('\u00a0· ');
  ctx.font=`600 ${size}px ${sans}`;const h=wrapText(ctx,head,width-size*1.9);
  ctx.font=`${size}px ${sans}`;const d=wrapText(ctx,detail,width-size*1.9);
  const w=[row.warn,row.unseated].filter(Boolean).flatMap(text=>wrapText(ctx,text,width-size*1.9));
  return {row,head:h,detail:d,warn:w,height:(h.length+d.length+w.length)*size*1.32+size*.55};
 })};
 // Legible steps come first: the largest type that fits with some picture size, the largest picture for that type. Short
 // recipes get phone-sized type (up to 30 px on the 1080 card) but keep a large picture; the longest (up to 24 stems) give up
 // picture before they would drop a step.
 const px=n=>Math.round(n*W/1080),sideOptions=[.56,.52,.48,.44,.4].map(f=>Math.round(W*f)),ladder=[[[30,28,26],sideOptions.slice(0,2)],[[24,23,22,21,20,19,18],sideOptions],[[17,16,15,14,13],[Math.round(W*.36)]],[[13,12],[.3,.26].map(f=>Math.round(W*f))]];
 let layout=null;
 const tryLayout=(size,imageSide)=>{
  const stepsTop=top+imageSide+gap+Math.round(W*.045),room=bottomLimit-stepsTop;
  for(const columns of rows.length>3?[1,2]:[1]){
   const colW=(W-2*pad-(columns-1)*gap)/columns,list=rowLines(size,colW);
   // Fill columns in order; each column holds what fits.
   let col=0,used=0,fits=true;
   for(const item of list){if(used+item.height>room&&used>0){col++;used=0}if(col>=columns||item.height>room){fits=false;break}used+=item.height}
   if(fits)return {imageSide,size,columns,colW,list,stepsTop};
  }
  return null;
 };
 for(const [sizes,sides] of ladder){for(const n of sizes){for(const imageSide of sides)if((layout=tryLayout(px(n),imageSide)))break;if(layout)break}if(layout)break}
 if(!layout){const size=px(13),columns=2,colW=(W-2*pad-gap)/2,imageSide=Math.round(W*.36);layout={imageSide,size,columns,colW,list:rowLines(size,colW),stepsTop:top+imageSide+gap+Math.round(W*.045),clipped:true}}
 const {imageSide,size,columns,colW,list,stepsTop}=layout;
 // The picture.
 const ix=pad,iy=top,scale=imageSide/frame.side,artSize=art.width||art.naturalWidth||1600,k=artSize/100;
 ctx.fillStyle='#ffffff';ctx.fillRect(ix-1,iy-1,imageSide+2,imageSide+2);
 ctx.drawImage(art,frame.sx*k,frame.sy*k,frame.side*k,frame.side*k,ix,iy,imageSide,imageSide);
 ctx.strokeStyle=PALETTE.line;ctx.lineWidth=1;ctx.strokeRect(ix-.5,iy-.5,imageSide+1,imageSide+1);
 // Numbered markers just above-right of each crown, nudged apart when they would overlap.
 const r=Math.max(11,Math.round(W*.016)),placed=[];
 for(const row of recipe.rows){
  let mx=clamp(ix+(row.crown[0]-frame.sx)*scale+r*.9,ix+r+2,ix+imageSide-r-2),my=clamp(iy+(row.crown[1]-frame.sy)*scale-r*.9,iy+r+2,iy+imageSide-r-2);
  for(let tries=0;tries<12&&placed.some(([px,py])=>Math.hypot(px-mx,py-my)<r*2.1);tries++)my=clamp(my+r*2.2,iy+r+2,iy+imageSide-r-2);
  placed.push([mx,my]);
  ctx.beginPath();ctx.arc(mx,my,r,0,Math.PI*2);ctx.fillStyle=PALETTE.marker;ctx.globalAlpha=.94;ctx.fill();ctx.globalAlpha=1;
  ctx.lineWidth=Math.max(1.5,r*.12);ctx.strokeStyle=row.seated?PALETTE.accent:PALETTE.ink;ctx.stroke();
  ctx.fillStyle=PALETTE.accent;ctx.font=`700 ${Math.round(r*1.15)}px ${sans}`;ctx.textAlign='center';ctx.fillText(String(row.n),mx,my+r*.42);ctx.textAlign='left';
 }
 // Beside the picture: what to buy and the vessel.
 const sx=ix+imageSide+gap,sw=W-pad-sx,sBottom=iy+imageSide;
 const sideBlock=gs=>{
  const out=[];ctx.font=`${gs}px ${sans}`;
  for(const text of labels.groups)out.push({kind:'group',lines:wrapText(ctx,text,sw-gs*1.2)});
  out.push({kind:'vessel',lines:wrapText(ctx,labels.vessel,sw)});
  const height=gs*1.7+out.reduce((n,b)=>n+b.lines.length*gs*1.3+gs*.45,0)+gs*1.8;
  return {gs,out,height};
 };
 let block=null;for(let gs=Math.max(Math.round(W*.022),Math.min(size,px(26)));gs>=Math.round(W*.0125);gs--){block=sideBlock(gs);if(block.height<=imageSide)break}
 let by=iy+block.gs*.95;const gs=block.gs;
 ctx.fillStyle=PALETTE.accent;ctx.font=`600 ${Math.round(gs*.9)}px ${sans}`;ctx.fillText(fitText(ctx,labels.labels.need,sw),sx,by);by+=gs*.75;
 recipe.groups.forEach((group,i)=>{
  const b=block.out[i];if(by+gs>sBottom)return;
  ctx.fillStyle=group.asset.swatch||'#8d927f';ctx.beginPath();ctx.arc(sx+gs*.35,by+gs*.62,gs*.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=PALETTE.ink;ctx.font=`${gs}px ${sans}`;
  for(const line of b.lines){by+=gs*1.3;if(by>sBottom)break;ctx.fillText(line,sx+gs*1.2,by)}
  by+=gs*.45;
 });
 const vb=block.out.at(-1);by+=gs*.6;
 if(by+gs*2<sBottom){
  ctx.fillStyle=PALETTE.accent;ctx.font=`600 ${Math.round(gs*.9)}px ${sans}`;ctx.fillText(fitText(ctx,labels.labels.vessel,sw),sx,by+gs);by+=gs*1.05;
  ctx.fillStyle=PALETTE.ink;ctx.font=`${gs}px ${sans}`;for(const line of vb.lines){by+=gs*1.3;if(by>sBottom)break;ctx.fillText(line,sx,by)}
 }
 // Steps.
 ctx.fillStyle=PALETTE.accent;ctx.font=`600 ${Math.round(W*.02)}px ${sans}`;ctx.fillText(fitText(ctx,labels.labels.steps,W-2*pad),pad,stepsTop-Math.round(W*.018));
 ctx.strokeStyle=PALETTE.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,stepsTop-Math.round(W*.008));ctx.lineTo(W-pad,stepsTop-Math.round(W*.008));ctx.stroke();
 const room=bottomLimit-stepsTop;let col=0,cy=stepsTop;
 for(const item of list){
  if(cy-stepsTop+item.height>room&&cy>stepsTop){col++;cy=stepsTop}
  if(col>=columns)break;
  const cx=pad+col*(colW+gap),tx=cx+size*1.9;let ly=cy+size*1.05;
  ctx.beginPath();ctx.arc(cx+size*.7,cy+size*.68,size*.68,0,Math.PI*2);ctx.fillStyle=item.row.unseated?PALETTE.ink:PALETTE.accent;ctx.fill();
  ctx.fillStyle=PALETTE.marker;ctx.font=`700 ${Math.round(size*.8)}px ${sans}`;ctx.textAlign='center';ctx.fillText(String(item.row.n),cx+size*.7,cy+size*.96);ctx.textAlign='left';
  ctx.fillStyle=PALETTE.ink;ctx.font=`600 ${size}px ${sans}`;for(const line of item.head){ctx.fillText(line,tx,ly);ly+=size*1.32}
  ctx.fillStyle=PALETTE.muted;ctx.font=`${size}px ${sans}`;for(const line of item.detail){ctx.fillText(line,tx,ly);ly+=size*1.32}
  ctx.fillStyle=PALETTE.accent;for(const line of item.warn){ctx.fillText(line,tx,ly);ly+=size*1.32}
  cy+=item.height;
 }
 // Footer: the seal, the site and the honesty line.
 const fy=H-pad-footerH+Math.round(W*.03),seal=Math.round(W*.042);
 ctx.fillStyle=PALETTE.accent;ctx.fillRect(pad,fy,seal,seal);ctx.fillStyle=PALETTE.paper;ctx.font=`${Math.round(seal*.68)}px "Songti SC", "Noto Serif SC", "Hiragino Mincho ProN", ${serif}`;ctx.textAlign='center';ctx.fillText(labels.brand||'花',pad+seal/2,fy+seal*.74);ctx.textAlign='left';
 const fx=pad+seal+Math.round(W*.018),fw=W-pad-fx;
 ctx.fillStyle=PALETTE.muted;ctx.font=`${Math.round(W*.0165)}px ${sans}`;
 const foot=wrapText(ctx,labels.footer,fw).slice(0,2);
 ctx.fillText(fitText(ctx,labels.site||'HANAMA · flowerist.org',fw),fx,fy+Math.round(W*.016));
 foot.forEach((line,i)=>ctx.fillText(line,fx,fy+Math.round(W*.016)+(i+1)*Math.round(W*.022)));
 ctx.restore();
 return {imageSide,size,columns,frame,clipped:!!layout.clipped};
}
