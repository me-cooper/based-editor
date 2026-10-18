import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {parseHTML,DOMParser} from 'linkedom';
import {createCanvas} from '@napi-rs/canvas';
import {ThreeMFLoader} from 'three/addons/loaders/3MFLoader.js';
import chart from '../src/chart.mjs';
import {disposeObject} from '../src/three-mf.mjs';
globalThis.DOMParser=DOMParser;
test('real ThreeMFLoader parses supplied ZIP model to geometry',async()=>{
 const data=await fs.readFile(new URL('../fixtures/cube.3mf',import.meta.url)),buffer=data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength);
 const model=new ThreeMFLoader().parse(buffer);let vertices=0,meshes=0;model.traverse(node=>{if(node.isMesh){meshes++;vertices+=node.geometry.attributes.position.count;}});assert.ok(meshes>0);assert.ok(vertices>=8);disposeObject(model);
});
test('invalid 3MF is rejected by actual Three.js loader',async()=>{const data=await fs.readFile(new URL('../fixtures/invalid.3mf',import.meta.url));assert.throws(()=>new ThreeMFLoader().parse(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)));});
test('Chart.js draws pixels and UI changes type and data on native Canvas',async()=>{
 const text=JSON.stringify({title:'Node Chart Render',labels:['A','B','C'],values:[12,19,8],type:'bar'});
 const html=chart.content.render(text,'',{escape:s=>s});const {document,Event}=parseHTML('<html><body><div id="root">'+html+'</div></body></html>'),root=document.getElementById('root');
 const canvas=createCanvas(720,340),node=root.querySelector('canvas');node.getContext=type=>canvas.getContext(type);Object.defineProperty(root.querySelector('.type'),'value',{writable:true,value:'bar'});
 const disposers=[],events=[],controller=new AbortController();chart.mount(root,{data:{text},signal:controller.signal,onDispose:fn=>disposers.push(fn),emit:(name,detail)=>events.push({name,...detail})});
 assert.ok(events.some(e=>e.name==='chart:ready'));const pixels=canvas.getContext('2d').getImageData(0,0,720,340).data;assert.ok(pixels.some(v=>v>0));
 await fs.mkdir('validation',{recursive:true});await fs.writeFile('validation/chart-node.png',canvas.toBuffer('image/png'));
 const select=root.querySelector('.type');select.value='line';select.dispatchEvent(new Event('change'));assert.equal(events.at(-1).type,'line');
 root.querySelector('.data').value=JSON.stringify({title:'Updated',labels:['X','Y'],values:[4,9],type:'doughnut'});root.querySelector('.apply').dispatchEvent(new Event('click'));assert.equal(events.at(-1).type,'doughnut');assert.equal(root.querySelector('header strong').textContent,'Updated');
 root.querySelector('.data').value='broken';root.querySelector('.apply').dispatchEvent(new Event('click'));assert.match(root.querySelector('.status').textContent,/JSON/);
 controller.abort();disposers.forEach(fn=>fn());
});
test('embedded texture fixture contains a decodable PNG',async()=>{const {unzipSync}=await import('fflate');const {loadImage}=await import('@napi-rs/canvas');const zip=unzipSync(await fs.readFile(new URL('../fixtures/textured-cube.3mf',import.meta.url)));const image=await loadImage(Buffer.from(zip['3D/Textures/checker.png']));assert.equal(image.width,2);assert.equal(image.height,2);});
