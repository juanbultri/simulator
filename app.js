'use strict';
// App nativa, sin dependencias de CDN. Las respuestas del entrenamiento están en questions.js;
// la competición no confía en los puntos calculados aquí: Supabase los recalcula.
const $ = id => document.getElementById(id);
const esc = text => String(text ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffled = a => {const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const CONFIG = window.RUGBY_CONFIG||{};
const URL_BASE = String(CONFIG.SUPABASE_URL||'').replace(/\/+$/,'');
const PUBLIC_KEY = String(CONFIG.SUPABASE_ANON_KEY||'');
const cloudReady = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(URL_BASE)&&PUBLIC_KEY.length>20;
const LOCAL_KEY='rugby_iq_v3_rounds'; const AUTH_KEY='rugby_iq_v3_session';
let editingNickname=false;
let state={tab:'train',trainLevel:1,leagueLevel:1,boardLevel:1,session:null,profile:null,round:[],answers:[],pos:0,pick:null,checked:false,mode:'train',records:[],lastResult:null,busy:false,challenge:null};
function toast(message){$('toast').textContent=message;$('toast').classList.remove('hidden');clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.add('hidden'),3500);}
function show(id){document.querySelectorAll('.view').forEach(e=>e.classList.toggle('hidden',e.id!==id));window.scrollTo({top:0,behavior:'instant'});}
function hint(id,message,type=''){const e=$(id); e.textContent=message;e.className='hint'+(type?' '+type:'');}
function setTab(name){state.tab=name;const league=name==='league';$('tabTraining').classList.toggle('selected',!league);$('tabLeague').classList.toggle('selected',league);$('tabTraining').setAttribute('aria-selected',String(!league));$('tabLeague').setAttribute('aria-selected',String(league));$('trainingSetup').classList.toggle('hidden',league);$('leagueSetup').classList.toggle('hidden',!league);if(league)refreshLeagueNotice();}
function setLevel(group,value){state[group==='trainLevels'?'trainLevel':'leagueLevel']=value;document.querySelectorAll('#'+group+' .level').forEach(b=>b.classList.toggle('chosen',Number(b.dataset.level)===value));if(group==='trainLevels')populateTopics();}
function populateTopics(){const topics=[...new Set(DATA.filter(q=>q.level===state.trainLevel).map(q=>q.topic))].sort();$('topic').innerHTML='<option value="all">Todos los temas</option>'+topics.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');}
function readLocal(){try{const v=JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]');return Array.isArray(v)?v:[];}catch{return []}}
function writeLocal(row){try{localStorage.setItem(LOCAL_KEY,JSON.stringify([row,...readLocal()].slice(0,150)));}catch(e){toast('No se pudo guardar el historial local.');}renderStats();}
function renderStats(){const items=readLocal(),total=items.reduce((n,r)=>n+(r.total||0),0),good=items.reduce((n,r)=>n+(r.correct||0),0);$('totalRounds').textContent=items.length;$('totalAnswered').textContent=total;$('totalAccuracy').textContent=total?Math.round(100*good/total)+'%':'—';}
function refreshLeagueNotice(){
 if(!cloudReady){hint('leagueAlert','La liga necesita Supabase. El entrenamiento local funciona sin conexión.');return;}
 if(!state.profile){hint('leagueAlert','Entrá con un apodo desde Mi perfil para participar. No pedimos correo ni contraseña.');return;}
 hint('leagueAlert',`¡Bienvenido/a, ${state.profile.nickname}! Una ronda puntuable de 10 preguntas por semana y nivel.`,'success');
}
function refreshAccountUI(){
 if(!cloudReady){hint('accountMessage','La conexión a Supabase no está disponible. Podés seguir entrenando localmente.');$('profileForm').classList.add('hidden');$('profileCard').classList.add('hidden');$('syncStatus').textContent='● Progreso local';refreshLeagueNotice();return;}
 const joined=Boolean(state.profile);
 $('profileForm').classList.toggle('hidden',joined&&!editingNickname);
 $('profileCard').classList.toggle('hidden',!joined);
 if(joined){$('profileName').textContent=state.profile.nickname;if(!editingNickname)$('nickname').value=state.profile.nickname;}
 $('saveProfile').textContent=joined?'Guardar nuevo apodo':'Entrar con mi apodo →';
 hint('accountMessage',joined?'Tu apodo está registrado. El dispositivo recuerda tu acceso.':'Elegí un apodo. Supabase creará una sesión anónima, sin correo ni contraseña.');
 $('syncStatus').textContent=joined?'● Liga conectada':'● Elegí tu apodo';
 refreshLeagueNotice();
}
function loadSession(){try{const s=JSON.parse(localStorage.getItem(AUTH_KEY)||'null');state.session=s?.access_token?s:null;}catch{state.session=null}}
function saveSession(s){state.session=s;if(s){try{localStorage.setItem(AUTH_KEY,JSON.stringify(s));}catch{}}else{localStorage.removeItem(AUTH_KEY);state.profile=null;}refreshAccountUI();}
function apiError(data,status){return Error(data?.message||data?.msg||data?.error_description||data?.error||`Error HTTP ${status}`)}
async function api(path,{method='GET',body,auth=true,retry=true}={}){
 if(!cloudReady)throw Error('La nube no está configurada.');
 if(auth&&state.session?.refresh_token&&state.session?.expires_at&&Date.now()/1000>state.session.expires_at-60){await refreshSession();}
 const hdr={'apikey':PUBLIC_KEY};if(body!==undefined)hdr['Content-Type']='application/json';
 if(auth&&state.session?.access_token)hdr['Authorization']='Bearer '+state.session.access_token;
 const response=await fetch(URL_BASE+path,{method,headers:hdr,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'});
 let data;try{data=await response.json();}catch{data={}};
 if(!response.ok){if(response.status===401&&retry&&auth&&state.session?.refresh_token){await refreshSession();return api(path,{method,body,auth,retry:false});}throw apiError(data,response.status);}
 return data;
}
async function refreshSession(){const s=state.session;if(!s?.refresh_token)throw Error('Sesión caducada. Iniciá sesión nuevamente.');
 const result=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:s.refresh_token},auth:false});saveSession({...result,expires_at:result.expires_at||Math.floor(Date.now()/1000)+(result.expires_in||3600)});}
async function rpc(name,params={}){return api('/rest/v1/rpc/'+name,{method:'POST',body:params});}
async function fetchProfile(){if(!state.session?.user?.id){state.profile=null;return;}const id=encodeURIComponent(state.session.user.id);const rows=await api(`/rest/v1/profiles?select=id,nickname&id=eq.${id}&limit=1`);state.profile=Array.isArray(rows)?rows[0]||null:null;refreshAccountUI();}
async function cloudStats(){if(!state.profile)return;try{let d=await rpc('get_my_stats');$('cloudSummary').textContent=`Nube: ${d.practice_rounds||0} entrenamientos y ${d.weekly_rounds||0} desafíos semanales guardados. El panel de arriba muestra tus rondas locales de este navegador.`;}catch(e){$('cloudSummary').textContent='No se pudieron cargar las estadísticas de la nube: '+e.message;}}
async function saveProfile(){
 const nickname=$('nickname').value.trim();
 if(nickname.length<3||nickname.length>24){toast('El apodo debe tener entre 3 y 24 caracteres.');return;}
 if(/[<>\x00-\x1f\x7f]/.test(nickname)){toast('El apodo tiene caracteres no permitidos.');return;}
 try{
  $('saveProfile').disabled=true;
  if(!state.session?.access_token){
   // Supabase Auth anonymous sign-up: ninguna dirección de correo ni datos personales.
   const guest=await api('/auth/v1/signup',{method:'POST',body:{data:{}},auth:false});
   if(!guest?.access_token||!guest?.user?.id)throw Error('No se pudo crear el perfil anónimo. Activá Anonymous Sign-Ins en Supabase Auth → Providers.');
   saveSession({...guest,expires_at:guest.expires_at||Math.floor(Date.now()/1000)+(guest.expires_in||3600)});
  }
  await rpc('join_club_nickname',{p_nickname:nickname});
  editingNickname=false;
  await fetchProfile();await cloudStats();
  toast('¡Bienvenido/a a la liga, '+nickname+'!');show('home');setTab('league');
 }catch(e){toast('No se pudo registrar el apodo: '+e.message);}
 finally{$('saveProfile').disabled=false;}
}
async function signOut(){
 if(!confirm('Si olvidás este perfil, no podrás recuperar esta cuenta anónima ni sus resultados desde este dispositivo. ¿Continuar?'))return;
 if(state.session?.access_token){try{await api('/auth/v1/logout',{method:'POST'});}catch{}}
 editingNickname=false;saveSession(null);$('nickname').value='';
 $('cloudSummary').textContent='El progreso local sigue disponible. Elegí un apodo para volver a la liga.';show('home');
}
function current(){return state.round[state.pos]}
function startRound(mode,questions,challenge=null){state.mode=mode;state.round=questions;state.answers=Array(questions.length).fill(null);state.pos=0;state.pick=null;state.checked=false;state.records=[];state.challenge=challenge;renderQuestion();show('quiz');}
function renderQuestion(){const q=current(),i=state.pos,train=state.mode==='train';if(!q)return;state.checked=train&&Boolean(state.records[i]);state.pick=state.answers[i];$('quizMode').textContent=train?'📖 Entrenamiento':'🏆 Desafío semanal';$('quizLevel').textContent='Nivel '+q.level;$('quizTopic').textContent=q.topic;$('quizCount').textContent=(i+1)+' / '+state.round.length;$('progressFill').style.width=((i)/state.round.length*100)+'%';$('quizPrompt').textContent=train?'¿Qué harías en esta situación?':'Elegí una opción. La corrección llega al final.';$('scene').textContent=q.scene;
 $('diagram').classList.toggle('hidden',!q.diagram);$('diagram').innerHTML=q.diagram?diagramSVG(q.diagram):'';$('question').textContent=q.question;
 $('answers').innerHTML=q.options.map((o,j)=>`<button type="button" class="answer ${state.pick===j?'selected':''}" data-choice="${j}" ${state.checked?'disabled':''}><span class="letter">${'ABCD'[j]}</span><span>${esc(o)}</span></button>`).join('');
 $('answers').querySelectorAll('.answer').forEach(b=>b.addEventListener('click',()=>{if(state.checked)return;state.pick=Number(b.dataset.choice);state.answers[i]=state.pick;$('answers').querySelectorAll('.answer').forEach(x=>x.classList.toggle('selected',x===b));$('checkAnswer').disabled=false;if(!train)renderAnswerGrid();}));
 $('checkAnswer').classList.toggle('hidden',!train||state.checked);$('checkAnswer').disabled=state.pick===null;
 $('nextQuestion').classList.toggle('hidden',train&&!state.checked);$('nextQuestion').textContent=train?(i+1===state.round.length?'Ver resultados':'Siguiente →'):(i+1===state.round.length?'Entregar desafío':'Siguiente →');
 $('previous').classList.toggle('hidden',train||i===0);$('answerGrid').classList.toggle('hidden',train);
 $('feedback').classList.add('hidden');if(train&&state.checked)showFeedback();if(!train)renderAnswerGrid();}
function showFeedback(){const q=current(),correct=state.pick===q.answer;$('answers').querySelectorAll('.answer').forEach(b=>{let n=Number(b.dataset.choice);b.classList.toggle('good',n===q.answer);b.classList.toggle('bad',n===state.pick&&n!==q.answer);b.disabled=true;});$('feedback').innerHTML=`<b class="${correct?'':'wrong'}">${correct?'✓ ¡Correcto!':'✕ Incorrecto.'}</b><p>${esc(q.explanation)}</p><small>📖 Ley ${q.law} · <a href="${esc(q.url)}" target="_blank" rel="noopener noreferrer">Consultar World Rugby</a></small>`;$('feedback').classList.remove('hidden');}
function renderAnswerGrid(){$('answerGrid').innerHTML=state.answers.map((c,i)=>`<button type="button" class="${c!==null?'done':''} ${i===state.pos?'current':''}" data-pos="${i}" aria-label="Ir a la pregunta ${i+1}">${i+1}</button>`).join('');$('answerGrid').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.pos=Number(b.dataset.pos);renderQuestion();window.scrollTo(0,0);});}
function checkAnswer(){if(state.pick===null||state.checked)return;state.records[state.pos]={q:current(),choice:state.pick};state.checked=true;renderQuestion();}
async function nextQuestion(){if(state.mode==='train'&&!state.checked)return;if(state.mode==='league'&&state.pos===state.round.length-1){if(state.answers.some(a=>a===null)){toast('Respondé las 10 preguntas antes de entregar. Podés navegar con los números.');return;}if(!confirm('¿Entregar el desafío? Solo hay una participación puntuable por semana y nivel.'))return;await finishRound();return;}
 if(state.pos+1<state.round.length){state.pos++;renderQuestion();window.scrollTo(0,0);}else await finishRound();}
