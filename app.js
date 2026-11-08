'use strict';
const VERSION='1.0.1';
const SETTINGS_KEY='roastlab.settings.v1';
const FAV_KEY='roastlab.favs.v1';
const LAST_KEY='roastlab.last.v1';
const $=sel=>document.querySelector(sel);
const $$=sel=>Array.from(document.querySelectorAll(sel));
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeLoad=(key,fallback)=>{try{const x=JSON.parse(localStorage.getItem(key));return x===null?fallback:x;}catch(_){return fallback}};
const defaults={name:'',theme:'dramma',tone:'assurdo',intensity:'forte',episode:''};
let settings={...defaults,...safeLoad(SETTINGS_KEY,{})};
let favorites=safeLoad(FAV_KEY,[]); if(!Array.isArray(favorites)) favorites=[];
let results=safeLoad(LAST_KEY,[]);if(!Array.isArray(results))results=[];
let selectedTab='create';
const tones={sarcastico:'Sarcastico',elegante:'Elegante',assurdo:'Assurdo'};
const intensityLabels={leggero:'Leggero',medio:'Medio',forte:'Forte'};
const getTheme=()=>THEMES.find(x=>x.id===settings.theme)||THEMES[0];
const humanName=()=>settings.name.trim().replace(/\s+/g,' ').slice(0,48);
const chooseName=()=>humanName()||'Tu';
const rand=()=>{if(window.crypto&&window.crypto.getRandomValues){let a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]/4294967296}return Math.random()};
const shuffled=arr=>{let a=[...arr];for(let i=a.length-1;i>0;i--){let j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a};
const endLine = (base,index) => {
 const tails={
 leggero:['Diciamo che la misura non è il tuo hobby.','','','E tutto prima di colazione.'],
 medio:['Un talento davvero sproporzionato.','','Non fai mai le cose a metà.','Si accettano candidature per riportarti sulla Terra.'],
 forte:['La proporzione nel frattempo è emigrata.','Persino il buon senso ha chiesto una pausa.','Il senso della misura è ufficialmente irreperibile.','E siamo ancora al prologo.']
 };
 const tail=tails[settings.intensity][index%4];
 return base+(tail?' '+tail:'');
};
function buildPhrase(scene,index){
 const [event,...actions]=scene;
 const ix={sarcastico:0,elegante:1,assurdo:2}[settings.tone];
 const act=actions[ix];
 const name=humanName();
 const lead=name?name+', ':'';
 const prefixName=name?name+': ':'';
 const patterns={
 leggero:[
 ()=>`${lead}quando ${event}, pensi già di ${act}.`,
 ()=>`${prefixName}${event} e la tua soluzione è ${act}.`,
 ()=>`${lead}se ${event}, vuoi immediatamente ${act}.`,
 ()=>`${prefixName}appena ${event}, per te è ora di ${act}.`
 ],
 medio:[
 ()=>`${lead}se ${event}, riesci a ${act}.`,
 ()=>`${prefixName}${event} e tu scegli di ${act}.`,
 ()=>`${lead}quando ${event}, decidi di ${act}.`,
 ()=>`${prefixName}quando ${event}, per te è il momento di ${act}.`
 ],
 forte:[
 ()=>`${lead}${event} e tu arrivi a ${act}.`,
 ()=>`${prefixName}se ${event}, ti spingi fino a ${act}.`,
 ()=>`${lead}quando ${event}, riesci perfino a ${act}.`,
 ()=>`${prefixName}${event}, quindi naturalmente decidi di ${act}.`
 ]
 };
 const base=patterns[settings.intensity][index%4]();
 return endLine(base,index);
}
function contextualPhrase(i){
 const ep=settings.episode.trim().replace(/\s+/g,' ').slice(0,145).replace(/[.!?]+$/,'');
 if(!ep) return null;
 const q='«'+ep+'»';
 const n=humanName();const subject=n?n+', ':' ';
 const opts={
 sarcastico:[`${subject}${q}: e pensare che qualcuno lo avrebbe chiamato un episodio qualunque.`,`${subject}trasformare ${q} in un caso nazionale richiede un impegno che sfiora la professione.`],
 elegante:[`${subject}${q}: un episodio che nelle tue mani acquisisce proporzioni istituzionali.`,`${subject}la vicenda ${q} ha ricevuto un trattamento narrativo di rara solennità.`],
 assurdo:[`${subject}${q}: manca soltanto la sigla del telegiornale e un elicottero sopra il quartiere.`,`${subject}dopo ${q}, il pianeta attende soltanto il comunicato del tuo ufficio stampa.`]
 };
 if(settings.theme!=='dramma'){
 return [
 `${subject}${q}: hai appena regalato all’episodio un capitolo tutto suo.`,
 `${subject}${q}: siamo certi che una commissione di esperti riuscirebbe a studiarlo senza la tua introduzione.`
 ][i%2]
 }
 return opts[settings.tone][i%2];
}
function generate(){
 const scenes=shuffled(getTheme().scenes).slice(0,settings.episode.trim()?6:8);
 const freshly=scenes.map((x,i)=>buildPhrase(x,i));
 if(settings.episode.trim()){freshly.splice(2,0,contextualPhrase(0));freshly.push(contextualPhrase(1))}
 results=shuffled(freshly).slice(0,8).map((text,i)=>({id:Date.now()+'-'+i+'-'+Math.round(rand()*1e6),text,theme:settings.theme,tone:settings.tone,intensity:settings.intensity,created:new Date().toISOString()}));
 localStorage.setItem(LAST_KEY,JSON.stringify(results));
 renderResults();
 toast('8 nuove battute generate');
}
function saveSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}
function syncForm(){
 $('#targetName').value=settings.name;
 $('#themeSelect').value=settings.theme;
 $('#toneSelect').value=settings.tone;
 $('#intensitySelect').value=settings.intensity;
 $('#episode').value=settings.episode;
 $('#themeHint').textContent=getTheme().hint;
 $('#intensityIcon').textContent={leggero:'🌶️',medio:'🌶️🌶️',forte:'🌶️🌶️🌶️'}[settings.intensity];
 $('#countFav').textContent=favorites.length;
 $('#offlinePill').textContent=navigator.onLine?'Disponibile offline':'Modalità offline';
}
function renderResults(){
 const host=$('#results');
 if(!results.length){host.innerHTML='<div class="empty"><span>✨</span><strong>Nessuna battuta ancora</strong><p>Configura la persona e tocca Genera.</p></div>';return;}
 host.innerHTML=results.map((obj,i)=>`
 <article class="roast-card">
  <div class="roast-card-top"><span class="ranking">#${String(i+1).padStart(2,'0')}</span><span class="category-label">${escapeHtml(tones[obj.tone]||obj.tone)} · ${escapeHtml(intensityLabels[obj.intensity]||obj.intensity)}</span></div>
  <p class="roast-text">${escapeHtml(obj.text)}</p>
  <div class="card-actions">
   <button class="mini-btn" data-action="copy" data-list="results" data-index="${i}" aria-label="Copia battuta ${i+1}">⧉ <span>Copia</span></button>
   <button class="mini-btn" data-action="share" data-list="results" data-index="${i}" aria-label="Condividi battuta ${i+1}">↗ <span>Condividi</span></button>
   <button class="mini-btn ${isFav(obj.text)?'liked':''}" data-action="favorite" data-list="results" data-index="${i}" aria-label="Salva battuta ${i+1}">${isFav(obj.text)?'♥':'♡'} <span>${isFav(obj.text)?'Salvata':'Salva'}</span></button>
  </div>
 </article>`).join('');
}
function renderFavs(){
 $('#countFav').textContent=favorites.length;
 const host=$('#favorites');
 if(!favorites.length){host.innerHTML='<div class="empty"><span>♡</span><strong>Ancora nessuna preferita</strong><p>Tocca il cuore sotto una battuta per conservarla su questo iPhone.</p></div>';return}
 host.innerHTML=favorites.map((obj,i)=>`<article class="roast-card"><div class="roast-card-top"><span class="ranking">♥</span><span class="category-label">Preferita ${i+1}</span></div><p class="roast-text">${escapeHtml(obj.text)}</p><div class="card-actions"><button class="mini-btn" data-action="copy" data-list="favorites" data-index="${i}">⧉ Copia</button><button class="mini-btn" data-action="share" data-list="favorites" data-index="${i}">↗ Condividi</button><button class="mini-btn liked" data-action="favorite" data-list="favorites" data-index="${i}">♥ Rimuovi</button></div></article>`).join('');
}
const isFav=text=>favorites.some(f=>f.text===text);
function toggleFav(obj){
 if(isFav(obj.text)){favorites=favorites.filter(x=>x.text!==obj.text);toast('Rimossa dai preferiti')}
 else{favorites.unshift({...obj,saved:new Date().toISOString()});toast('Aggiunta ai preferiti')}
 localStorage.setItem(FAV_KEY,JSON.stringify(favorites));renderResults();renderFavs();
}
async function copyText(text){
 try{
 if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
 else{
  let t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();
  if(!document.execCommand('copy'))throw Error('clipboard unavailable');t.remove();
 }
 toast('Copiato negli appunti');
 }catch(e){toast('Copia non disponibile: usa Condividi')}
}
async function shareText(text){
 try{if(navigator.share)await navigator.share({text,title:'ROAST LAB'});else await copyText(text)}
 catch(e){if(e.name!=='AbortError')toast('Condivisione non disponibile')}
}
let toastTimer;
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}
function switchTab(tab){
 selectedTab=tab;
 $$('[data-tab]').forEach(el=>{const active=el.dataset.tab===tab;el.classList.toggle('active',active);el.setAttribute('aria-selected',String(active))});
 $$('.tab-view').forEach(el=>{el.hidden=el.id!=='view-'+tab});
 if(tab==='saved')renderFavs();
 window.scrollTo({top:0,behavior:'smooth'});
}
function download(name,blob){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
function backup(){download('ROAST_LAB_backup_'+new Date().toISOString().slice(0,10)+'.json',new Blob([JSON.stringify({app:'ROAST_LAB',version:VERSION,exported:new Date().toISOString(),settings,favorites},null,2)],{type:'application/json'}));toast('Backup esportato')}
function importBackup(file){
 if(!file)return;
 if(file.size>2e6){toast('Backup troppo grande');return}
 const reader=new FileReader();reader.onload=()=>{
 try{const data=JSON.parse(reader.result);if(data.app!=='ROAST_LAB'||!Array.isArray(data.favorites))throw Error('invalid');
  const valid=new Set(THEMES.map(t=>t.id));
  if(data.settings&&typeof data.settings==='object'){
   const s=data.settings;settings={...defaults,name:typeof s.name==='string'?s.name.slice(0,48):defaults.name,theme:valid.has(s.theme)?s.theme:defaults.theme,tone:tones[s.tone]?s.tone:defaults.tone,intensity:intensityLabels[s.intensity]?s.intensity:defaults.intensity,episode:typeof s.episode==='string'?s.episode.slice(0,220):''};
  }
  favorites=data.favorites.filter(x=>x&&typeof x.text==='string').slice(0,300).map(x=>({...x,text:x.text.slice(0,600)}));
  saveSettings();localStorage.setItem(FAV_KEY,JSON.stringify(favorites));syncForm();renderFavs();renderResults();toast('Backup ripristinato');
 }catch(e){toast('File non valido per ROAST LAB')}
 };reader.readAsText(file);
}
function makeAIPrompt(){
 const cat=getTheme().label;
 return `Crea 8 frecciatine nuove per una satira giocosa e un botta e risposta, riferite soltanto ai comportamenti, senza minacce, discriminazioni, dettagli sensibili o umiliazioni pesanti. Nome/soprannome: ${humanName()||'nessuno'}. Comportamento: ${cat}. Tono: ${tones[settings.tone]}. Intensità: ${intensityLabels[settings.intensity]}. Episodio: ${settings.episode.trim()||'nessuno'}. Ogni battuta deve essere breve, arguta, memorabile e diversa dalle altre. Ordinale per originalità e scegli la migliore.`;
}
function init(){
 const sel=$('#themeSelect');sel.innerHTML=THEMES.map(t=>`<option value="${t.id}">${t.emoji} ${escapeHtml(t.label)}</option>`).join('');
 syncForm();
 ['targetName','themeSelect','toneSelect','intensitySelect','episode'].forEach(id=>{
  const el=$('#'+id);el.addEventListener(id==='targetName'||id==='episode'?'input':'change',()=>{
   const map={targetName:'name',themeSelect:'theme',toneSelect:'tone',intensitySelect:'intensity',episode:'episode'};
   settings[map[id]]=el.value;saveSettings();
   if(id==='themeSelect')$('#themeHint').textContent=getTheme().hint;
   if(id==='intensitySelect')$('#intensityIcon').textContent={leggero:'🌶️',medio:'🌶️🌶️',forte:'🌶️🌶️🌶️'}[settings.intensity];
  });
 });
 $$('[data-tab]').forEach(el=>el.addEventListener('click',()=>switchTab(el.dataset.tab)));
 $('#generateButton').addEventListener('click',generate);
 $('#reshuffleButton').addEventListener('click',generate);
 document.addEventListener('click',(e)=>{
  const b=e.target.closest('[data-action]');if(!b)return;
  const list=b.dataset.list==='results'?results:favorites;
  const obj=list[Number(b.dataset.index)];if(!obj)return;
  if(b.dataset.action==='copy')copyText(obj.text);
  if(b.dataset.action==='share')shareText(obj.text);
  if(b.dataset.action==='favorite')toggleFav(obj);
 });
 $('#backupBtn').addEventListener('click',backup);
 $('#importBtn').addEventListener('click',()=>$('#importFile').click());
 $('#importFile').addEventListener('change',e=>{importBackup(e.target.files[0]);e.target.value=''});
 $('#aiPromptBtn').addEventListener('click',()=>copyText(makeAIPrompt()));
 $('#shareAppBtn').addEventListener('click',()=>{if(location.protocol.startsWith('http'))shareText(location.href);else toast('Pubblica prima l’app su HTTPS')});
 $('#clearFavBtn').addEventListener('click',()=>{if(!favorites.length){toast('Nessuna preferita da eliminare');return}if(confirm('Eliminare tutte le battute preferite?')){favorites=[];localStorage.setItem(FAV_KEY,'[]');renderFavs();renderResults();toast('Preferiti eliminati')}});
 window.addEventListener('online',syncForm);window.addEventListener('offline',syncForm);
 $('#appVersion').textContent=VERSION;
 if(!results.length)generate();else renderResults();
 renderFavs();
 if('serviceWorker' in navigator&&location.protocol.startsWith('http')){
  navigator.serviceWorker.register('./sw.js').catch(()=>{});
 }
}
document.addEventListener('DOMContentLoaded',init);
