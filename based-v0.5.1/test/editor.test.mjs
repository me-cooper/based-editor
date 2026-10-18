import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toolbarActions,insertion} from '../src/editor.mjs';
import {createRenderer} from '../src/index.mjs';
const apply=(id,text,start=0,end=text.length)=>{const c=insertion(toolbarActions.find(a=>a.id===id),{text,selectionStart:start,selectionEnd:end});return text.slice(0,c.start)+c.insert+text.slice(c.end);};
test('inline formatting wraps selection only',()=>{assert.equal(apply('bold','Hello world',6,11),'Hello **world**');assert.equal(apply('italic','hello'),'*hello*');assert.equal(apply('strike','hello'),'~~hello~~');});
test('line formatting includes entire touched lines and supports empty first line',()=>{assert.equal(apply('h2','First\nSecond',9,9),'First\n## Second');assert.equal(apply('ol','one\ntwo'),'1. one\n2. two');assert.equal(apply('h1','\nnext',0,0),'# Text\nnext');});
test('table and task toolbar output renders',()=>{const r=createRenderer();assert.match(r.in(apply('table','')),/<table>/);assert.match(r.in('- [ ] Todo\n- [x] Done'),/<input type="checkbox" disabled checked/);});
test('media plugin renders images video and audio with isolated wrappers',()=>{const r=createRenderer();const h=r.in('![Image](./a.png)\n\n![Video](./b.mp4)\n\n![Audio](./c.mp3)');assert.match(h,/<img src=".\/a.png"/);assert.match(h,/<video controls/);assert.match(h,/<audio controls/);assert.equal((h.match(/data-based-plugin="media"/g)||[]).length,3);assert.ok(r.actions.some(a=>a.command==='import-media'));});
test('single attach action and separate file elements',()=>{const r=createRenderer();assert.equal(r.actions.filter(a=>a.plugin==='media').length,1);assert.equal(r.actions.find(a=>a.plugin==='media').label,'Dateien anhängen');const h=r.in('![PDF](./report.pdf)\n\n![Archive](./data.zip)\n\n![No extension](./LICENSE)');assert.equal((h.match(/data-based-attachment/g)||[]).length,3);assert.doesNotMatch(h,/<img/);assert.match(h,/attachment-type">PDF/);assert.match(h,/attachment-type">DATEI/);});

test('3MF and unknown formats render a file action without fake image preview',()=>{const r=createRenderer();const h=r.in('![Modell](./Model.3mF)');assert.match(h,/attachment-type">3MF/);assert.match(h,/Im Finder anzeigen/);assert.doesNotMatch(h,/<img|<video|<audio/);});
