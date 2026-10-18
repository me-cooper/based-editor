export function parseChart(text){
  let value;try{value=JSON.parse(text);}catch{throw Error('Chart-Inhalt muss gültiges JSON sein.');}
  if(!value||!Array.isArray(value.labels)||!Array.isArray(value.values)||!value.labels.length)throw Error('labels und values als nichtleere Arrays angeben.');
  if(value.labels.length!==value.values.length)throw Error('labels und values müssen gleich lang sein.');
  if(value.labels.some(v=>typeof v!=='string')||value.values.some(v=>typeof v!=='number'||!Number.isFinite(v)))throw Error('labels müssen Text und values endliche Zahlen enthalten.');
  const type=value.type||'bar';if(!['bar','line','doughnut'].includes(type))throw Error('type: bar, line oder doughnut.');
  return {title:typeof value.title==='string'?value.title:'Diagramm',labels:[...value.labels],values:[...value.values],type};
}
export const sample={title:'Mein Diagramm',labels:['Mo','Di','Mi'],values:[12,19,8],type:'bar'};
export const chartMarkdown=type=>'\n\n```chart\n'+JSON.stringify({...sample,type},null,2)+'\n```\n';
