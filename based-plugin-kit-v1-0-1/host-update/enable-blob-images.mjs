// Run: node enable-blob-images.mjs /absolute/path/to/your/based-project
import fs from 'node:fs/promises';
import path from 'node:path';
const directory=process.argv[2];
if(!directory)throw Error('Projektpfad angeben: node enable-blob-images.mjs /Pfad/zu/based');
const filename=path.join(path.resolve(directory),'app/index.html');
const html=await fs.readFile(filename,'utf8');
if(!html.includes('based-media:')||!html.includes('based-plugin:'))throw Error('Dieser Patch setzt den Based-Host mit Plugin Runtime 0.5 voraus.');
let found=false;
const changed=html.replace(/img-src\s+([^;"\n]+)/,(match,sources)=>{found=true;return sources.split(/\s+/).includes('blob:')?match:'img-src '+sources.trim()+' blob:';});
if(!found)throw Error('Keine img-src-Regel gefunden. Datei wurde nicht geändert.');
if(changed===html){console.log('Blob-Bilder bereits freigegeben.');process.exit(0);}
await fs.writeFile(filename+'.before-plugin-kit',html,{flag:'wx'});
await fs.writeFile(filename,changed);console.log('Lokale Blob-Bilder freigegeben. Im Based-Projekt npm run build ausführen und App neu starten.');
