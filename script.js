const q=document.querySelector('#q'), type=document.querySelector('#type'), only=document.querySelector('#only');
const normalize=value=>value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
const cards=[...document.querySelectorAll('.card')];
let texts=[];

/* ---------- Limba (EN implicit, RO secundar) ---------- */
const T={
  en:{
    months:['January','February','March','April','May','June','July','August','September','October','November','December'],
    dows:['Mo','Tu','We','Th','Fr','Sa','Su'],
    none:'No announcements match the selected filters.',
    one:'1 announcement',
    many:n=>n+' announcements',
    title:'Theological Agenda',
    calLabel:'Events calendar'
  },
  ro:{
    months:['Ianuarie','Februarie','Martie','Aprilie','Mai','Iunie','Iulie','August','Septembrie','Octombrie','Noiembrie','Decembrie'],
    dows:['L','Ma','Mi','J','V','S','D'],
    none:'Nu există anunțuri pentru filtrele selectate.',
    one:'1 anunț',
    many:n=>n+' anunțuri',
    title:'Agenda teologică',
    calLabel:'Calendar evenimente'
  }
};
let lang=((navigator.languages&&navigator.languages[0])||navigator.language||'en').toLowerCase().startsWith('ro')?'ro':'en';
try{const s=localStorage.getItem('lang');if(s==='ro'||s==='en')lang=s}catch(e){}

const translatable=[...document.querySelectorAll('[data-ro]')];
translatable.forEach(el=>{el.dataset.en=el.textContent});
const ariaItems=[...document.querySelectorAll('[data-ro-label]')];
ariaItems.forEach(el=>{el.dataset.enLabel=el.getAttribute('aria-label')});

const bEn=document.querySelector('#l-en'), bRo=document.querySelector('#l-ro');

function setLang(l){
  lang=l;
  try{localStorage.setItem('lang',l)}catch(e){}
  document.documentElement.lang=l;
  document.title=T[l].title;
  translatable.forEach(el=>{el.textContent=el.dataset[l]});
  ariaItems.forEach(el=>{el.setAttribute('aria-label',l==='ro'?el.dataset.roLabel:el.dataset.enLabel)});
  q.placeholder=l==='ro'?q.dataset.roPh:q.dataset.enPh;
  calBox.setAttribute('aria-label',T[l].calLabel);
  bEn.setAttribute('aria-pressed',l==='en');
  bRo.setAttribute('aria-pressed',l==='ro');
  texts=cards.map(card=>normalize(card.textContent));
  show();
}

/* ---------- Calendar ---------- */
const dowsLen=7;
const calBox=document.querySelector('#cal'), listBox=document.querySelector('.grid');
const calGrid=document.querySelector('#cal-grid'), calTitle=document.querySelector('#cal-title');
const vList=document.querySelector('#v-list'), vCal=document.querySelector('#v-cal');
let cur=new Date(); cur=new Date(cur.getFullYear(),cur.getMonth(),1);

const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

function renderCal(){
  const y=cur.getFullYear(), m=cur.getMonth();
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bucharest'}).format(new Date());
  calTitle.textContent=T[lang].months[m]+' '+y;
  calGrid.replaceChildren();
  T[lang].dows.forEach(d=>{const c=document.createElement('div');c.className='cal-dow';c.textContent=d;calGrid.append(c)});
  const offset=(new Date(y,m,1).getDay()+6)%dowsLen;
  const days=new Date(y,m+1,0).getDate();
  for(let i=0;i<offset;i++){const e=document.createElement('div');e.className='cal-day empty';calGrid.append(e)}
  for(let d=1;d<=days;d++){
    const date=iso(new Date(y,m,d));
    const cell=document.createElement('div');
    cell.className='cal-day'+(date===today?' today':'');
    const num=document.createElement('span');num.className='cal-num';num.textContent=d;cell.append(num);
    cards.filter(c=>!c.hidden&&c.dataset.start&&c.dataset.start<=date&&(c.dataset.end||c.dataset.start)>=date).forEach(c=>{
      const a=document.createElement('a');
      const end=c.dataset.end||c.dataset.start;
      a.className='cal-ev '+c.dataset.type+(end<today?' past':'');
      a.textContent=c.querySelector('h3').textContent;
      a.title=c.querySelector('h3').textContent;
      a.href=c.querySelector('a').href;
      a.target='_blank';a.rel='noopener noreferrer';
      cell.append(a);
    });
    calGrid.append(cell);
  }
}

function setView(cal){
  calBox.hidden=!cal; listBox.hidden=cal;
  vCal.setAttribute('aria-pressed',cal); vList.setAttribute('aria-pressed',!cal);
  if(cal)renderCal();
}
vList.addEventListener('click',()=>setView(false));
vCal.addEventListener('click',()=>setView(true));
document.querySelector('#prev').addEventListener('click',()=>{cur=new Date(cur.getFullYear(),cur.getMonth()-1,1);renderCal()});
document.querySelector('#next').addEventListener('click',()=>{cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);renderCal()});
bEn.addEventListener('click',()=>setLang('en'));
bRo.addEventListener('click',()=>setLang('ro'));

/* ---------- Filtre ---------- */
function show(){
  const search=normalize(q.value.trim());
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bucharest'}).format(new Date());
  let count=0;
  cards.forEach((card,i)=>{
    const upcoming=card.dataset.end && card.dataset.end>=today;
    const archive=card.querySelector('.archive');
    if(archive)archive.hidden=Boolean(upcoming);
    card.hidden=Boolean((type.value && card.dataset.type!==type.value)||(only.checked && !upcoming)||!texts[i].includes(search));
    if(!card.hidden) count++;
  });
  document.querySelector('#count').textContent=count===0?T[lang].none:count===1?T[lang].one:T[lang].many(count);
  renderCal();
}
q.addEventListener('input',show);
type.addEventListener('change',show);
only.addEventListener('change',()=>{if(only.checked&&type.value==='carte')type.value='';show()});
setLang(lang);
