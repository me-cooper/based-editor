const fs=require('node:fs/promises'),{createReadStream,constants}=require('node:fs'),path=require('node:path'),{randomUUID,createHash}=require('node:crypto'),{Readable}=require('node:stream');
const types={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',avif:'image/avif',bmp:'image/bmp',ico:'image/x-icon',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime',m4v:'video/mp4',mp3:'audio/mpeg',wav:'audio/wav',ogg:'audio/ogg',m4a:'audio/mp4',flac:'audio/flac'};
function within(root,target){const rel=path.relative(root,target);return rel!== '..'&&!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel);}
const encodeName=name=>encodeURIComponent(name).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());
function kind(file){const type=types[path.extname(file).slice(1).toLowerCase()];return type?.split('/')[0];}
async function directory(root,relative=''){
 if(!root||typeof relative!=='string'||path.isAbsolute(relative)||relative.includes('\\')||relative.includes('\0'))throw Error('Bitte einen Ordner öffnen.');
 const target=path.resolve(root,relative);if(!within(root,target))throw Error('Ordner liegt außerhalb des geöffneten Ordners.');
 const real=await fs.realpath(target);if(!within(root,real)||!(await fs.stat(real)).isDirectory())throw Error('Ungültiger Ordner.');return real;
}
async function mkdir(root,parent,name){
 if(typeof name!=='string'||!name.trim())throw Error('Bitte einen Ordnernamen eingeben.');
 const parts=name.trim().split('/');if(parts.some(s=>!s||s==='.'||s==='..'||s.startsWith('.')||/[\\\0]/.test(s)))throw Error('Gültige Namen verwenden, z. B. Projekte/2026.');
 let current=await directory(root,parent);
 for(const part of parts){current=path.join(current,part);try{await fs.mkdir(current);}catch(e){if(e.code!=='EEXIST')throw e;}const real=await fs.realpath(current);if(!within(root,real)||!(await fs.stat(real)).isDirectory())throw Error('Ungültiger Unterordner.');current=real;}
 return path.relative(root,current);
}
async function uniqueFile(dir,name,writer){
 const clean=path.basename(name).replace(/[\x00-\x1f]/g,'_'),ext=path.extname(clean),stem=path.basename(clean,ext);
 for(let i=1;i<10000;i++){const filename=stem+(i===1?'':'-'+i)+ext,target=path.join(dir,filename);try{await writer(target);return {name:filename,url:'./'+encodeName(filename),kind:kind(filename)||'file'};}catch(e){if(e.code!=='EEXIST')throw e;}}
 throw Error('Kein freier Dateiname gefunden.');
}
async function importFiles(dir,sources){
 if(!Array.isArray(sources)||!sources.length)return [];
 for(const source of sources){if(typeof source!=='string'||!path.isAbsolute(source)||!(await fs.stat(source)).isFile())throw Error('Bitte eine Datei wählen.');}
 const result=[];
 try{for(const source of sources){const real=await fs.realpath(source);if(path.dirname(real)===dir){const name=path.basename(real);result.push({name,url:'./'+encodeName(name),kind:kind(name)||'file'});}else{const item=await uniqueFile(dir,path.basename(source),target=>fs.copyFile(source,target,constants.COPYFILE_EXCL));result.push({...item,created:true});}}}
 catch(e){for(const item of result)if(item.created)await fs.unlink(path.join(dir,item.name)).catch(()=>{});throw e;}
 return result.map(({created,...item})=>item);
}
async function clipboardPNG(dir,bytes){if(!bytes?.length)throw Error('Kein Bild in der Zwischenablage.');return uniqueFile(dir,'Bild-'+Date.now()+'.png',target=>fs.writeFile(target,bytes,{flag:'wx'}));}
function mediaStore(){
 const roots=new Map(),tokens=new Map();
 function base(root,document){let token=roots.get(root);if(!token){token=randomUUID();roots.set(root,token);tokens.set(token,root);}const rel=path.relative(root,path.dirname(document));return `based-media://${token}/`+(rel?rel.split(path.sep).map(encodeURIComponent).join('/')+'/':'');}
 async function resolve(url){const u=new URL(url),root=tokens.get(u.hostname);if(u.protocol!=='based-media:'||!root)throw Error('Unbekannte Medienquelle.');const relative=decodeURIComponent(u.pathname).replace(/^\/+/,''),target=path.resolve(root,relative);if(!within(root,target))throw Error('Ungültiger Medienpfad.');const real=await fs.realpath(target);if(!within(root,real)||!(await fs.stat(real)).isFile())throw Error('Ungültiger Medienpfad.');return real;}
 async function response(request){
  try{
   if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
   const target=await resolve(request.url),stat=await fs.stat(target),size=stat.size;
   let start=0,end=size-1,status=200;const range=request.headers.get('range');
   if(range){const m=/^bytes=(\d*)-(\d*)$/.exec(range);if(!m||(!m[1]&&!m[2])||size===0)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});if(!m[1])start=Math.max(0,size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]));}if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});status=206;}
   const headers={'Content-Type':types[path.extname(target).slice(1).toLowerCase()]||'application/octet-stream','Content-Length':String(size?end-start+1:0),'Access-Control-Allow-Origin':'*','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff'};
   if(status===206)headers['Content-Range']=`bytes ${start}-${end}/${size}`;
   return new Response(request.method==='HEAD'||!size?null:Readable.toWeb(createReadStream(target,{start,end})),{status,headers});
  }catch{return new Response(null,{status:404});}
 }
 return {base,resolve,response};
}
async function hash(file){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex');}
async function copySiblingMedia(text,source,targetDir){
 if(!source||path.dirname(source)===targetDir)return;
 const {default:MarkdownIt}=await import('markdown-it'),md=new MarkdownIt(),names=new Set();
 const walk=tokens=>{for(const token of tokens){if(token.type==='image'){const raw=token.attrGet('src')||'';if(!/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(raw)){let name;try{name=decodeURIComponent(raw.split(/[?#]/)[0]).replace(/^\.\//,'');}catch{continue;}if(name&&name!=='.'&&name!=='..'&&path.basename(name)===name)names.add(name);}}if(token.children)walk(token.children);}};walk(md.parse(text,{}));
 const created=[];
 try{for(const name of names){const from=path.join(path.dirname(source),name),to=path.join(targetDir,name);if((await fs.lstat(from)).isSymbolicLink())throw Error('Medien-Symlink bitte zuerst als Datei übernehmen.');try{await fs.copyFile(from,to,constants.COPYFILE_EXCL);created.push(to);}catch(e){if(e.code!=='EEXIST')throw e;if((await fs.lstat(to)).isSymbolicLink()||await hash(from)!==await hash(to))throw Error(`Medien-Datei ${name} existiert am Ziel mit anderem Inhalt. Bitte anderen Ordner wählen.`);}}}
 catch(e){for(const file of created)await fs.unlink(file).catch(()=>{});throw e;}
}
async function attachmentPath(root,document,href){
 if(typeof href!=='string'||!href||/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(href))throw Error('Nur lokale Dateianhänge.');
 const relative=decodeURIComponent(href.split(/[?#]/)[0]),target=path.resolve(path.dirname(document),relative);
 if(!within(root,target))throw Error('Datei liegt außerhalb des geöffneten Ordners.');
 const real=await fs.realpath(target);if(!within(root,real)||!(await fs.stat(real)).isFile())throw Error('Ungültiger Dateianhang.');return real;
}
module.exports={attachmentPath,directory,mkdir,kind,importFiles,clipboardPNG,mediaStore,copySiblingMedia};
