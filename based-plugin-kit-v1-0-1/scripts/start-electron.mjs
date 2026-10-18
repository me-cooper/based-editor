import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const kit=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const requested=process.argv[2];
const candidates=requested?[path.resolve(requested)]:[path.dirname(kit),path.join(path.dirname(kit),'based'),path.join(path.dirname(kit),'newage-editor')];
let app;
for(const candidate of candidates){try{const json=JSON.parse(await fs.readFile(path.join(candidate,'package.json'),'utf8'));if(json.main&&(json.dependencies?.electron||json.devDependencies?.electron)){await fs.access(path.join(candidate,json.main));app=candidate;break;}}catch{}}
if(!app){console.error('Die Electron-App wurde nicht neben dem Plugin-Kit gefunden.\nStarte sie in ihrem eigenen Ordner mit npm start.\nOder: npm start -- /absoluter/Pfad/zu/deiner/Electron-App');process.exitCode=1;}
else{console.log('Starte Based als Electron-App: '+app);const child=spawn(process.platform==='win32'?'npm.cmd':'npm',['start'],{cwd:app,stdio:'inherit',shell:false});child.on('error',error=>{console.error(error.message);process.exitCode=1;});child.on('exit',(code,signal)=>{process.exitCode=signal?1:code||0;});}
