export default {id:'tasks',content(text,{markdown}){
 markdown.core.ruler.after('inline','based_tasks',state=>{
  for(let i=2;i<state.tokens.length;i++){
   const token=state.tokens[i];if(token.type!=='inline'||state.tokens[i-2].type!=='list_item_open')continue;
   const first=token.children?.[0],match=first?.type==='text'&&/^\[([ xX])\]\s+/.exec(first.content);if(!match)continue;
   const checkbox=new state.Token('html_inline','',0);checkbox.content=`<input type="checkbox" disabled${match[1]!==' '?' checked':''} aria-label="Aufgabe"> `;
   first.content=first.content.slice(match[0].length);token.children.unshift(checkbox);
  }
 });return text;
}};
