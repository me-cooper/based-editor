import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createRenderer,mountPreview,DOMPurify} from './runtime.mjs';
import model from '../plugins/three-mf/three-mf.mjs';
import chart from '../plugins/chart/chart.mjs';
test('actual DOMPurify preserves file and chart mount data in a browser DOM',{timeout:5000},async t=>{
 let finish;const ready=new Promise(resolve=>{finish=resolve;});const mark=name=>{seen.push(name);if(seen.length===2)finish();};
 const {window}=new JSDOM('<!doctype html><div id="host"></div>',{url:'https://based.test/'}),purify=DOMPurify(window),r=createRenderer(),seen=[];
 t.mock.method(globalThis,'fetch',async()=>new Response(await fs.readFile(new URL('../fixtures/cube.3mf',import.meta.url))));
 r.add({...model,async mount(root,{file,emit}){assert.ok(root.querySelector('.viewport'));assert.equal(file.extension,'3mf');assert.equal(file.url,'https://based.test/fixtures/cube.3mf');assert.ok((await file.arrayBuffer()).byteLength>0);mark('model');emit('model:ready');}},0);
 r.add({...chart,mount(root,{data,emit}){assert.ok(root.querySelector('.type'));assert.match(data.text,/"values"/);mark('chart');emit('chart:ready');}},0);
 const markdown='![Cube](./cube.3mf)\n\n```chart\n{"labels":["A"],"values":[1]}\n```';
 const errors=[];mountPreview(window.document.getElementById('host'),r.in(markdown),{plugins:r.pipeline,baseURL:'https://based.test/fixtures/',sanitize:html=>purify.sanitize(html),events:r.events,onError:error=>errors.push(error.message)});
 await ready;assert.deepEqual(errors,[]);assert.deepEqual(seen.sort(),['chart','model']);window.close();
});
