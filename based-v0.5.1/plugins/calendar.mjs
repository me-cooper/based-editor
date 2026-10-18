// Content and toolbar actions. Design is in calendar.css beside this file.
const months=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const pad=n=>String(n).padStart(2,'0');
const iso=(y,m,d)=>`${y}-${pad(m)}-${pad(d)}`;
function valid(y,m,d){return y>=1000&&y<=9999&&m>=1&&m<=12&&d>=1&&d<=new Date(Date.UTC(y,m,0)).getUTCDate();}
export function parseCalendar(spec,now=new Date()){
  spec=spec.trim()||`${now.getFullYear()}-${pad(now.getMonth()+1)}`;
  const match=/^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:-(\d{2}))?)?)?$/.exec(spec);
  if(!match) return null;
  const y=Number(match[1]),m=Number(match[2]||1),a=Number(match[3]||1),b=Number(match[4]||a);
  if(!valid(y,m,a)||!valid(y,m,b))return null;
  if(!match[2])return {year:y,months:Array.from({length:12},(_,i)=>i+1),from:iso(y,1,1),to:iso(y,12,31),title:String(y)};
  const from=match[3]?Math.min(a,b):1,to=match[3]?Math.max(a,b):new Date(Date.UTC(y,m,0)).getUTCDate();
  return {year:y,months:[m],from:iso(y,m,from),to:iso(y,m,to),title:match[3]?`${from===to?from:from+'–'+to}. ${months[m-1]} ${y}`:`${months[m-1]} ${y}`};
}
function table(view,m,events,today,escape){
  const y=view.year,offset=(new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7,days=new Date(Date.UTC(y,m,0)).getUTCDate();
  const first=view.months.length===1?Number(view.from.slice(-2)):1,last=view.months.length===1?Number(view.to.slice(-2)):days;
  const begin=Math.floor((offset+first-1)/7)*7,end=Math.ceil((offset+last)/7)*7;
  let html=`<table><caption>${view.months.length===1?view.title:months[m-1]+' '+y}</caption><thead><tr>${['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=>`<th scope="col">${d}</th>`).join('')}</tr></thead><tbody>`;
  for(let i=begin;i<end;i++){
    if(i%7===0)html+='<tr>';
    const day=i-offset+1,date=iso(y,m,day);
    if(day<first||day>last)html+='<td class="calendar-empty"></td>';
    else{html+=`<td${date===today?' class="calendar-today"':''}><time datetime="${date}">${day}</time>`;for(const event of events.get(date)||[])html+=`<div class="calendar-event">${escape(event)}</div>`;html+='</td>';}
    if(i%7===6)html+='</tr>';
  }return html+'</tbody></table>';
}
export default {
  id:'calendar',title:'Kalender',
  design:{file:'calendar.css'},
  actions:[{id:'add',label:'Kalender hinzufügen',insert:({now})=>`\n\n\`\`\`calendar ${now.getFullYear()}-${pad(now.getMonth()+1)}\n\`\`\`\n`}],
  content:{
    fence:'calendar',
    render(source,spec,{escape}){
      const now=new Date(),view=parseCalendar(spec,now);
      if(!view)return '<p class="calendar-error">Kalender: YYYY, YYYY-MM, YYYY-MM-DD oder YYYY-MM-DD-DD angeben.</p>';
      const events=new Map(),errors=[];
      for(const line of source.split('\n')){
        if(!line.trim())continue;
        const match=/^\s*(\d{4})-(\d{2})-(\d{2})\s*\|\s*(.+?)\s*$/.exec(line);
        if(!match||!valid(Number(match[1]),Number(match[2]),Number(match[3]))){errors.push(line);continue;}
        const date=iso(Number(match[1]),Number(match[2]),Number(match[3]));
        if(date<view.from||date>view.to){errors.push(line);continue;}
        if(!events.has(date))events.set(date,[]);events.get(date).push(match[4]);
      }
      const today=iso(now.getFullYear(),now.getMonth()+1,now.getDate());
      let html=`<div class="calendar${view.months.length>1?' calendar-year':''}">${view.months.length>1?`<h2>${view.year}</h2><div class="calendar-months">`:''}`;
      html+=view.months.map(m=>table(view,m,events,today,escape)).join('');
      if(view.months.length>1)html+='</div>';
      if(errors.length)html+=`<p class="calendar-error">Termine prüfen (YYYY-MM-DD | Text, innerhalb des gewählten Zeitraums): ${errors.map(escape).join('; ')}</p>`;
      return html+'</div>';
    }
  }
};
