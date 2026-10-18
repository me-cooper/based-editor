const {app,BrowserWindow,ipcMain,dialog,protocol,clipboard}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path');
const storage=require('./storage.cjs'),media=storage.mediaStore(),plugins=require('./plugin-store.cjs').pluginStore();
protocol.registerSchemesAsPrivileged([{scheme:'based-media',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true}},{scheme:'based-plugin',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true}}]);
let root,win,dirty=false,allowClose=false,closing=false;
async function safe(relative) {
  if(!root || typeof relative!=='string' || path.isAbsolute(relative)) throw Error('Bitte einen Ordner öffnen.');
  const target=path.resolve(root,relative), rel=path.relative(root,target);
  if(!rel || rel.startsWith('..'+path.sep) || rel==='..' || path.isAbsolute(rel) || !/\.md$/i.test(target)) throw Error('Nur Markdown-Dateien im geöffneten Ordner.');
  const parent=await fs.realpath(path.dirname(target)), parentRel=path.relative(root,parent);
  if(parentRel==='..' || parentRel.startsWith('..'+path.sep) || path.isAbsolute(parentRel)) throw Error('Datei liegt außerhalb des Ordners.');
  try {if((await fs.lstat(target)).isSymbolicLink())throw Error('Symbolische Links werden nicht unterstützt.');}catch(e){if(e.code!=='ENOENT')throw e;}
  return target;
}
async function tree(dir=root) {
  const result=[]; if(!dir)return result;
  for(const entry of (await fs.readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
    if(entry.name.startsWith('.')||entry.isSymbolicLink())continue;
    const full=path.join(dir,entry.name),relative=path.relative(root,full);
    if(entry.isDirectory())result.push({name:entry.name,path:relative,children:await tree(full)});
    else if(entry.isFile()&&/\.md$/i.test(entry.name))result.push({name:entry.name,path:relative});
  }return result;
}
async function decision(){const r=await dialog.showMessageBox(win,{type:'question',message:'Änderungen speichern?',detail:'Dein Text ist noch nicht gespeichert.',buttons:['Speichern','Verwerfen','Abbrechen'],defaultId:0,cancelId:2});return ['save','discard','cancel'][r.response];}
ipcMain.handle('files:decide',decision);
ipcMain.handle('files:state',(_,value)=>{dirty=Boolean(value);win?.setDocumentEdited(dirty);});
ipcMain.handle('files:finishClose',()=>{allowClose=true;win.close();});
ipcMain.handle('files:open',async()=>{const r=await dialog.showOpenDialog(win,{properties:['openDirectory','createDirectory']});if(r.canceled)return null;root=await fs.realpath(r.filePaths[0]);return {name:path.basename(root),tree:await tree()};});
ipcMain.handle('files:read',async(_,p)=>fs.readFile(await safe(p),'utf8'));
ipcMain.handle('files:save',async(_,p,text)=>{if(typeof text!=='string')throw Error('Ungültiger Text.');const target=await safe(p);const handle=await fs.open(target,'r+');try{await handle.writeFile(text,'utf8');await handle.truncate(Buffer.byteLength(text,'utf8'));}finally{await handle.close();}return {path:p,base:media.base(root,target)};});
ipcMain.handle('files:saveas',async(_,text,suggestion='Unbenannt.md',folder='',original=null)=>{
  if(typeof text!=='string')throw Error('Ungültiger Text.');
  const name=typeof suggestion==='string'?path.basename(suggestion):'Unbenannt.md';
  const r=await dialog.showSaveDialog(win,{title:'Notiz speichern',defaultPath:path.join(root?await storage.directory(root,folder):app.getPath('documents'),name),filters:[{name:'Markdown',extensions:['md']}],properties:['createDirectory','showOverwriteConfirmation']});
  if(r.canceled || !r.filePath)return null;
  const target=/\.md$/i.test(r.filePath)?r.filePath:r.filePath+'.md';
  // If we added the extension ourselves, the dialog has not checked that target.
  let exists=false;try{const info=await fs.lstat(target);if(info.isSymbolicLink())throw Error('Symbolische Links werden nicht unterstützt.');exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}
  if(target!==r.filePath && exists){const q=await dialog.showMessageBox(win,{type:'question',message:`${path.basename(target)} ersetzen?`,buttons:['Abbrechen','Ersetzen'],defaultId:0,cancelId:0});if(q.response!==1)return null;}
  // Do not change the current folder or clear editor state before writing succeeds.
  const targetDirectory=await fs.realpath(path.dirname(target));
  if(original)await storage.copySiblingMedia(text,await safe(original),targetDirectory);
  await fs.writeFile(target,text,'utf8');
  const parent=await fs.realpath(path.dirname(target));
  const absolute=path.join(parent,path.basename(target));
  const relative=root?path.relative(root,absolute):'..';
  if(!root || relative==='..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative))root=parent;
  // A listing failure must not turn a successful write into an apparent failed save.
  let entries=null;try{entries=await tree();}catch{}
  return {path:path.relative(root,absolute),name:path.basename(root),tree:entries,base:media.base(root,absolute)};
});
ipcMain.handle('files:base',async(_,p)=>media.base(root,await safe(p)));
ipcMain.handle('files:mkdir',async(_,parent,name)=>{const created=await storage.mkdir(root,parent,name);return {path:created,tree:await tree()};});
ipcMain.handle('files:importMedia',async(_,p,kind='all',sources=null)=>{
  const target=await safe(p);await fs.access(target);
  if(!sources){const r=await dialog.showOpenDialog(win,{title:'Dateien anhängen',properties:['openFile','multiSelections']});if(r.canceled)return [];sources=r.filePaths;}
  return storage.importFiles(path.dirname(target),sources);
});
ipcMain.handle('files:revealAttachment',async(_,p,href)=>{const target=await storage.attachmentPath(root,await safe(p),href);require('electron').shell.showItemInFolder(target);});
ipcMain.handle('files:pasteImage',async(_,p)=>{const target=await safe(p);await fs.access(target);const image=clipboard.readImage();if(image.isEmpty())throw Error('Kein Bild in der Zwischenablage.');return [await storage.clipboardPNG(path.dirname(target),image.toPNG())];});
ipcMain.handle('files:create',async(_,p)=>{await fs.writeFile(await safe(p),'',{flag:'wx'});return tree();});
ipcMain.handle('files:remove',async(_,p)=>{const target=await safe(p);const r=await dialog.showMessageBox(win,{type:'question',message:`${p} löschen?`,buttons:['Abbrechen','Löschen'],defaultId:0,cancelId:0});if(r.response===1)await require('electron').shell.trashItem(target);return {tree:await tree(),deleted:r.response===1};});
ipcMain.handle('files:plugin',async()=>{const r=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Renderer Plugin',extensions:['mjs','js']}]});if(r.canceled)return null;const q=await dialog.showMessageBox(win,{type:'question',message:'Plugin ausführen?',detail:'Nur eigene oder vertrauenswürdige JavaScript-Dateien importieren. Mitgelieferte Dateien aus dem Plugin-Ordner können ebenfalls geladen werden.',buttons:['Abbrechen','Importieren'],defaultId:0,cancelId:0});if(q.response!==1)return null;const filename=r.filePaths[0];let css=null;try{css=await fs.readFile(filename.replace(/\.(mjs|js)$/i,'.css'),'utf8');}catch(e){if(e.code!=='ENOENT')throw e;}return {source:await fs.readFile(filename,'utf8'),url:plugins.register(filename),css};});
ipcMain.handle('files:styles',async()=>{const dir=path.join(__dirname,'../plugins'),result={};for(const entry of await fs.readdir(dir,{withFileTypes:true})){if(entry.isFile()&&entry.name.endsWith('.css'))result[entry.name]=await fs.readFile(path.join(dir,entry.name),'utf8');}return result;});
ipcMain.handle('files:exportDesign',async(_,css,id)=>{
  if(typeof css!=='string'||typeof id!=='string'||!/^[a-z][a-z0-9_-]*$/i.test(id))throw Error('Ungültiges Design.');
  const r=await dialog.showSaveDialog(win,{title:'Plugin-Design speichern',defaultPath:id+'.css',filters:[{name:'CSS',extensions:['css']}],properties:['showOverwriteConfirmation']});
  if(r.canceled||!r.filePath)return false;
  const target=/\.css$/i.test(r.filePath)?r.filePath:r.filePath+'.css';
  if(target!==r.filePath){try{await fs.access(target);const q=await dialog.showMessageBox(win,{type:'question',message:`${path.basename(target)} ersetzen?`,buttons:['Abbrechen','Ersetzen'],defaultId:0,cancelId:0});if(q.response!==1)return false;}catch(e){if(e.code!=='ENOENT')throw e;}}
  await fs.writeFile(target,css,'utf8');return true;
});
app.whenReady().then(()=>{
  protocol.handle('based-media',request=>media.response(request));
  protocol.handle('based-plugin',request=>plugins.response(request));
  const create=()=>{
    dirty=false;allowClose=false;closing=false;
    win=new BrowserWindow({width:1280,height:820,minWidth:800,minHeight:500,backgroundColor:'#151719',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
    win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
    win.on('close',e=>{if(allowClose||!dirty)return;e.preventDefault();if(closing)return;closing=true;decision().then(choice=>{if(choice==='discard'){allowClose=true;win.close();}else if(choice==='save')win.webContents.send('save-before-close');}).finally(()=>{closing=false;});});
    win.loadFile(path.join(__dirname,'index.html'));
  };create();app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length)create();});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
