import { DEFAULTS, PRESETS, hex, derive, normalize, resolveMode } from './palette.mjs';
const KEY='cloudCorrespondence';
let mounted=false, active=false, settings, panel, toggle, observer, railObserver, ctx, style, lastFocus, frame, undo=null;
const system=matchMedia('(prefers-color-scheme: dark)');
const ttHost=Boolean(window.__TAURITAVERN__);
const compact=matchMedia(ttHost?'(max-width: 1000px)':'(max-width: 767px)');
const root=document.documentElement;
let handlers;
const byId=id=>document.getElementById(id);
const mode=()=>resolveMode(settings.mode,system.matches);
const palette=()=>settings.palettes[mode()]||Object.fromEntries(['base','accent'].map(k=>[k,hex(getComputedStyle(root).getPropertyValue('--cc-'+k).trim())||DEFAULTS[mode()][k]]));
function save(){ctx.extensionSettings[KEY]=structuredClone(settings);ctx.saveSettingsDebounced();}
function change(update){undo=structuredClone(settings);update();settings=normalize(settings);save();apply();render();}
function apply(){
 if(!active)return;
 root.dataset.ccActive='';root.dataset.ccMode=mode();
 const entries=settings.palettes[mode()]?Object.entries(derive(...['base','accent'].map(k=>palette()[k]))).map(([k,v])=>'--cc-'+k+':'+v+';'):[];
 if(settings.depth!==null)entries.push('--cc-depth:'+settings.depth+';');
 if(settings.fontSize!==null)entries.push('--cc-font-size:'+settings.fontSize+'px;');
 if(settings.radius!==null)entries.push('--cc-radius:'+settings.radius+'px;');
 const css=':root[data-cc-active][data-cc-mode]{'+entries.join('')+'}';
 if(style.textContent!==css)style.textContent=css;
}
function render(){
 if(!panel)return;
 const p=palette();
 panel.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===settings.mode)));
 byId('cc-palette-title').textContent=mode()==='dark'?'石墨与微光':'云雾与柔光';
 for(const key of ['base','accent']){byId('cc-'+key).value=p[key];byId('cc-'+key+'-hex').value=p[key];byId('cc-'+key+'-hex').removeAttribute('aria-invalid');}
 const list=byId('cc-presets');list.replaceChildren();
 PRESETS[mode()].forEach(([name,base,accent])=>{
  const b=document.createElement('button');b.type='button';b.className='cc-swatch';b.title=name;b.setAttribute('aria-label','配色：'+name);b.setAttribute('aria-pressed',String(p.base===base&&p.accent===accent));
  b.style.setProperty('--swatch',base);b.style.setProperty('--dot',accent);
  const label=document.createElement('span');label.textContent=name;b.append(label);
  b.addEventListener('click',()=>change(()=>{settings.palettes[mode()]=base===DEFAULTS[mode()].base&&accent===DEFAULTS[mode()].accent?null:{base,accent};}));list.append(b);
 });
 for(const [key,id,value] of [['depth','cc-depth',1],['fontSize','cc-font',17],['radius','cc-radius',28]]){
  const token={depth:'--cc-depth',fontSize:'--cc-font-size',radius:'--cc-radius'}[key];
  const current=settings[key]??(parseFloat(getComputedStyle(root).getPropertyValue(token))||value);
  byId(id).value=current; byId(id+'-value').textContent=current+(key==='depth'?' ×':' px');
 }
 byId('cc-undo').disabled=!undo;
}
function close(){if(panel?.open)panel.close();toggle?.setAttribute('aria-expanded','false');lastFocus?.focus({preventScroll:true});}
function setMenu(expanded){
 root.toggleAttribute('data-cc-menu',expanded);
 const menu=byId('cc-mobile-menu');if(!menu)return;
 menu.setAttribute('aria-expanded',String(expanded));
 menu.title=expanded?'收起全部酒馆菜单':'展开全部酒馆菜单';menu.setAttribute('aria-label',menu.title);
 menu.querySelector('.cc-menu-label').textContent=expanded?'收起':'菜单';
}
function open(){
 if(!active||panel.open)return;
 lastFocus=document.activeElement;
 setMenu(false);
 render(); compact.matches?panel.showModal():panel.show();toggle.setAttribute('aria-expanded','true');
 byId('cc-close').focus({preventScroll:true});
}
function reconcile(){
 frame=undefined;
 const present=getComputedStyle(root).getPropertyValue('--cc-theme').trim()==='cloud-correspondence';
 if(present===active)return;
 active=present;
 byId('cc-appearance-button').hidden=!active;byId('cc-mobile-menu').hidden=!active;
 if(active){apply();render();}
 else{close();setMenu(false);root.removeAttribute('data-cc-active');root.removeAttribute('data-cc-mode');style.textContent='';}
}
function schedule(){if(!frame)frame=requestAnimationFrame(reconcile);}
function mount(){
 if(mounted||!byId('top-settings-holder'))return;
 mounted=true;handlers=new AbortController();ctx=SillyTavern.getContext();settings=normalize(ctx.extensionSettings[KEY]);
 if(ttHost)root.dataset.ccHost='tt';
 style=document.createElement('style');style.id='cc-runtime';document.head.append(style);
 const holder=document.createElement('div');holder.id='cc-appearance-button';holder.className='drawer';holder.hidden=true;
 toggle=document.createElement('button');toggle.type='button';toggle.id='cc-open';toggle.title='云间 · 外观';toggle.setAttribute('aria-label','云间外观');toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-expanded','false');toggle.innerHTML='<i class="fa-solid fa-palette" aria-hidden="true"></i>';holder.append(toggle);
 const menu=document.createElement('button');menu.id='cc-mobile-menu';menu.type='button';menu.innerHTML='<i class="fa-solid fa-bars" aria-hidden="true"></i><span class="cc-menu-label">菜单</span><i class="fa-solid fa-chevron-down cc-menu-chevron" aria-hidden="true"></i>';menu.hidden=true;
 byId('top-settings-holder').prepend(menu,holder);
 setMenu(false);
 railObserver=new ResizeObserver(()=>{if(active){const rect=byId('top-settings-holder').getBoundingClientRect();root.style.setProperty('--cc-menu-bottom',Math.ceil(rect.bottom+12)+'px');root.style.setProperty('--cc-menu-height',Math.ceil(rect.height+12)+'px');}});railObserver.observe(byId('top-settings-holder'));
 panel=document.createElement('dialog');panel.id='cc-panel';panel.setAttribute('aria-labelledby','cc-title');
 if(ttHost)panel.dataset.ttMobileSurface='fullscreen-window';
 panel.innerHTML=`<header class="cc-header"><div><span class="cc-eyebrow">CLOUD CORRESPONDENCE</span><h2 id="cc-title">云间 <span>· 外观</span></h2></div><button type="button" id="cc-close" aria-label="关闭外观面板"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header>
 <p class="cc-intro">让界面留一点柔软。</p>
 <div class="cc-segment" role="group" aria-label="明暗模式"><button type="button" data-mode="light">☀ 浅色</button><button type="button" data-mode="dark">☾ 深色</button><button type="button" data-mode="system">跟随系统</button></div>
 <section><h3 id="cc-palette-title">云雾与柔光</h3><div id="cc-presets" aria-label="精选配色"></div>
 <label class="cc-color-row" for="cc-base"><span>界面底色</span><input id="cc-base" type="color" aria-label="选择界面底色"><input id="cc-base-hex" aria-label="底色十六进制" maxlength="7" spellcheck="false"></label>
 <label class="cc-color-row" for="cc-accent"><span>强调色</span><input id="cc-accent" type="color" aria-label="选择强调色"><input id="cc-accent-hex" aria-label="强调色十六进制" maxlength="7" spellcheck="false"></label>
 <p class="cc-help">文字与阴影随底色自动配比。明暗配色分别保留。</p></section>
 <section class="cc-adjust"><h3>材质与阅读</h3><label for="cc-depth"><span>凹凸强度</span><output id="cc-depth-value">1 ×</output></label><input id="cc-depth" type="range" min="0.3" max="1.5" step="0.05">
 <label for="cc-font"><span>正文字号</span><output id="cc-font-value">17 px</output></label><input id="cc-font" type="range" min="14" max="22" step="1">
 <label for="cc-radius"><span>气泡圆角</span><output id="cc-radius-value">28 px</output></label><input id="cc-radius" type="range" min="14" max="36" step="1"></section>
 <footer><span id="cc-status" role="status">自动保存在当前酒馆账号</span><div class="cc-actions"><button type="button" id="cc-undo" disabled>撤销上一步</button><button type="button" id="cc-reset">恢复此模式</button></div></footer>`;
 document.body.append(panel);
 toggle.addEventListener('click',()=>panel.open?close():open());
 menu.addEventListener('click',()=>setMenu(!root.hasAttribute('data-cc-menu')));
 byId('cc-close').addEventListener('click',close);
 panel.addEventListener('cancel',e=>{e.preventDefault();close();});
 panel.addEventListener('click',e=>{if(compact.matches&&e.target===panel){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.open){e.preventDefault();close();}},{signal:handlers.signal});
 document.addEventListener('click',e=>{if(e.target.closest('.drawer-toggle')&&panel.open)close();},{signal:handlers.signal});
 panel.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>change(()=>{settings.mode=b.dataset.mode;})));
 for(const key of ['base','accent']){
  const update=value=>{if(!hex(value))return;change(()=>{settings.palettes[mode()]={...palette(),[key]:hex(value)};});};
  byId('cc-'+key).addEventListener('input',e=>update(e.target.value));
  byId('cc-'+key+'-hex').addEventListener('input',e=>{if(hex(e.target.value))update(e.target.value);});
  byId('cc-'+key+'-hex').addEventListener('change',e=>{if(!hex(e.target.value)){e.target.setAttribute('aria-invalid','true');byId('cc-status').textContent='请输入 # 加六位十六进制颜色';return;}update(e.target.value);byId('cc-status').textContent='自动保存在当前酒馆账号';});
 }
 for(const [id,key] of [['cc-depth','depth'],['cc-font','fontSize'],['cc-radius','radius']]){
  const el=byId(id);let before;
  el.addEventListener('pointerdown',()=>{before=structuredClone(settings);});
  el.addEventListener('input',()=>{if(!before)before=structuredClone(settings);settings[key]=Number(el.value);apply();byId(id+'-value').textContent=el.value+(key==='depth'?' ×':' px');});
  el.addEventListener('change',()=>{undo=before;before=null;save();render();});
 }
 byId('cc-reset').addEventListener('click',()=>change(()=>{settings.palettes[mode()]=null;settings.depth=null;settings.fontSize=null;settings.radius=null;}));
 byId('cc-undo').addEventListener('click',()=>{if(!undo)return;settings=undo;undo=null;save();apply();render();});
 system.addEventListener('change',()=>{apply();render();},{signal:handlers.signal});
 compact.addEventListener('change',()=>{setMenu(false);if(panel.open){panel.close();compact.matches?panel.showModal():panel.show();}},{signal:handlers.signal});
 observer=new MutationObserver(records=>{if(records.some(r=>r.target!==style&&!style.contains(r.target)))schedule();});
 observer.observe(document.head,{childList:true,subtree:true,characterData:true});
 ctx.eventSource.on(ctx.event_types.SETTINGS_UPDATED,schedule);reconcile();
}
export function activate(){if(globalThis.SillyTavern){const c=SillyTavern.getContext();c.eventSource.once(c.event_types.APP_READY,mount);}}
export function disable(){
 close();observer?.disconnect();railObserver?.disconnect();if(frame)cancelAnimationFrame(frame);frame=undefined;handlers?.abort();ctx?.eventSource.removeListener(ctx.event_types.SETTINGS_UPDATED,schedule);
 ['cc-appearance-button','cc-mobile-menu','cc-panel','cc-runtime'].forEach(id=>byId(id)?.remove());
 ['data-cc-active','data-cc-mode','data-cc-menu','data-cc-host'].forEach(a=>root.removeAttribute(a));root.style.removeProperty('--cc-menu-bottom');root.style.removeProperty('--cc-menu-height');active=false;mounted=false;undo=null;
}
activate();
