import {build} from 'esbuild';
import fs from 'node:fs/promises';
for(const [source,target] of [['src/three-mf.mjs','plugins/three-mf/three-mf.mjs'],['src/chart.mjs','plugins/chart/chart.mjs']])await build({entryPoints:[source],outfile:target,bundle:true,format:'esm',platform:'browser',target:'chrome130',minify:true,legalComments:'eof'});
await fs.mkdir('licenses',{recursive:true});
for(const name of ['three','chart.js','@kurkle/color','fflate']){const source=['chart.js','@kurkle/color'].includes(name)?'node_modules/'+name+'/LICENSE.md':'node_modules/'+name+'/LICENSE';await fs.copyFile(source,'licenses/'+name.replace('/','-')+'.txt');}
