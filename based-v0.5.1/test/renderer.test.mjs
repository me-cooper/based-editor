import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRenderer,Renderer} from '../src/index.mjs';
test('Markdown and LaTeX',()=>{const r=createRenderer();const h=r.in('# Title\n\n$x^2$\n\n$$\n\\frac{1}{2}\n$$');assert.match(h,/<h1>Title/);assert.match(h,/katex-display/);assert.match(h,/katex/);assert.equal(r.pipeout(),h);});
test('pipeline edits and buffered input',()=>{const r=new Renderer();r.push({id:'a',run:t=>t+'a'}).add({id:'b',run:t=>t+'b'},0);assert.equal(r.pipein('x').in(),'xba');r.edit('b',{run:t=>t+'B'}).delete('a');assert.equal(r.in('x'),'xB');assert.throws(()=>r.push({id:'b',run:t=>t}),/Duplicate/);});
test('code stays literal, raw HTML is escaped',()=>{const r=createRenderer();const h=r.in('`$x$`\n\n```latex\n$x$\n```\n\n<script>alert(1)</script>');assert.doesNotMatch(h,/class="katex/);assert.match(h,/&lt;script/);});
test('parentheses and bracket delimiters',()=>{const r=createRenderer();assert.match(r.in('\\(x^2\\)'),/katex/);assert.match(r.in('\\[\nx^2\n\\]'),/katex-display/);});
test('unclosed and invalid formulas do not crash',()=>{const r=createRenderer();assert.match(r.in('price \\$5 and $unclosed'),/unclosed/);assert.match(r.in('$\\frac{$'),/katex-error/);});
test('external module and failures',async()=>{const r=createRenderer();const {default:plugin}=await import('../plugins/example.mjs');r.add(plugin,0);assert.match(r.in('```note\nhello\n```'),/data-based-plugin="note"/);r.add({id:'broken',run:()=>{throw Error('boom');}},0);assert.throws(()=>r.in('x'),/broken: boom/);assert.equal(r.pipeout(),'');});
