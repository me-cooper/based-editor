const {contextBridge,ipcRenderer,webUtils}=require('electron');
const api=Object.fromEntries(['open','read','save','saveas','create','remove','plugin','decide','state','finishClose','styles','exportDesign','base','mkdir','importMedia','pasteImage','revealAttachment'].map(name=>[name,(...args)=>ipcRenderer.invoke(`files:${name}`,...args)]));
api.pathForFile=file=>webUtils.getPathForFile(file);
api.onSaveBeforeClose=callback=>{ipcRenderer.on('save-before-close',()=>callback());};
contextBridge.exposeInMainWorld('files',api);
