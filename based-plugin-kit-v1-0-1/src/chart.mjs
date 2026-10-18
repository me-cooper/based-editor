import Chart from 'chart.js/auto';
import {parseChart,chartMarkdown} from './chart-data.mjs';
export {parseChart} from './chart-data.mjs';
export default {
  id:'charts',title:'Diagramme',design:{file:'chart.css'},
  actions:[
    {id:'bar',label:'Balkendiagramm',insert:()=>chartMarkdown('bar')},
    {id:'line',label:'Liniendiagramm',insert:()=>chartMarkdown('line')},
    {id:'doughnut',label:'Ringdiagramm',insert:()=>chartMarkdown('doughnut')}
  ],
  content:{fence:'chart',render(text,argument,{escape}){
    let config;try{config=parseChart(text);}catch{config={title:"Diagramm"};}
    return `<section class="chart"><header><strong>${escape(config.title)}</strong><label>Darstellung <select class="type" aria-label="Diagrammart"><option value="bar">Balken</option><option value="line">Linie</option><option value="doughnut">Ring</option></select></label></header><div class="canvas-area"><canvas aria-label="${escape(config.title)}" role="img"></canvas></div><details><summary>Daten bearbeiten</summary><textarea class="data" aria-label="Diagrammdaten"></textarea><button class="apply" type="button">Anwenden</button><button class="copy" type="button">Markdown kopieren</button><p class="status" role="status">Änderungen hier gelten für diese Ansicht. Zum Speichern Markdown kopieren.</p></details></section>`;
  }},
  mount(root,{data,signal,onDispose,emit}){
    let config=null,chart;
    const canvas=root.querySelector('canvas'),textarea=root.querySelector('.data'),type=root.querySelector('.type'),status=root.querySelector('.status');
    const colors=['#bad7a8','#9cbfe5','#d4b1df','#e7c987','#a5d5cf'];
    try{config=parseChart(data.text);}catch(error){textarea.value=data.text;status.textContent=error.message;}
    const updateEditor=()=>{root.querySelector('header strong').textContent=config.title;type.value=config.type;textarea.value=JSON.stringify(config,null,2);};
    function draw(){chart?.destroy();chart=new Chart(canvas,{type:config.type,data:{labels:config.labels,datasets:[{label:config.title,data:config.values,backgroundColor:config.type==='line'?'#bad7a855':colors,borderColor:'#bad7a8',borderWidth:2,tension:.2}]},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:config.type==='doughnut',labels:{color:'#dce1d7'}}},scales:config.type==='doughnut'?{}:{x:{ticks:{color:'#b7c7b0'},grid:{color:'#46544455'}},y:{ticks:{color:'#b7c7b0'},grid:{color:'#46544455'},beginAtZero:true}}}});emit('chart:changed',{type:config.type,title:config.title});}
    onDispose(()=>chart?.destroy());if(config){updateEditor();draw();}
    type.addEventListener('change',()=>{if(!config)return;config={...config,type:type.value};updateEditor();draw();status.textContent='Darstellung geändert; bei Bedarf Markdown kopieren.';},{signal});
    root.querySelector('.apply').addEventListener('click',()=>{try{config=parseChart(textarea.value);updateEditor();draw();status.textContent='Daten angewendet; bei Bedarf Markdown kopieren.';}catch(error){status.textContent=error.message;}},{signal});
    root.querySelector('.copy').addEventListener('click',async()=>{if(!config){status.textContent='Zuerst gültige Daten anwenden.';return;}const markdown='```chart\n'+JSON.stringify(config,null,2)+'\n```';try{await navigator.clipboard.writeText(markdown);if(!signal.aborted)status.textContent='Markdown kopiert. Im Editor ersetzen und speichern.';}catch{textarea.value=markdown;textarea.focus();textarea.select();status.textContent='Kopieren nicht verfügbar: markierten Text mit ⌘C kopieren.';}},{signal});
    if(config)emit('chart:ready',{type:config.type});
  }
};
