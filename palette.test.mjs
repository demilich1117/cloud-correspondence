import test from 'node:test';
import assert from 'node:assert/strict';
import {derive,contrast,normalize,resolveMode,PRESETS} from './palette.mjs';
test('preset and extreme colors keep body, muted and accent text readable',()=>{
 for(const [base,accent] of [...Object.values(PRESETS).flat().map(p=>p.slice(1)),['#000000','#000000'],['#ffffff','#ffffff'],['#808080','#7f7f7f'],['#ff0000','#00ff00']]){
  const p=derive(base,accent);
  for(const k of ['ink','muted','accent-ink'])assert.ok(contrast(p[k],base)>=4.5,`${k} on ${base}`);
  assert.ok(contrast(p['on-accent'],accent)>=4.5);
 }
});
test('invalid settings are bounded without losing unrelated fields or sharing palettes',()=>{
 const input={future:true,mode:'bad',depth:9,fontSize:-2,radius:'invalid',palettes:{light:{base:'url(x)',accent:'#abcd00'},dark:{base:'#AbCDEF',accent:'#123456',extra:1}}};
 const p=normalize(input);assert.equal(p.future,true);assert.equal(p.mode,'light');assert.equal(p.depth,1.5);assert.equal(p.fontSize,14);assert.equal(p.radius,null);assert.equal(p.palettes.light,null);assert.equal(p.palettes.dark.base,'#abcdef');assert.equal(p.palettes.dark.extra,1);p.palettes.dark.base='#000000';assert.equal(input.palettes.dark.base,'#AbCDEF');
 assert.equal(normalize(null).depth,null);assert.equal(resolveMode('system',true),'dark');assert.equal(resolveMode('light',true),'light');
});
test('invalid color input cannot become CSS',()=>assert.throws(()=>derive('#fff;}', '#000000'),TypeError));
