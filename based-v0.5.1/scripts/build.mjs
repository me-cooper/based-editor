import {build} from 'esbuild';
import fs from 'node:fs/promises';
// Embed font bytes so shadow stylesheets and packaged Electron use identical resources.
let css=await fs.readFile('node_modules/katex/dist/katex.min.css','utf8');
const urls=[...new Set([...css.matchAll(/url\((?:"|')?(fonts\/[^)"']+)(?:"|')?\)/g)].map(m=>m[1]))];
for(const url of urls){const data=await fs.readFile('node_modules/katex/dist/'+url),ext=url.split('.').pop();const mime=ext==='ttf'?'font/ttf':ext==='woff2'?'font/woff2':'font/woff';css=css.replaceAll(url,`data:${mime};base64,${data.toString('base64')}`);}
await fs.mkdir('app/vendor',{recursive:true});
await fs.writeFile('app/vendor/katex.css',css);
// Font registrations have no selectors and need document-level registration in Chromium.
await fs.writeFile('app/vendor/fonts.css',[...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map(m=>m[0]).join('\n'));
await build({entryPoints:['app/ui.mjs'],bundle:true,format:'esm',outfile:'app/bundle.js',loader:{'.css':'text'}});
