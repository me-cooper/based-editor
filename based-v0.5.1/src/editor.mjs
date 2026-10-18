const wrap=(left,right=left,fallback='Text')=>({selection})=>left+(selection||fallback)+right;
const lines=prefix=>({selection})=>(selection||'Text').split('\n').map((line,i)=>typeof prefix==='function'?prefix(i)+line:prefix+line).join('\n');
export const toolbarActions=[
 {id:'h1',label:'H1',title:'Überschrift 1',insert:lines('# ')},
 {id:'h2',label:'H2',title:'Überschrift 2',insert:lines('## ')},
 {id:'h3',label:'H3',title:'Überschrift 3',insert:lines('### ')},
 {id:'bold',label:'Fett',title:'Fettdruck (⌘B)',insert:wrap('**')},
 {id:'italic',label:'Kursiv',title:'Kursiv (⌘I)',insert:wrap('*')},
 {id:'strike',label:'Durchgestrichen',insert:wrap('~~')},
 {id:'ul',label:'• Liste',insert:lines('- ')},
 {id:'ol',label:'1. Liste',insert:lines(i=>(i+1)+'. ')},
 {id:'task',label:'☐ Aufgabe',insert:lines('- [ ] ')},
 {id:'quote',label:'Zitat',insert:lines('> ')},
 {id:'code',label:'Code',insert:wrap('`')},
 {id:'codeblock',label:'Codeblock',insert:wrap('\n```\n','\n```\n','Code')},
 {id:'link',label:'Link',insert:wrap('[','](https://example.com)','Linktext')},
 {id:'table',label:'Tabelle',insert:'\n\n| Spalte 1 | Spalte 2 |\n| --- | --- |\n| Text | Text |\n\n'},
 {id:'rule',label:'Trennlinie',insert:'\n\n---\n\n'}
];
export function insertion(action,{text,selectionStart,selectionEnd,now=new Date()}){
 let start=selectionStart,end=selectionEnd;
 if(['h1','h2','h3','ul','ol','task','quote'].includes(action.id)){
  start=start===0?0:text.lastIndexOf('\n',start-1)+1;
  const endLine=text.indexOf('\n',end);end=endLine<0?text.length:endLine;
 }
 const insert=typeof action.insert==='function'?action.insert({selection:text.slice(start,end),text,now}):action.insert;
 if(typeof insert!=='string')throw Error('Aktion muss Text zurückgeben.');
 return {start,end,insert};
}
