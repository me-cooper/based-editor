export default {
  id:'latex',
  title:'LaTeX',
  design:{file:'latex.css',stylesheets:['vendor/katex.css']},
  actions:[{id:'formula',label:'Formel einfügen',insert:({selection})=>`\n\n$$\n${selection || 'E = mc^2'}\n$$\n`}],
  content(text, {markdown,services,wrap}) {
    const render=(source,displayMode)=>wrap(services.katex.renderToString(source,{displayMode,throwOnError:false,trust:false,strict:'warn',maxExpand:1000}),{block:displayMode});
    markdown.inline.ruler.before('escape', 'latex', (state, silent) => {
      const pos = state.pos;
      const open = state.src.startsWith('\\(', pos) ? '\\(' : state.src[pos] === '$' && state.src[pos+1] !== '$' ? '$' : null;
      if (!open) return false;
      const close = open === '$' ? '$' : '\\)';
      if (/\s/.test(state.src[pos+open.length] || ' ')) return false;
      let end = pos + open.length;
      while ((end = state.src.indexOf(close, end)) >= 0) {
        let slashes=0; for(let p=end-1;p>=0 && state.src[p]==='\\';p--) slashes++;
        if (slashes % 2 === 0) break;
        end += close.length;
      }
      if (end < 0 || state.src.slice(pos,end).includes('\n') || /\s/.test(state.src[end-1])) return false;
      if (!silent) { const token=state.push('latex_inline','math',0); token.content=state.src.slice(pos+open.length,end); }
      state.pos=end+close.length; return true;
    });
    markdown.renderer.rules.latex_inline=(tokens,i)=>render(tokens[i].content,false);
    markdown.block.ruler.before('fence','latex_block',(state,start,end,silent)=>{
      const begin=state.bMarks[start]+state.tShift[start];
      const line=state.src.slice(begin,state.eMarks[start]).trim();
      const open=line.startsWith('$$')?'$$':line.startsWith('\\[')?'\\[':null;
      if(!open) return false;
      const close=open==='$$'?'$$':'\\]';
      const parts=[]; let cursor=start, rest=line.slice(open.length), found=false;
      for (;cursor<end;cursor++) {
        if(cursor>start) rest=state.src.slice(state.bMarks[cursor]+state.tShift[cursor],state.eMarks[cursor]);
        const at=rest.indexOf(close);
        if(at>=0) { if(rest.slice(at+close.length).trim()) return false; parts.push(rest.slice(0,at)); found=true; break; }
        parts.push(rest);
      }
      if(!found) return false;
      if(silent) return true;
      const token=state.push('latex_block','math',0); token.block=true; token.content=parts.join('\n'); token.map=[start,cursor+1]; state.line=cursor+1; return true;
    },{alt:['paragraph','reference','blockquote','list']});
    markdown.renderer.rules.latex_block=(tokens,i)=>render(tokens[i].content,true)+'\n';
    return text;
  }
};
