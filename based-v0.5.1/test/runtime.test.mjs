import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {parseHTML} from 'linkedom';
import {createRenderer} from '../src/index.mjs';
import {mountPreview,unmountPreview} from '../src/preview.mjs';
import {Events} from '../src/events.mjs';
import pluginStorage from '../app/plugin-store.cjs';
import {parseSTL} from '../plugin-examples/stl/lib/stl.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup(){const {document}=parseHTML('<html><body><div id="host"></div></body></html>');return document.getElementById('host');}
test('file handler claims extension and mounts arbitrary block HTML',async()=>{
 const host=setup(),r=createRenderer();let mounts=0,disposes=0,signal;
 r.add({id:'model',files:['3MF'],render:()=>'<section><h2>Model</h2><canvas></canvas></section>',mount(root,api){mounts++;signal=api.signal;assert.ok(root.querySelector('section canvas'));assert.equal(api.file.url,'based-media://token/notes/model.3mf');api.onDispose(()=>disposes++);}},0);
 const opts={plugins:r.pipeline,baseURL:'based-media://token/notes/',sanitize:x=>x,events:r.events};
 mountPreview(host,r.in('![Model](./model.3mf)'),opts);await tick();assert.equal(mounts,1);
 const first=host.shadowRoot.querySelector('[data-based-plugin="model"]');assert.ok(first.shadowRoot.querySelector('section'));assert.equal(host.shadowRoot.querySelector('section'),null);
 mountPreview(host,r.in('New paragraph\n\n![Model](./model.3mf)'),opts);assert.equal(mounts,1);assert.equal(host.shadowRoot.querySelector('[data-based-plugin="model"]'),first);
 mountPreview(host,r.in('Removed'),opts);assert.equal(disposes,1);assert.equal(signal.aborted,true);
});
test('file read emits loaded event and async cleanup runs on removal',async t=>{
 t.mock.method(globalThis,'fetch',async(url,{signal})=>{assert.match(url,/\.data$/);assert.equal(signal.aborted,false);return new Response('hello');});
 const host=setup(),r=createRenderer(),loaded=[];let cleanup=0;
 r.on('file:loaded',e=>loaded.push(e));
 r.add({id:'reader',files:['data'],render:()=>'<p>loading</p>',async mount(root,{file,on}){on('file:loaded',e=>assert.equal(e.file.name,'test.data'));root.querySelector('p').textContent=await file.text();return ()=>cleanup++;}},0);
 mountPreview(host,r.in('![Data](./test.data)'),{plugins:r.pipeline,baseURL:'based-media://token/',sanitize:x=>x,events:r.events});await tick();
 assert.equal(loaded.length,1);assert.equal(host.shadowRoot.querySelector('[data-based-plugin="reader"]').shadowRoot.querySelector('p').textContent,'hello');unmountPreview(host);assert.equal(cleanup,1);
});
test('mount error is contained and unknown formats still fall back',async()=>{const host=setup(),r=createRenderer(),errors=[];r.add({id:'bad',files:['bad'],render:()=>'<p>load</p>',mount(){throw Error('broken loader');}},0);mountPreview(host,r.in('![X](./x.bad)'),{plugins:r.pipeline,sanitize:x=>x,onError:e=>errors.push(e)});await tick();assert.match(errors[0].message,/broken loader/);assert.match(r.in('![Other](./x.unknown)'),/attachment/);});
test('event subscriptions are removable and listener errors do not stop others',()=>{const events=new Events();let value=0;const off=events.on('test',()=>value++);events.on('test',()=>{throw Error('listener');});assert.equal(events.emit('test',{}).length,1);off();events.emit('test',{});assert.equal(value,1);});
test('plugin package serves relative JS modules with proper MIME and blocks escaping',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'based-plugins-'));try{await fs.mkdir(path.join(dir,'package'));await fs.mkdir(path.join(dir,'package/lib'));await fs.writeFile(path.join(dir,'package/plugin.mjs'),'import "./lib/math.mjs";');await fs.writeFile(path.join(dir,'package/lib/math.mjs'),'export const x=1;');await fs.writeFile(path.join(dir,'secret.mjs'),'secret');const store=pluginStorage.pluginStore(),entry=store.register(path.join(dir,'package/plugin.mjs'));const response=await store.response(new Request(new URL('./lib/math.mjs',entry)));assert.match(response.headers.get('content-type'),/javascript/);assert.match(await response.text(),/export const x/);const blocked=await store.response(new Request(new URL('./..%2fsecret.mjs',entry)));assert.equal(blocked.status,403);}finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('example STL dependency parses geometry and rejects invalid data',()=>{const text='solid model\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 1 0 0\nvertex 0 1 0\nendloop\nendfacet\nendsolid';assert.equal(parseSTL(new TextEncoder().encode(text).buffer).length,1);assert.throws(()=>parseSTL(new Uint8Array([1,2,3]).buffer),/STL/);});
test('fence plugins receive original content and argument as mount data',()=>{const host=setup(),r=createRenderer();let received;r.add({id:'counter',content:{fence:'counter',render:()=>'<button>0</button>'},mount(root,{data}){received=data;root.querySelector('button').textContent=data.argument;}},0);mountPreview(host,r.in('```counter start\nbody\n```'),{plugins:r.pipeline,sanitize:x=>x});assert.equal(received.text,'body\n');assert.equal(received.argument,'start');});
test('late async initializers still clean up after disposal',async()=>{const host=setup(),r=createRenderer();let resolve,cleaned=0,signal;r.add({id:'late',files:['late'],render:()=>'<p>Loading</p>',async mount(root,api){signal=api.signal;await new Promise(r=>resolve=r);api.onDispose(()=>cleaned++);return ()=>cleaned++;}},0);mountPreview(host,r.in('![Late](./a.late)'),{plugins:r.pipeline,sanitize:x=>x});unmountPreview(host);assert.equal(signal.aborted,true);resolve();await tick();assert.equal(cleaned,2);});
