export const DEFAULTS = { light: {base:'#e3e9ef',accent:'#6575b6'}, dark: {base:'#292e32',accent:'#dfa46b'} };
export const PRESETS = {
 light:[['云雾','#e3e9ef','#6575b6'],['藤紫','#e9e5ef','#8873af'],['玫瑰','#eee4e6','#b27184'],['鼠尾草','#e2e9e4','#5d8776'],['燕麦','#ece6dc','#9b7853']],
 dark:[['石墨','#292e32','#dfa46b'],['暮紫','#302c38','#b5a2e2'],['深海','#242f3b','#86b7d9'],['松林','#28342f','#a7bf96'],['夜玫瑰','#382b31','#d9a2b5']]
};
export const hex = v => typeof v==='string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null;
const rgb = c => c.slice(1).match(/../g).map(v=>parseInt(v,16));
export const mix=(a,b,t)=>'#'+rgb(a).map((v,i)=>Math.round(v*(1-t)+rgb(b)[i]*t).toString(16).padStart(2,'0')).join('');
export const luminance=c=>rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
export const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
function legible(c,bg,target=4.5) {
 const end=contrast('#ffffff',bg)>contrast('#000000',bg)?'#ffffff':'#000000';
 for(let i=0;i<=100;i++){const value=mix(c,end,i/100);if(contrast(value,bg)>=target)return value;}
 return end;
}
export function derive(base,accent) {
 if(!hex(base)||!hex(accent))throw new TypeError('Expected six-digit hex colors');
 const dark=luminance(base)<.25;
 const ink=legible(dark?'#edf1f4':'#344353',base,7);
 return {base,accent,ink,muted:legible(mix(ink,base,.3),base),light:mix(base,'#ffffff',dark?.08:.64),shade:mix(base,'#101927',dark?.42:.17),edge:mix(base,'#ffffff',dark?.13:.68),'accent-ink':legible(accent,base),'on-accent':legible('#ffffff',accent),user:mix(base,accent,dark?.09:.08)};
}
const clamp=(v,min,max)=>v===null||v===undefined?null:Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):null;
export function normalize(raw={}) {
 if(!raw || typeof raw!=='object' || Array.isArray(raw))raw={};
 const palettes={...(raw.palettes||{})};
 for(const mode of ['light','dark']){
  const p=palettes[mode]; palettes[mode]=p&&hex(p.base)&&hex(p.accent)?{...p,base:hex(p.base),accent:hex(p.accent)}:null;
 }
 return {...raw,version:1,mode:['light','dark','system'].includes(raw.mode)?raw.mode:'light',palettes,depth:clamp(raw.depth,.3,1.5),fontSize:clamp(raw.fontSize,14,22),radius:clamp(raw.radius,14,36)};
}
export const resolveMode=(mode,darkSystem)=>mode==='system'?(darkSystem?'dark':'light'):mode;
