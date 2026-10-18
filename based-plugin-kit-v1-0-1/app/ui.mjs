import {createRenderer} from '../src/index.mjs';
import DOMPurify from '../node_modules/dompurify/dist/purify.es.mjs';
import {mountPreview} from '../src/preview.mjs';
import documentCSS from './document.css';
import {toolbarActions,insertion} from '../src/editor.mjs';
const renderer=createRenderer(),$=id=>document.getElementById(id);
let current=null,dirty=false,busy=false,styles={},mediaBase=null,selectedDir='';
const openFolders=new Set();
let overrides={};
try{const saved=JSON.parse(localStorage.getItem('based.designs.v1')||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))overrides=saved;}catch{}
function rememberDesigns(){try{localStorage.setItem('based.designs.v1',JSON.stringify(overrides));}catch{status('Design gilt für diese Sitzung; Einstellungen konnten nicht gespeichert werden.');}}
function effectiveCSS(id){if(typeof overrides[id]==='string')return overrides[id];if(id==='document')return documentCSS;const plugin=renderer.pipeline.find(p=>p.id===id);return plugin?.design?.css??styles[plugin?.design?.file]??'';}
function designedPlugins(){return renderer.pipeline.map(p=>({...p,design:{...p.design,css:effectiveCSS(p.id)}}));}
function showDesign(){const id=$('design-plugin').value||'document';$('design-css').value=effectiveCSS(id);}
function refreshDesignOptions(){const previous=$('design-plugin').value;$('design-plugin').replaceChildren();for(const item of [{id:'document',title:'Markdown / Text'},...renderer.pipeline.filter(p=>p.id!=='markdown'&&p.design)]){const option=document.createElement('option');option.value=item.id;option.textContent=item.title||item.id;$('design-plugin').append(option);}$('design-plugin').value=previous&&[...$('design-plugin').children].some(o=>o.value===previous)?previous:'document';showDesign();}
const status=text=>$('status').textContent=text;
function changed(value){dirty=value;files.state(value).catch(()=>{});$('filename').textContent=(current||'Unbenannt.md')+(dirty?' •':'');$('delete').disabled=!current;}
function pipeline(){
  $('pipeline').textContent=renderer.pipeline.filter(s=>s.enabled!==false).map(s=>s.id).join(' → ');
  $('plugin-actions').replaceChildren();
  for(const item of renderer.actions){const button=document.createElement('button');button.textContent=item.label;button.id=`action-${item.plugin}-${item.id}`;button.onclick=()=>action(async()=>{
    if(item.command){if(item.command==='import-media')return addMedia(item.kind);throw Error('Unbekannte Aktion: '+item.command);}
    insertAction(item);
});$('plugin-actions').append(button);}
  refreshDesignOptions();
}
function preview(){try{mountPreview($('preview'),renderer.in($('editor').value),{plugins:designedPlugins(),documentCSS:effectiveCSS('document'),baseURL:mediaBase,events:renderer.events,onError:error=>status(error.message),sanitize:html=>DOMPurify.sanitize(html)});return true;}catch(e){status(e.message);return false;}}
async function action(fn){if(busy)return;busy=true;try{await fn();}catch(e){status(e.message);}finally{busy=false;}}
function suggestion(){const first=$('editor').value.split('\n').find(line=>line.trim())||'Unbenannt';const name=first.replace(/^#+\s*/,'').replace(/[<>:"/\\|?*\x00-\x1f]/g,'').trim().slice(0,70)||'Unbenannt';return name+'.md';}
async function save(as=false){
  const snapshot=$('editor').value;
  const result=(!current||as)?await files.saveas(snapshot,current?.split('/').at(-1)||suggestion(),selectedDir,current):await files.save(current,snapshot);
  if(!result){status('Speichern abgebrochen · Text bleibt erhalten');$('editor').focus();return false;}
  current=result.path;mediaBase=result.base||mediaBase;selectFolder(current.includes('/')?current.slice(0,current.lastIndexOf('/')):'');preview();
  if(result.name)$('folder').textContent=result.name;
  if(result.tree)tree(result.tree);
  changed($('editor').value!==snapshot);
  status(dirty?'Weitere Änderungen ungespeichert':'Gespeichert');
  return !dirty;
}
async function guard(){if(!dirty)return true;const choice=await files.decide();return choice==='discard'||(choice==='save'&&await save());}
function draft(){current=null;mediaBase=null;$('editor').value='';changed(false);preview();status('Einfach losschreiben · ⌘S zum Speichern');$('editor').focus();}
function selectFolder(folder){selectedDir=folder;$('folder-target').textContent=folder||'Stammordner';}
function tree(entries,parent=$('tree')){
  parent.replaceChildren();for(const entry of entries){
    if(entry.children){
      const d=document.createElement('details'),s=document.createElement('summary'),n=document.createElement('div');s.textContent=entry.name;d.open=openFolders.has(entry.path);s.onclick=()=>selectFolder(entry.path);d.ontoggle=()=>{if(d.open)openFolders.add(entry.path);else openFolders.delete(entry.path);};d.append(s,n);parent.append(d);tree(entry.children,n);
    }else{
      const b=document.createElement('button');b.textContent=entry.name;b.onclick=()=>action(async()=>{if(!await guard())return;const [text,base]=await Promise.all([files.read(entry.path),files.base(entry.path)]);current=entry.path;mediaBase=base;selectFolder(current.includes('/')?current.slice(0,current.lastIndexOf('/')):'');$('editor').value=text;changed(false);preview();status('Geöffnet');$('editor').focus();});parent.append(b);
    }
  }
}
function insertAction(item){const e=$('editor'),change=insertion(item,{text:e.value,selectionStart:e.selectionStart,selectionEnd:e.selectionEnd});e.setRangeText(change.insert,change.start,change.end,'end');changed(true);preview();status((item.title||item.label)+' · Text frei bearbeiten');e.focus();}
function markdownToolbar(){for(const item of toolbarActions){const button=document.createElement('button');button.id='format-'+item.id;button.textContent=item.label;button.title=item.title||item.label;button.onclick=()=>action(()=>insertAction(item));$('markdown-toolbar').append(button);}}
async function addMedia(kind='all',sources=null,clipboard=false){
  if(!current){status('Notiz zuerst speichern, damit Medien daneben abgelegt werden.');if(!await save())return;}
  const items=clipboard?await files.pasteImage(current):await files.importMedia(current,kind,sources);
  if(!items.length)return;renderer.emit('file:attached',{files:items});
  const snippet=items.map(item=>`![${item.name.replace(/[\[\]\\]/g,'\\$&')}](${item.url})`).join('\n\n');
  const e=$('editor');e.setRangeText(snippet,e.selectionStart,e.selectionEnd,'end');changed(true);preview();status(items.length+' Datei(en) neben der Notiz gespeichert · ⌘S zum Speichern der Links');e.focus();
}
$('new-folder').onclick=()=>{ $('folder-name').value='';$('folder-error').textContent='';$('folder-parent').textContent=selectedDir||'Stammordner';$('folder-dialog').showModal();$('folder-name').focus();};
$('folder-cancel').onclick=()=>$('folder-dialog').close();
$('folder-form').onsubmit=e=>{e.preventDefault();return action(async()=>{try{const result=await files.mkdir(selectedDir,$('folder-name').value);selectFolder(result.path);const segments=result.path.split('/');for(let i=1;i<=segments.length;i++)openFolders.add(segments.slice(0,i).join('/'));tree(result.tree);$('folder-dialog').close();status('Ordner erstellt: '+result.path);}catch(error){$('folder-error').textContent=error.message;}});};
$('root-folder').onclick=()=>selectFolder('');
$('open').onclick=()=>action(async()=>{if(!await guard())return;const result=await files.open();if(result){tree(result.tree);$('folder').textContent=result.name;/* Keep draft text even when selecting a folder. */current=null;mediaBase=null;openFolders.clear();selectFolder('');changed($('editor').value.length>0);preview();status('Ordner geöffnet · Text bleibt im Entwurf');$('editor').focus();}});
$('new').onclick=()=>action(async()=>{if(await guard())draft();});
$('save').onclick=()=>action(()=>save());
$('saveas').onclick=()=>action(()=>save(true));
$('delete').onclick=()=>action(async()=>{if(!current||!await guard())return;const result=await files.remove(current);tree(result.tree);if(result.deleted)draft();status(result.deleted?'In den Papierkorb verschoben':'Abgebrochen');});
$('plugin').onclick=()=>action(async()=>{
  const loaded=await files.plugin();if(loaded===null)return;
  const source=typeof loaded==='string'?loaded:loaded.source;
  const blob=!loaded.url;const url=loaded.url||URL.createObjectURL(new Blob([source],{type:'text/javascript'}));
  try{
    const module=await import(url);
    const plugin={...module.default};if(loaded.url&&plugin.design?.stylesheets)plugin.design={...plugin.design,stylesheets:plugin.design.stylesheets.map(href=>new URL(href,loaded.url).href)};if(loaded.css!==undefined&&loaded.css!==null)plugin.design={...plugin.design,css:loaded.css};
    const old=renderer.pipeline.find(s=>s.id===plugin?.id);
    if(old)renderer.edit(old.id,plugin);else renderer.add(plugin,renderer.pipeline.findIndex(p=>p.id==='markdown'));
    try{renderer.in($('editor').value);}catch(e){if(old)renderer.edit(old.id,old);else renderer.delete(plugin.id);throw e;}
    pipeline();preview();status('Plugin importiert (für diese Sitzung)');
  }finally{if(blob)URL.revokeObjectURL(url);}
});
$('design-plugin').onchange=showDesign;
$('design-apply').onclick=()=>{const id=$('design-plugin').value;overrides[id]=$('design-css').value;preview();status('Design angewendet · '+id);rememberDesigns();};
$('design-reset').onclick=()=>{const id=$('design-plugin').value;delete overrides[id];showDesign();preview();status('Standarddesign wiederhergestellt');rememberDesigns();};
$('design-export').onclick=()=>action(async()=>{const id=$('design-plugin').value;const saved=await files.exportDesign($('design-css').value,id);status(saved?'CSS gespeichert':'CSS-Export abgebrochen');});
$('editor').addEventListener('input',()=>{changed(true);if(preview())status('Ungespeichert');});
window.addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey){if(e.key.toLowerCase()==='s'){e.preventDefault();action(()=>save(e.shiftKey));}else if(['b','i'].includes(e.key.toLowerCase())&&e.target===$('editor')){e.preventDefault();const item=toolbarActions.find(a=>a.id===(e.key.toLowerCase()==='b'?'bold':'italic'));action(()=>insertAction(item));}else if(e.key.toLowerCase()==='n'){e.preventDefault();$('new').click();}}});
files.onSaveBeforeClose(()=>action(async()=>{if(await save())await files.finishClose();}));
markdownToolbar();pipeline();draft();

files.styles().then(result=>{styles=result;refreshDesignOptions();preview();}).catch(e=>status(e.message));

$('editor').addEventListener('paste',e=>{if([...e.clipboardData?.items||[]].some(item=>item.type.startsWith('image/'))){e.preventDefault();action(()=>addMedia('image',null,true));}});
$('editor').addEventListener('dragover',e=>{if(e.dataTransfer?.types.includes('Files')){e.preventDefault();e.dataTransfer.dropEffect='copy';}});
$('editor').addEventListener('drop',e=>{if(!e.dataTransfer?.files.length)return;e.preventDefault();const sources=[...e.dataTransfer.files].map(file=>files.pathForFile(file)).filter(Boolean);if(sources.length)action(()=>addMedia('file',sources));});

$('preview').addEventListener('click',e=>{
  const link=e.composedPath().find(node=>node?.matches?.('a[data-based-attachment]'));
  if(!link)return;e.preventDefault();
  action(async()=>{if(!current){status('Bitte die Notiz zuerst speichern.');return;}await files.revealAttachment(current,link.getAttribute('href'));});
});