async function finishRound(){if(state.busy)return;state.busy=true;try{
 const isLeague=state.mode==='league';const rows=state.round.map((q,i)=>({q,choice:state.answers[i]}));
 if(rows.some(r=>r.choice===null)){toast('Hay preguntas sin responder.');return;}
 let correct=rows.filter(r=>r.choice===r.q.answer).length,total=rows.length;
 let cloudText='';
 if(isLeague){try{const result=await rpc('submit_weekly',{p_level:state.leagueLevel,p_answers:rows.map(r=>({id:r.q.id,choice:r.choice}))});correct=result.correct_count;total=result.total;cloudText='✓ Resultado verificado y registrado en la liga. No podrás repetir este nivel hasta la próxima semana.';state.lastResult=result;}
 catch(e){toast('No se pudo registrar el desafío: '+e.message);return;}}
 else {writeLocal({date:new Date().toISOString(),mode:'train',level:state.trainLevel,correct,total});
 if(state.profile){try{await rpc('submit_practice',{p_level:state.trainLevel,p_answers:rows.map(r=>({id:r.q.id,choice:r.choice}))});cloudText='✓ Entrenamiento sincronizado con la nube.';await cloudStats();}catch(e){cloudText='Se guardó en este dispositivo, pero no se pudo sincronizar: '+e.message;}}else cloudText='Entrenamiento guardado en este dispositivo.';}
 state.records=rows;const bad=total-correct;
 $('resultKicker').textContent=isLeague?'🏆 DESAFÍO SEMANAL · RESULTADO':'📖 ENTRENAMIENTO · RESULTADO';$('resultTitle').textContent=correct===total?'¡Ronda perfecta!':isLeague?'¡Ronda entregada!':'¡Ronda completada!';$('resultSubtitle').textContent=isLeague?'Tus aciertos fueron calculados por el servidor. Ahora sí podés revisar todas las respuestas.':'Cada pregunta incluye la explicación y la referencia al reglamento.';
 $('resultCorrect').textContent=correct;$('resultWrong').textContent=bad;$('resultPct').textContent=Math.round(correct/total*100)+'%';
 $('resultCloud').classList.remove('hidden');$('resultCloud').className='hint'+((isLeague||cloudText.startsWith('✓'))?' success':'');$('resultCloud').textContent=cloudText;
 $('repeatWrong').classList.toggle('hidden',isLeague);$('repeatWrong').disabled=!bad;
 $('reviews').innerHTML=rows.map((r,i)=>`<details class="review"><summary>${r.choice===r.q.answer?'✅':'❌'} ${i+1}. ${esc(r.q.scene)}</summary><p><b>${esc(r.q.question)}</b></p>${r.q.diagram?`<div class="diagram">${diagramSVG(r.q.diagram)}</div>`:''}<p><b>Elegiste:</b> ${esc(r.q.options[r.choice])}</p><p><b>Correcta:</b> ${esc(r.q.options[r.q.answer])}</p><p>${esc(r.q.explanation)}</p><p><a href="${esc(r.q.url)}" target="_blank" rel="noopener noreferrer">Ley ${r.q.law} · World Rugby</a></p></details>`).join('');show('results');
 }finally{state.busy=false;}}
