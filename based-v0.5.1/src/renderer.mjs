import MarkdownIt from 'markdown-it';
import {Events} from './events.mjs';
const copy = step => ({...step, ...(step.files?{files:[...step.files]}:{}), ...(step.content && typeof step.content==='object'?{content:{...step.content}}:{}), ...(step.design ? {design:{...step.design, ...(step.design.stylesheets?{stylesheets:[...step.design.stylesheets]}:{})}}:{}), ...(step.actions?{actions:step.actions.map(action=>({...action}))}:{})});
function validate(step) {
  if (!step || !/^[a-z][a-z0-9_-]*$/i.test(step.id || '')) throw new TypeError('Plugin needs a simple id (letters, numbers, - or _)');
  const content = step.content;
  if (typeof content !== 'function' && !(content && typeof content.fence==='string' && typeof content.render==='function') && typeof step.run!=='function' && !(Array.isArray(step.files)&&typeof step.render==='function')) throw new TypeError('Plugin needs content(text, context), content: {fence, render}, or run(text, context)');
  if(step.design && (typeof step.design!=='object' || (step.design.css!==undefined && typeof step.design.css!=='string'))) throw new TypeError('design needs {css} or {file}');
  if(step.design?.stylesheets!==undefined && (!Array.isArray(step.design.stylesheets)||step.design.stylesheets.some(s=>typeof s!=='string')))throw new TypeError('design.stylesheets must contain CSS URLs');
  if(step.actions!==undefined){
    if(!Array.isArray(step.actions))throw new TypeError('actions must be an array');
    const ids=new Set();
    for(const a of step.actions){if(!a || typeof a.id!=='string' || !a.id || ids.has(a.id) || typeof a.label!=='string' || !a.label || (!['string','function'].includes(typeof a.insert)&&typeof a.command!=='string'))throw new TypeError('Action needs unique id, label and insert (text or function) or command');ids.add(a.id);}
  }
  if(step.files && (!Array.isArray(step.files)||step.files.some(ext=>typeof ext!=='string'||!ext)))throw new TypeError('files must contain extensions');
  if(step.mount!==undefined&&typeof step.mount!=='function')throw new TypeError('mount must be a function');
  return copy(step);
}
function execute(step,text,context){
  if(typeof step.content==='function')return step.content(text,context);
  if(step.content && typeof step.content.render==='function'){
    const {fence,render}=step.content,md=context.markdown,previous=md.renderer.rules.fence;
    md.renderer.rules.fence=(tokens,i,options,env,self)=>{
      const token=tokens[i],match=/^(\S+)(?:\s+([\s\S]*))?$/.exec(token.info.trim());
      if(match?.[1]!==fence)return previous(tokens,i,options,env,self);
      const html=render(token.content,match[2]||'',context);
      if(typeof html!=='string')throw new TypeError('content.render must return HTML as a string');
      return context.wrap(html,{block:true,data:{text:token.content,argument:match[2]||''}})+'\n';
    };return text;
  }
  return step.run?step.run(text,context):text;
}
export class Renderer {
  events=new Events();
  on(name,listener){return this.events.on(name,listener);}
  emit(name,detail){return this.events.emit(name,detail);}
  #steps=[];#input='';#output='';#services;
  constructor(steps=[],{services={}}={}){this.#services=services;steps.forEach(step=>this.push(step));}
  get pipeline(){return this.#steps.map(copy);}
  get actions(){return this.#steps.filter(s=>s.enabled!==false).flatMap(s=>(s.actions||[]).map(a=>({...a,plugin:s.id})));}
  add(step,index=this.#steps.length){
    const valid=validate(step);
    if(this.#steps.some(s=>s.id===valid.id))throw new Error(`Duplicate plugin: ${valid.id}`);
    if(!Number.isInteger(index)||index<0||index>this.#steps.length)throw new RangeError('Invalid position');
    this.#steps.splice(index,0,valid);return this;
  }
  push(step){return this.add(step);}
  delete(id){this.#steps.splice(this.#index(id),1);return this;}
  edit(id,patch){const index=this.#index(id);this.#steps[index]=validate({...this.#steps[index],...patch,id});return this;}
  #index(id){const i=this.#steps.findIndex(s=>s.id===id);if(i<0)throw new Error(`Unknown plugin: ${id}`);return i;}
  pipein(text){if(typeof text!=='string')throw new TypeError('Input must be a string');this.#input=text;return this;}
  pipeout(){return this.#output;}
  in(text=this.#input){
    this.pipein(text);this.#output='';
    const md=new MarkdownIt({html:false,linkify:true,typographer:false});
    const wrapFor=(id,html,{block=false,file=null,data=null}={})=>{if(typeof html!=='string')throw new TypeError('render/wrap expects HTML');const tag=block?'div':'span';return `<${tag} data-based-plugin="${id}"${block?' data-based-block="true"':''}${data?' data-based-data="'+encodeURIComponent(JSON.stringify(data))+'"':''}${file?' data-based-file="'+encodeURIComponent(JSON.stringify(file))+'" data-based-html="'+encodeURIComponent(html)+'"':''}>${file?'':html}</${tag}>`;};
    const shared={markdown:md,meta:{},services:this.#services,escape:md.utils.escapeHtml,renderFile:file=>{const plugin=[...this.#steps].reverse().find(p=>p.enabled!==false&&p.files?.some(ext=>ext.toLowerCase().replace(/^\./,'')===file.extension));if(!plugin)return null;const html=plugin.render(file,{escape:md.utils.escapeHtml});return wrapFor(plugin.id,html,{file,block:false});}};
    let value=text;
    for(const step of this.#steps){
      if(step.enabled===false)continue;
      const context={...shared,wrap:(html,options)=>wrapFor(step.id,html,options)};
      try{value=execute(step,value,context);if(typeof value!=='string')throw new TypeError('content/run must return a string (synchronous API)');}
      catch(error){throw new Error(`Plugin ${step.id}: ${error.message}`,{cause:error});}
    }
    this.#output=value;return value;
  }
}
export const markdown={id:'markdown',run:(text,context)=>context.markdown.render(text)};
