// Import example.mjs; example.css next to it is loaded automatically.
export default {
  id:'note',title:'Notiz',
  design:{file:'example.css'},
  actions:[{id:'insert',label:'Notiz einfügen',insert:'\n\n```note\nDeine Notiz\n```\n'}],
  content:{
    fence:'note',
    render(text,args,{escape}){return `<div class="note"><strong>${escape(args||'Notiz')}</strong><p>${escape(text)}</p></div>`;}
  }
};