function startTraining(){let questions=DATA.filter(q=>q.level===state.trainLevel&&($('topic').value==='all'||q.topic===$('topic').value));if($('order').value==='random')questions=shuffled(questions);const n=$('count').value==='all'?questions.length:Number($('count').value);if(!questions.length){toast('No hay preguntas para ese filtro.');return;}startRound('train',questions.slice(0,n));}
async function startLeague(){if(!cloudReady){toast('Configurá Supabase para habilitar la liga.');return;}if(!state.profile){show('account');refreshAccountUI();return;}
 try{$('startLeague').disabled=true;const res=await rpc('get_weekly_challenge',{p_level:state.leagueLevel});if(res.played){toast('Ya participaste este nivel esta semana. Podés consultar el ranking.');state.boardLevel=state.leagueLevel;await showLeaderboard();return;}
 const qs=res.ids.map(id=>DATA.find(q=>q.id===id));if(qs.some(q=>!q)||qs.length!==10)throw Error('El banco de preguntas y la base de datos no coinciden. Ejecutá seed.sql.');startRound('league',qs,res);
 }catch(e){toast('No se pudo iniciar el desafío: '+e.message);}finally{$('startLeague').disabled=false;}}
async function showLeaderboard(){if(!state.profile){show('account');toast('Entrá al club para consultar la clasificación.');return;}show('leaderboard');document.querySelectorAll('[data-boardlevel]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.boardlevel)===state.boardLevel));$('boardRows').innerHTML='';hint('boardMessage','Cargando clasificación…');
 try{let data=await rpc('get_weekly_leaderboard',{p_level:state.boardLevel});$('weekLabel').textContent='Semana del '+data.week_start;
 let entries=data.leaders||[];hint('boardMessage',entries.length?`${entries.length} jugador(es) ya completaron este nivel esta semana.`:'Todavía no hay resultados para este nivel. ¡Podés inaugurar el ranking!',entries.length?'success':'');$('boardRows').innerHTML=entries.map((e,i)=>`<div class="board-row ${e.me?'me':''}"><div class="rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</div><div class="board-name"><strong>${esc(e.nickname)} ${e.me?'(vos)':''}</strong><small>${esc(e.correct_count)} de 10 correctas</small></div><div class="points">${e.correct_count}/10</div></div>`).join('');
 }catch(e){hint('boardMessage','Error al cargar la clasificación: '+e.message,'error');}}
async function showHistory(){
 const rows=readLocal();
 $('historyRows').innerHTML=rows.length?rows.map(r=>`<div class="history-row"><span>${esc(new Date(r.date).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}))} · Nivel ${esc(r.level)}</span><strong>${esc(r.correct)} / ${esc(r.total)} correctas</strong></div>`).join(''):'<p class="muted">Todavía no completaste ningún entrenamiento en este dispositivo.</p>';
 show('history');
 if(!cloudReady || !state.session){$('cloudHistoryRows').innerHTML='<p class="muted">Entrá con un apodo para consultar el historial de este dispositivo en la nube.</p>';return;}
 if(!state.profile){$('cloudHistoryRows').innerHTML='<p class="muted">Elegí un apodo en Mi perfil para consultar el historial sincronizado.</p>';return;}
 $('cloudHistoryRows').innerHTML='<p class="muted">Cargando historial sincronizado…</p>';
 try{
  const [practice,weekly]=await Promise.all([
   api('/rest/v1/practice_attempts?select=level,correct_count,total,submitted_at&order=submitted_at.desc&limit=50'),
   api('/rest/v1/weekly_attempts?select=level,correct_count,total,submitted_at&order=submitted_at.desc&limit=50')
  ]);
  const items=[...practice.map(r=>({...r,mode:'Entrenamiento'})),...weekly.map(r=>({...r,mode:'Liga semanal'}))].sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)).slice(0,50);
  $('cloudHistoryRows').innerHTML=items.length?items.map(r=>`<div class="history-row"><span>${esc(new Date(r.submitted_at).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}))} · ${esc(r.mode)} · Nivel ${esc(r.level)}</span><strong>${esc(r.correct_count)} / ${esc(r.total)} correctas</strong></div>`).join(''):'<p class="muted">Todavía no hay rondas sincronizadas.</p>';
 }catch(e){$('cloudHistoryRows').textContent='No se pudo recuperar el historial de la nube: '+e.message;}
}
async function boot(){loadSession();populateTopics();renderStats();refreshAccountUI();if(cloudReady&&state.session){try{await fetchProfile();await cloudStats();}catch(e){console.warn('No fue posible recuperar la sesión:',e.message);}}if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});}
$('tabTraining').onclick=()=>setTab('train');$('tabLeague').onclick=()=>setTab('league');
document.querySelectorAll('#trainLevels .level').forEach(b=>b.onclick=()=>setLevel('trainLevels',Number(b.dataset.level)));
document.querySelectorAll('#leagueLevels .level').forEach(b=>b.onclick=()=>setLevel('leagueLevels',Number(b.dataset.level)));
$('startTrain').onclick=startTraining;$('startLeague').onclick=startLeague;$('checkAnswer').onclick=checkAnswer;$('nextQuestion').onclick=nextQuestion;
$('previous').onclick=()=>{if(state.pos>0){state.pos--;renderQuestion();}};
$('quitQuiz').onclick=()=>{if(confirm('¿Abandonar? El progreso de esta ronda no se contará.'))show('home');};
$('goAccount').onclick=()=>show('account');document.querySelectorAll('[data-home]').forEach(b=>b.onclick=()=>show('home'));
$('saveProfile').onclick=saveProfile;$('logoutTwo').onclick=signOut;$('editNickname').onclick=()=>{editingNickname=true;refreshAccountUI();$('nickname').focus();};
$('viewBoard').onclick=async()=>{state.boardLevel=state.leagueLevel;await showLeaderboard();};document.querySelectorAll('[data-boardlevel]').forEach(b=>b.onclick=()=>{state.boardLevel=Number(b.dataset.boardlevel);showLeaderboard();});
$('repeatWrong').onclick=()=>{let wrong=state.records.filter(r=>r.choice!==r.q.answer).map(r=>r.q);if(!wrong.length)return;state.trainLevel=wrong[0].level;startRound('train',wrong);};$('backHome').onclick=()=>{renderStats();show('home');};$('openHistory').onclick=showHistory;
$('clearLocal').onclick=()=>{if(confirm('¿Borrar el historial de este dispositivo? Los registros ya sincronizados a la nube no se borrarán.')){localStorage.removeItem(LOCAL_KEY);renderStats();showHistory();}};
boot();
