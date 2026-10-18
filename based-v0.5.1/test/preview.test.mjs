import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseHTML} from 'linkedom';
import {createRenderer,Renderer} from '../src/index.mjs';
import {mountPreview} from '../src/preview.mjs';
const documentCSS=await fs.readFile(new URL('../app/document.css',import.meta.url),'utf8');
function setup(){const {document}=parseHTML('<html><head></head><body><strong class="brand">based.</strong><div id="preview"></div></body></html>');return {document,host:document.getElementById('preview')};}
test('document and each plugin have separate shadow roots and scoped styles',()=>{
 const {document,host}=setup(),r=createRenderer(),html=r.in('**Bold**\n\n$x$\n\n```calendar 2026-10\n```');
 const plugins=r.pipeline.map(p=>({...p,design:{...p.design,css:p.id==='latex'?'.katex {color:red}':'strong {font-size:12px}'}}));
 const root=mountPreview(host,html,{plugins,documentCSS,sanitize:x=>x});
 assert.equal(document.querySelector('table'),null);assert.equal(document.querySelector('.katex'),null);
 assert.equal(root.querySelector('strong').textContent,'Bold');
 assert.equal(root.querySelector('.katex'),null);
 const latex=root.querySelector('[data-based-plugin="latex"]'),calendar=root.querySelector('[data-based-plugin="calendar"]');
 assert.ok(latex.shadowRoot.querySelector('.katex'));assert.ok(calendar.shadowRoot.querySelector('table'));
 assert.match(latex.shadowRoot.querySelectorAll('style')[1].textContent,/color:red/);
 assert.doesNotMatch(calendar.shadowRoot.querySelectorAll('style')[1].textContent,/color:red/);
 assert.equal(latex.childNodes.length,0);assert.equal(calendar.childNodes.length,0);
 assert.equal(root.querySelectorAll('style').length,1);assert.match(root.querySelector('style').textContent,/strong,b \{ font-size:inherit/);
 assert.equal(document.querySelectorAll('style').length,0);
});
test('re-render replaces stale roots, preserves scroll and calls sanitizer',()=>{
 const {host}=setup(),r=createRenderer();let calls=0;
 const opts={plugins:r.pipeline,documentCSS,sanitize:html=>{calls++;return html;}};
 const root=mountPreview(host,r.in('$x$'),opts);host.scrollTop=42;
 mountPreview(host,r.in('**new**'),opts);
 assert.equal(host.shadowRoot,root);assert.equal(root.querySelector('[data-based-plugin]'),null);assert.equal(root.querySelector('strong').textContent,'new');assert.equal(host.scrollTop,42);assert.equal(calls,2);
});
test('declarative fence plugins get wrappers and actions without app changes',()=>{
 const r=createRenderer();r.add({id:'box',design:{css:'strong {color:blue}'},actions:[{id:'new',label:'Box einfügen',insert:'```box\nhi\n```'}],content:{fence:'box',render:(text,args,{escape})=>'<strong>'+escape(text)+'</strong>'}},0);
 const {host}=setup();mountPreview(host,r.in('```box\n<img src=x>\n```'),{plugins:r.pipeline,sanitize:x=>x});
 const box=host.shadowRoot.querySelector('[data-based-plugin="box"]');assert.ok(box.shadowRoot);assert.equal(box.shadowRoot.querySelector('strong').textContent,'<img src=x>\n');assert.equal(box.shadowRoot.querySelector('img'),null);assert.equal(r.actions.find(a=>a.plugin==='box').label,'Box einfügen');
});
test('plugin metadata is validated and returned copies cannot mutate pipeline',()=>{
 const r=new Renderer([{id:'box',content:{fence:'box',render:()=>''},design:{css:'p{}'},actions:[{id:'a',label:'Add',insert:'x'}]}]);
 const copy=r.pipeline;copy[0].design.css='bad';copy[0].actions[0].label='bad';copy[0].content.fence='bad';
 assert.equal(r.pipeline[0].content.fence,'box');assert.equal(r.pipeline[0].design.css,'p{}');assert.equal(r.actions[0].label,'Add');
 assert.throws(()=>r.add({id:'oops',run:t=>t,actions:[{id:'a',label:'Missing insert'}]}),/Action needs/);
 assert.throws(()=>r.edit('box',{content:null,run:null}),/Plugin needs/);
});
test('preview resolves media against Markdown file rather than app or selected folder',()=>{const {host}=setup(),r=createRenderer();const html=r.in('![A](../assets/a.png)\n\n![Video](./clip.mp4)');mountPreview(host,html,{plugins:r.pipeline,sanitize:x=>x,baseURL:'based-media://token/notes/'});const items=host.shadowRoot.querySelectorAll('[data-based-plugin="media"]');assert.equal(items[0].shadowRoot.querySelector('img').getAttribute('src'),'based-media://token/assets/a.png');assert.equal(items[1].shadowRoot.querySelector('video').getAttribute('src'),'based-media://token/notes/clip.mp4');assert.match(html,/src="\.\/clip.mp4"/);});
