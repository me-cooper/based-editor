const images=new Set(['png','jpg','jpeg','gif','webp','svg','avif','bmp','ico']);
const videos=new Set(['mp4','webm','mov','m4v']);
const audio=new Set(['mp3','wav','ogg','m4a','flac']);

export default {
  id:'media',
  title:'Dateien',
  design:{file:'media.css'},
  actions:[{
    id:'attach',
    label:'Dateien anhängen',
    command:'import-media',
    kind:'file'
  }],
  content(text,{markdown,wrap,escape,renderFile}){
    const previous=markdown.renderer.rules.image;
    markdown.renderer.rules.image=(tokens,i,options,env,self)=>{
      const token=tokens[i],src=token.attrGet('src')||'';
      let filename=src.split(/[?#]/)[0].split('/').pop()||'Datei';
      try{filename=decodeURIComponent(filename);}catch{}
      const extension=filename.includes('.')?filename.split('.').pop().toLowerCase():'';
      const custom=renderFile?.({name:filename,extension,src,url:src,label:token.content||filename});
      if(custom!==null&&custom!==undefined)return custom;
      const label=escape(token.content||filename),url=escape(src);

      if(images.has(extension))return wrap(previous(tokens,i,options,env,self));
      if(videos.has(extension))return wrap(`<video controls preload="metadata" src="${url}" aria-label="${label}"></video>`);
      if(audio.has(extension))return wrap(`<audio controls preload="metadata" src="${url}" aria-label="${label}"></audio>`);

      return wrap(`<a class="attachment" href="${url}" data-based-attachment="true" title="Im Finder anzeigen"><span class="attachment-type">${escape(extension.toUpperCase()||'DATEI')}</span><span class="attachment-name">${label}</span><span class="attachment-action">Im Finder anzeigen ↗</span></a>`);
    };
    return text;
  }
};
