import {createRenderer,mountPreview,DOMPurify} from './runtime.mjs';
import model from '../plugins/three-mf/three-mf.mjs';
import chart from '../plugins/chart/chart.mjs';
const css=await Promise.all(['../plugins/three-mf/three-mf.css','../plugins/chart/chart.css'].map(url=>fetch(url).then(r=>r.text())));
model.design={css:css[0]};chart.design={css:css[1]};
const renderer=createRenderer();renderer.add(model,0).add(chart,0);
const host=document.getElementById('preview'),events=[],errors=[];
for(const name of ['plugin:ready','file:loaded','model:ready','render:disposed','chart:ready','chart:changed','model:wireframe'])renderer.on(name,event=>events.push({name,...event}));
window.app={
 events,errors,
 set(text){mountPreview(host,renderer.in(text),{plugins:renderer.pipeline,baseURL:location.origin+'/fixtures/',events:renderer.events,documentCSS:':host{display:block;font:15px/1.6 sans-serif;color:#dce1d7}',sanitize:html=>DOMPurify.sanitize(html),onError:error=>errors.push(error.message)});},
 actions:renderer.actions,
 status(){return [...host.shadowRoot.querySelectorAll('[data-based-plugin]')].map(node=>({id:node.dataset.basedPlugin,text:node.shadowRoot?.textContent.slice(-200)}));}
};
window.app.ready=true;
