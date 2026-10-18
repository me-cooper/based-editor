import {Events} from './events.mjs';
const reset=`:host{all:initial;display:inline;font:inherit;color:inherit;line-height:inherit;letter-spacing:normal;text-align:start;white-space:normal}:host([data-based-block]){display:block}*,*::before,*::after{box-sizing:border-box}`;
const views=new WeakMap();
function style(root,css){const node=root.ownerDocument.createElement('style');node.textContent=css;root.append(node);}
export function unmountPreview(host){const view=views.get(host);if(view){for(const instance of view.values())instance.dispose();views.delete(host);}}
export function mountPreview(host,html,{plugins,styles={},documentCSS='',sanitize,baseURL=null,events=new Events(),onError=()=>{}}){
 const root=host.shadowRoot||host.attachShadow({mode:'open'}),scroll=host.scrollTop,old=views.get(host)||new Map(),next=new Map(),counts=new Map();
 root.replaceChildren();style(root,documentCSS);
 const body=host.ownerDocument.createElement('div');body.innerHTML=sanitize(html);root.append(body);
 if(baseURL)for(const node of body.querySelectorAll('img[src],video[src],audio[src],source[src]')){const src=node.getAttribute('src');if(src&&!/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src))try{node.setAttribute('src',new URL(src,baseURL).href);}catch{node.removeAttribute('src');}}
 const map=new Map(plugins.filter(p=>p.enabled!==false).map(p=>[p.id,p]));
 for(const node of [...body.querySelectorAll('[data-based-plugin]')]){
  const plugin=map.get(node.dataset.basedPlugin);if(!plugin)continue;
  const css=plugin.design?.css??styles[plugin.design?.file]??'';
  const raw=node.dataset.basedFile||'',keyBase=JSON.stringify([plugin.id,raw,node.dataset.basedData,node.dataset.basedHtml,node.innerHTML,css,plugin.design?.stylesheets,baseURL]),index=counts.get(keyBase)||0,key=keyBase+':'+index;counts.set(keyBase,index+1);
  const existing=old.get(key);
  if(existing&&existing.mount===plugin.mount){node.replaceWith(existing.node);next.set(key,existing);old.delete(key);continue;}
  if(node.dataset.basedHtml){const template=node.ownerDocument.createElement('div');template.innerHTML=sanitize(decodeURIComponent(node.dataset.basedHtml));node.replaceChildren(...template.childNodes);}
  const content=[...node.childNodes],shadow=node.attachShadow({mode:'open'});node.replaceChildren();style(shadow,reset);
  for(const href of plugin.design?.stylesheets||[]){const link=node.ownerDocument.createElement('link');link.rel='stylesheet';link.href=href;shadow.append(link);}
  style(shadow,css);shadow.append(...content);
  const abort=new AbortController(),local=new Events();let disposed=false,cleanup=null;
  const emit=(name,detail={})=>{const payload={...detail,plugin:plugin.id};local.emit(name,payload);events.emit(name,payload);};
  const error=cause=>{if(disposed)return;const detail={message:cause?.message||String(cause)};emit('plugin:error',detail);onError(new Error(`Plugin ${plugin.id}: ${detail.message}`));const note=node.ownerDocument.createElement('p');note.textContent=detail.message;note.className='plugin-error';shadow.append(note);};
  let file=null,data=null;
  try{if(node.dataset.basedData)data=JSON.parse(decodeURIComponent(node.dataset.basedData));}catch(cause){error(cause);}
  try{if(raw){file=JSON.parse(decodeURIComponent(raw));file.url=baseURL?new URL(file.src,baseURL).href:file.url;
   const load=async type=>{try{const response=await fetch(file.url,{signal:abort.signal});if(!response.ok)throw Error('Datei konnte nicht geladen werden ('+response.status+').');const value=await response[type]();if(!disposed)emit('file:loaded',{file,bytes:type==='arrayBuffer'?value.byteLength:undefined});return value;}catch(cause){if(!disposed)emit('file:error',{file,message:cause.message});throw cause;}};
   file.arrayBuffer=()=>load('arrayBuffer');file.text=()=>load('text');file.blob=()=>load('blob');
  }}catch(cause){error(cause);}
  const register=fn=>{if(typeof fn!=='function')throw new TypeError('onDispose expects a function');if(disposed){fn();return;}const previous=cleanup;cleanup=()=>{try{previous?.();}finally{fn();}};};
  const instance={node,mount:plugin.mount,dispose(){if(disposed)return;disposed=true;abort.abort();try{cleanup?.();}catch(cause){events.emit('plugin:error',{plugin:plugin.id,message:cause.message});}emit('render:disposed',{file});local.clear();}};next.set(key,instance);
  if(plugin.mount){try{Promise.resolve(plugin.mount(shadow,{file,data,events,signal:abort.signal,on:(name,fn)=>local.on(name,fn),emit,onDispose:register})).then(fn=>{if(!disposed)emit('plugin:ready',{file});if(typeof fn==='function')register(fn);}).catch(error);}catch(cause){error(cause);}}
  emit('render:mounted',{file});
 }
 for(const instance of old.values())instance.dispose();views.set(host,next);host.scrollTop=scroll;return root;
}
