import { getSupabase } from './supabase.js';
import { signUp, signIn, signOut, sendPasswordReset, updatePassword, currentContext } from './auth.js';
import { calculateCalories, createActivity, listMyActivities } from './activities.js';
import { weeklyRankings, dashboardStats, teacherStudents, saveVideo } from './data.js';
import { saveGoal, saveQuiz, saveArticle } from './data.js';
import { createPost, listPosts, comment, rate } from './community.js';
import { listConversation, sendMessage, editOwnMessage } from './messages.js';
import { uploadUserImage } from './images.js';
import { buildTrainingPlan } from './training-plans.js';

let context={session:null,profile:null};
let productionSport=sessionStorage.getItem('sumandoMinutosUltimoDeporte')||'Running';
let selectedStudent=null;
let pendingTrainingPlan=null;
const $=id=>document.getElementById(id);
const toast=(message,type='info')=>{
  const el=$('toast'); if(!el)return; el.textContent=message; el.dataset.type=type; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),4000);
};
const busy=(element,on,label='Procesando…')=>{ if(!element)return; if(on){element.dataset.oldText=element.textContent;element.textContent=label;element.disabled=true;}else{element.textContent=element.dataset.oldText||element.textContent;element.disabled=false;} };
const mapProfile=p=>p?({id:p.id,name:p.full_name,username:p.username,email:p.email,age:p.age,photo:p.avatar_url,role:p.role==='teacher'?'docente':'estudiante',sport:p.favorite_sport,institution:p.institution,weight:p.weight_kg}):null;

function applyContext(){
  window.__SUMANDO_CONTEXT__=context;
  const p=mapProfile(context.profile);
  if(p){
    window.getActiveUser=()=>p; window.getSession=()=>p.email; window.getUsers=()=>[p];
    document.body.classList.add('logged-in'); document.body.classList.toggle('teacher-session',p.role==='docente');
    document.querySelectorAll('[data-role-menu]').forEach(b=>b.classList.toggle('role-menu-hidden',!(b.dataset.roleMenu==='all'||b.dataset.roleMenu===p.role)));
    $('profileName') && ($('profileName').textContent=p.name);
    try{window.enterApp?.(false);}catch(error){console.warn('Vista heredada:',error);}
    window.getQuizProgress=()=>[]; window.saveQuizProgress=items=>{const x=items.at(-1);if(x)saveQuiz({sport:x.sport,question_id:x.questionId,correct:true,xp:x.xp||10}).catch(e=>toast(`❌ ${e.message}`,'error'));};
    window.getReadings=()=>[]; window.saveReadings=items=>{const x=items.at(-1);if(x)saveArticle({article_id:x.url,title:x.title,url:x.url,sport:x.sport,source:x.source}).catch(e=>toast(`❌ ${e.message}`,'error'));};
    window.getSavedVideos=()=>[]; window.saveSavedVideos=items=>{const x=items.at(-1);if(x)saveVideo(x.videoId).catch(e=>toast(`❌ ${e.message}`,'error'));};
  }else document.body.classList.remove('logged-in','teacher-session');
}

window.enviarMensajeIA=async function(message=$('coachInput')?.value){const text=String(message||'').trim();if(!text)return;window.appendCoachMessage?.('user',text,false);if($('coachInput'))$('coachInput').value='';try{const response=await fetch('/api/coach',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:text})});const data=await response.json();if(!response.ok)throw new Error(data.error||'No fue posible responder');window.appendCoachMessage?.('coach',data.reply,false);}catch(error){window.appendCoachMessage?.('coach',`⚠️ ${error.message}`,false);}};

async function refreshContext(){ context=await currentContext(); applyContext(); renderAvatar(); return context; }

async function onLogin(event){
  event.preventDefault(); event.stopImmediatePropagation(); const form=event.currentTarget; const button=form.querySelector('button[type=submit]'); busy(button,true,'Ingresando…');
  try{ await signIn(form.elements.usuario.value,form.elements.password.value); await refreshContext(); toast('✅ Sesión iniciada','success'); window.scrollTo({top:0,behavior:'smooth'}); }
  catch(error){toast(`❌ ${error.message}`,'error');} finally{busy(button,false);}
}
async function onRegister(event){
  event.preventDefault(); event.stopImmediatePropagation(); const form=event.currentTarget; const button=form.querySelector('button[type=submit]'); busy(button,true,'Creando cuenta…');
  try{
    const password=$('regPassword').value;if(password!==$('regPasswordConfirm').value)throw new Error('Las contraseñas no coinciden.');
    const role=$('regRole').value;if(role==='docente')throw new Error('Las cuentas docentes se habilitan de forma segura por un administrador.');
    await signUp({email:$('regEmail').value.trim(),password,username:$('regUser').value.trim(),fullName:$('regName').value.trim(),age:Number($('regAge').value)||null,sport:$('regSport').value,institution:$('regInstitution').value.trim(),avatar:$('regPhoto').files[0]});
    $('registerModal').classList.remove('open'); form.reset(); toast('✅ Cuenta creada. Revisa tu correo para confirmarla.','success');
  }catch(error){toast(`❌ ${error.message}`,'error');}finally{busy(button,false);}
}
async function onRecovery(event){
  event.preventDefault(); event.stopImmediatePropagation(); const email=$('recoveryIdentifier').value.trim();
  try{if(!email.includes('@'))throw new Error('Escribe el correo de tu cuenta.');await sendPasswordReset(email);toast('✅ Enlace de recuperación enviado.','success');$('recoveryModal').classList.remove('open');}catch(error){toast(`❌ ${error.message}`,'error');}
}
function activityPayload(){
  const details=window.readDynamicSportFields?.()||{};
  const a={sport:productionSport,activity_date:$('activityDate').value,minutes:Number($('activityMinutes').value),intensity:$('activityIntensity').value,notes:$('activityNotes').value.trim(),visibility:$('activityVisibility').value};
  const aliases={distance:'distance',distanceMeters:'distance',bodyPart:'body_part',muscleGroup:'body_part',workoutType:'workout_type',exercise:'exercise',sets:'sets',repetitions:'repetitions',weightUsed:'weight',pace:'pace',elevation:'elevation',position:'position',style:'swimming_style',sessionType:'session_type',level:'level',difficulty:'difficulty'};
  Object.entries(details).forEach(([k,v])=>{if(aliases[k]&&v!=='')a[aliases[k]]=v;}); a.calories=calculateCalories(a,context.profile?.weight_kg); return a;
}
async function onActivity(event){
  event.preventDefault();event.stopImmediatePropagation();const button=$('saveActivityBtn');busy(button,true,'Guardando…');
  try{const payload=activityPayload();if(!payload.activity_date||!payload.minutes||payload.minutes<1||!payload.intensity)throw new Error('Completa fecha, tiempo e intensidad.');const s=await getSupabase();const {data:settings}=await s.from('app_settings').select('evidence_required').single();await createActivity(payload,$('activityEvidence').files[0],settings?.evidence_required);toast('✅ Actividad registrada','success');resetActivityForm();await Promise.all([renderHistory(),renderRankings(),renderSportCalories(),renderProgress(),renderProfile()]);}
  catch(error){toast(`❌ ${error.message}`,'error');}finally{busy(button,false);}
}

function resetActivityForm(){
  ['activityDate','activityMinutes','activityNotes'].forEach(id=>{if($(id))$(id).value='';});
  if($('activityIntensity'))$('activityIntensity').selectedIndex=-1;
  document.querySelectorAll('#dynamicSportFields input,#dynamicSportFields textarea').forEach(el=>el.value='');
  document.querySelectorAll('#dynamicSportFields select').forEach(el=>el.selectedIndex=-1);
  if($('activityEvidence'))$('activityEvidence').value='';
  if($('activityVisibility'))$('activityVisibility').value='private';
  const preview=$('activityEvidencePreview');if(preview){preview.removeAttribute('src');preview.classList.remove('visible');}
  if($('evidencePreviewDetails'))$('evidencePreviewDetails').textContent='';
  if($('trainingCalories'))$('trainingCalories').textContent='0 kcal';
}

async function renderSportCalories(){
  if(!context.session)return;const s=await getSupabase();const {data,error}=await s.rpc('sport_calorie_totals',{p_sport:productionSport});if(error)throw error;
  if($('dailyCaloriesLabel'))$('dailyCaloriesLabel').textContent=`Hoy en ${productionSport}`;
  if($('weeklyCaloriesLabel'))$('weeklyCaloriesLabel').textContent=`Esta semana en ${productionSport}`;
  if($('dailySportCalories'))$('dailySportCalories').textContent=`${Math.round(Number(data?.today)||0)} kcal`;
  if($('weeklySportCalories'))$('weeklySportCalories').textContent=`${Math.round(Number(data?.week)||0)} kcal`;
}

const setText=(id,value)=>{if($(id))$(id).textContent=value;};
async function progressSnapshot(){const s=await getSupabase();const {data,error}=await s.rpc('user_progress_snapshot');if(error)throw error;return data||{};}
function levelFromXp(xp){if(xp>=3000)return '5 · Leyenda';if(xp>=1500)return '4 · Experto';if(xp>=700)return '3 · Avanzado';if(xp>=250)return '2 · Constante';return '1 · Principiante';}
async function renderProgress(){
  if(!context.session)return;const d=await progressSnapshot();const target=Number(d.goal_target)||420,current=Number(d.goal_current)||0,pct=Math.min(100,Math.round(current/target*100));
  setText('welcomeName',context.profile?.full_name||'deportista');setText('weeklyMinutes',`${current} / ${target} min`);setText('weeklyStatus',current?`${pct}% del objetivo semanal`:'Sin actividad semanal');setText('currentLevel',levelFromXp(Number(d.xp_total)||0));
  if($('weeklyProgress'))$('weeklyProgress').style.width=`${pct}%`;setText('todayMinutes',d.minutes_today||0);setText('totalMinutes',d.minutes_total||0);setText('totalCalories',Math.round(Number(d.calories_total)||0));setText('totalXp',d.xp_total||0);setText('activeStreak',`${d.streak||0} días`);setText('totalMedals',(Number(d.medals)||0)+(Number(d.education_medals)||0));
}
async function renderHistory(){
  const box=$('activityRecords');if(!box||!context.session)return;box.setAttribute('aria-busy','true');
  try{const {data}=await listMyActivities({sport:productionSport});if(!data.length){box.innerHTML='<div class="records-empty">Sin registro</div>';return;}box.innerHTML=`<div class="records-scroll"><table class="records-table"><thead><tr><th>Fecha</th><th>Deporte</th><th>Minutos</th><th>Intensidad</th><th>Calorías aproximadas</th></tr></thead><tbody>${data.map(a=>`<tr><td>${a.activity_date}</td><td>${a.sport}</td><td>${a.minutes} min</td><td>${a.intensity}</td><td>${a.calories} kcal</td></tr>`).join('')}</tbody></table></div>`;}catch(e){toast(`❌ ${e.message}`,'error');}finally{box.removeAttribute('aria-busy');}
}
async function renderRankings(){
  if(!context.session)return;try{const rows=await weeklyRankings();const target=$('rankingList')||document.querySelector('.ranking-list');if(target)target.innerHTML=rows.length?rows.slice(0,10).map((r,i)=>`<article class="ranking-row"><strong>${['🥇','🥈','🥉'][i]||i+1} ${r.full_name}</strong><span>${r.total_minutes} min</span></article>`).join(''):'<p>Sin registro</p>';}catch(e){console.error(e);}
}
const escape=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
async function renderPosts(){const box=$('communityFeed');if(!box||!context.session)return;try{const posts=await listPosts();box.innerHTML=posts.length?posts.map(p=>{const url=p.image_path?(getPublicCommunityUrl(p.image_path)):'';const avg=p.progress_ratings?.length?(p.progress_ratings.reduce((n,r)=>n+r.rating,0)/p.progress_ratings.length).toFixed(1):'Sin calificar';return `<article class="community-post"><div class="post-author"><strong>${escape(p.profiles?.full_name||'Estudiante')}</strong><span>${escape(p.sport)}</span></div>${url?`<img src="${escape(url)}" alt="Evidencia pública de ${escape(p.sport)}" loading="lazy">`:''}<p>${escape(p.description)}</p><small>Progreso: ${avg}</small><form class="comment-form" data-cloud-comment="${p.id}"><input name="comment" maxlength="500" required placeholder="Comentario positivo"><button>Comentar</button></form><div><input type="range" min="1" max="5" value="3" data-cloud-rating="${p.id}"><button type="button" data-cloud-rate="${p.id}">Calificar</button></div>${(p.comments||[]).map(c=>`<p><strong>${escape(c.profiles?.full_name||'Usuario')}:</strong> ${escape(c.content)}</p>`).join('')}</article>`}).join(''):'<p>Sin registro</p>';}catch(e){toast(`❌ ${e.message}`,'error');}}
function getPublicCommunityUrl(path){const cfg=window.__SUMANDO_PUBLIC_CONFIG__;return cfg?`${cfg.supabaseUrl}/storage/v1/object/public/community/${encodeURI(path)}`:'';}
async function onPost(event){event.preventDefault();event.stopImmediatePropagation();const form=event.currentTarget;try{await createPost({description:$('postDescription').value.trim(),sport:$('postSport').value,visibility:form.elements.postVisibility.value,image:$('postImageInput').files[0]});form.reset();form.classList.remove('open');toast('✅ Publicación guardada','success');await renderPosts();}catch(e){toast(`❌ ${e.message}`,'error');}}
function currentPlan(){return buildTrainingPlan({sport:$('goalSport').value,level:$('goalLevel').value,purpose:$('goalPurpose').value,weeklyMinutes:Number($('goalMinutes').value)||140});}
function renderPlan(plan,targetId){const box=$(targetId);if(!box)return;box.innerHTML=`<h3>${escape(plan.title)}</h3><p>${escape(plan.summary)}</p><div class="training-plan-scroll"><table class="training-plan-table"><thead><tr><th>Día</th><th>Sesión</th><th>Ejercicios</th><th>Volumen/distancia</th><th>Tiempo</th><th>Intensidad</th></tr></thead><tbody>${plan.rows.map(r=>`<tr><td>${escape(r.day)}</td><td>${escape(r.session)}</td><td>${escape(r.exercises)}</td><td>${escape(r.volume)}${r.distance?` · ${escape(r.distance)}`:''}</td><td>${escape(r.minutes)} min</td><td>${escape(r.intensity)}</td></tr>`).join('')}</tbody></table></div><p><strong>Progresión:</strong> ${escape(plan.progression)}</p><p><strong>Recuperación:</strong> ${escape(plan.recovery)}</p>`;box.hidden=false;}
function onGenerateGoal(event){event.preventDefault();event.stopImmediatePropagation();pendingTrainingPlan=currentPlan();renderPlan(pendingTrainingPlan,'trainingPlanPreview');setText('goalRecommendation',pendingTrainingPlan.summary);}
async function onGoal(event){event.preventDefault();event.stopImmediatePropagation();try{pendingTrainingPlan=pendingTrainingPlan||currentPlan();const s=await getSupabase();await s.from('goals').update({status:'cancelled'}).eq('user_id',context.profile.id).eq('status','active');await saveGoal({sport:$('goalSport').value,goal_type:$('goalPurpose').value,target_value:Number($('goalMinutes').value),start_date:new Date().toISOString().slice(0,10),end_date:$('goalDeadline').value,status:'active',plan:pendingTrainingPlan});renderPlan(pendingTrainingPlan,'currentTrainingPlan');setText('currentGoalContent',`${pendingTrainingPlan.title} · ${$('goalMinutes').value} minutos semanales hasta ${$('goalDeadline').value}.`);await renderProgress();toast('✅ Objetivo y plan guardados','success');}catch(e){toast(`❌ ${e.message}`,'error');}}

function listCards(rows,empty,renderer){return rows?.length?rows.map(renderer).join(''):`<p>${empty}</p>`;}
async function renderProfile(){
  if(!context.session)return;const s=await getSupabase();const [d,posts,articles,videos,goal]=await Promise.all([progressSnapshot(),s.from('community_posts').select('id,description,sport,created_at').eq('user_id',context.profile.id).eq('visibility','private').order('created_at',{ascending:false}).limit(20),s.from('saved_articles').select('title,url,sport,source').eq('user_id',context.profile.id).order('created_at',{ascending:false}),s.from('saved_videos').select('video_id,created_at').eq('user_id',context.profile.id).order('created_at',{ascending:false}),s.from('goals').select('*').eq('user_id',context.profile.id).eq('status','active').order('created_at',{ascending:false}).limit(1).maybeSingle()]);
  setText('profileName',context.profile.full_name);setText('profileUser',context.profile.username);setText('profileSport',d.last_sport||context.profile.favorite_sport||'Sin registro');setText('profileMinutes',d.minutes_total||0);setText('profileActivities',d.workouts||0);setText('profileWeeklyMinutes',d.minutes_week||0);setText('profileStreak',`${d.streak||0} días`);setText('profileLastSport',d.last_sport||'Sin actividad');setText('educationCorrect',d.quiz_correct||0);setText('educationXp',`${d.quiz_xp||0} XP`);setText('educationSports',d.quiz_sports||0);setText('educationMedals',d.education_medals||0);
  if($('privatePosts'))$('privatePosts').innerHTML=listCards(posts.data,'No tienes publicaciones privadas.',p=>`<article class="profile-data-card"><strong>${escape(p.sport)}</strong><p>${escape(p.description)}</p></article>`);
  if($('savedReadings'))$('savedReadings').innerHTML=listCards(articles.data,'Todavía no has guardado lecturas.',a=>`<article class="profile-data-card"><a href="${escape(a.url)}" target="_blank" rel="noopener">${escape(a.title)}</a><small>${escape(a.sport||'')} · ${escape(a.source||'')}</small></article>`);
  if($('savedVideos'))$('savedVideos').innerHTML=listCards(videos.data,'Todavía no has guardado videos.',v=>`<article class="profile-data-card"><strong>Video guardado</strong><small>${escape(v.video_id)}</small></article>`);
  if(goal.data?.plan){renderPlan(goal.data.plan,'currentTrainingPlan');setText('currentGoalContent',`${goal.data.plan.title} · ${goal.data.target_value} minutos semanales hasta ${goal.data.end_date}.`);}
}

function avatarPublicUrl(path){const cfg=window.__SUMANDO_PUBLIC_CONFIG__;return path&&cfg?`${cfg.supabaseUrl}/storage/v1/object/public/avatars/${encodeURI(path)}`:'';}
function renderAvatar(){const img=$('profileAvatarImage');if(!img)return;const url=context.profile?.avatar_url;if(url){img.src=url.startsWith('http')?url:avatarPublicUrl(url);img.alt=`Foto de ${context.profile.full_name}`;}else{img.removeAttribute('src');img.alt='Sin foto de perfil';}}
async function onSaveAvatar(){const input=$('profileAvatarInput'),file=input?.files?.[0],button=$('saveProfileAvatarBtn');if(!file)return toast('Selecciona una imagen.','warning');busy(button,true,'Actualizando…');try{const s=await getSupabase(),old=context.profile.avatar_url,path=await uploadUserImage(s,'avatars',context.profile.id,file),url=avatarPublicUrl(path);const {error}=await s.from('profiles').update({avatar_url:url}).eq('id',context.profile.id);if(error){await s.storage.from('avatars').remove([path]);throw error;}if(old){const marker='/storage/v1/object/public/avatars/',oldPath=old.includes(marker)?decodeURIComponent(old.split(marker)[1]):old;if(oldPath&&oldPath!==path)await s.storage.from('avatars').remove([oldPath]);}await refreshContext();input.value='';toast('✅ Foto de perfil actualizada','success');}catch(e){toast(`❌ ${e.message}`,'error');}finally{busy(button,false);}}
async function searchStudents(query=''){if(context.profile?.role!=='teacher')return;try{const rows=await teacherStudents();const q=query.toLowerCase();const filtered=rows.filter(x=>!q||x.full_name.toLowerCase().includes(q));$('studentObservationResults').innerHTML=filtered.slice(0,12).map(x=>`<button type="button" class="student-search-result" data-cloud-student="${x.student_id}">${escape(x.full_name)} · ${x.minutes_week} min</button>`).join('');}catch(e){toast(`❌ ${e.message}`,'error');}}
async function selectStudent(id){const rows=await teacherStudents();selectedStudent=rows.find(x=>x.student_id===id);if(!selectedStudent)return;$('selectedObservationStudent').innerHTML=`<div><h3>${escape(selectedStudent.full_name)}</h3><p>${selectedStudent.age||'Edad sin registrar'} · ${selectedStudent.minutes_week} minutos esta semana</p></div>`;$('selectedObservationStudent').classList.add('visible');await renderConversation();}
async function renderConversation(){if(!context.profile)return;let teacherId,studentId;if(context.profile.role==='teacher'&&selectedStudent){teacherId=context.profile.id;studentId=selectedStudent.student_id;}else{const s=await getSupabase();const {data}=await s.from('teacher_students').select('teacher_id').eq('student_id',context.profile.id).limit(1).maybeSingle();if(!data)return;teacherId=data.teacher_id;studentId=context.profile.id;}const rows=await listConversation(teacherId,studentId);const target=context.profile.role==='teacher'?$('teacherSentObservations'):$('studentObservationsList');if(target)target.innerHTML=rows.length?rows.reverse().map(m=>`<article class="observation-card"><p>${escape(m.message)}</p><small>${new Date(m.created_at).toLocaleString('es-MX')}</small>${m.sender_id===context.profile.id?`<button type="button" data-cloud-edit-message="${m.id}">Editar</button>`:''}</article>`).join(''):'<p>Sin registro</p>';}
async function onSendObservation(e){e.preventDefault();e.stopImmediatePropagation();if(!selectedStudent)return toast('⚠️ Selecciona un estudiante','warning');const message=$('teacherObservationMessage').value.trim();if(!message)return;try{await sendMessage({teacher_id:context.profile.id,student_id:selectedStudent.student_id,message});$('teacherObservationMessage').value='';await renderConversation();toast('✅ Observación enviada','success');}catch(error){toast(`❌ ${error.message}`,'error');}}
async function boot(){
  try{
    const supabase=await getSupabase();
    supabase.auth.onAuthStateChange(async(event)=>{if(event==='PASSWORD_RECOVERY'){const password=prompt('Escribe tu nueva contraseña (mínimo 8 caracteres):');if(password?.length>=8){try{await updatePassword(password);toast('✅ Contraseña actualizada','success');}catch(e){toast(`❌ ${e.message}`,'error');}}}setTimeout(async()=>{await refreshContext();if(context.session){await Promise.all([renderHistory(),renderRankings(),renderSportCalories(),renderProgress(),renderProfile()]);}},0);});
    await refreshContext();
    if(context.session)await Promise.all([renderHistory(),renderRankings(),renderPosts(),renderSportCalories(),renderProgress(),renderProfile()]);
    if(context.session&&context.profile?.role==='student')await renderConversation().catch(()=>null);
  }catch(error){toast(`⚠️ ${error.message}`,'warning');}
}

$('loginForm')?.addEventListener('submit',onLogin,true);
$('registerForm')?.addEventListener('submit',onRegister,true);
$('startRecoveryBtn')?.addEventListener('click',onRecovery,true);
$('saveActivityBtn')?.addEventListener('click',onActivity,true);
$('postForm')?.addEventListener('submit',onPost,true);
$('saveGoalBtn')?.addEventListener('click',onGoal,true);
$('generateGoalBtn')?.addEventListener('click',onGenerateGoal,true);
$('chooseProfileAvatarBtn')?.addEventListener('click',()=>$('profileAvatarInput')?.click());
$('profileAvatarInput')?.addEventListener('change',e=>{const f=e.target.files[0];if(f)$('profileAvatarImage').src=URL.createObjectURL(f);});
$('saveProfileAvatarBtn')?.addEventListener('click',onSaveAvatar,true);
$('sendObservationBtn')?.addEventListener('click',onSendObservation,true);
$('logoutBtn')?.addEventListener('click',async e=>{e.preventDefault();e.stopImmediatePropagation();try{await signOut();sessionStorage.removeItem('sumandoMinutosUltimaSeccion');sessionStorage.removeItem('sumandoMinutosUltimoDeporte');context={session:null,profile:null};applyContext();toast('Sesión cerrada correctamente');}catch(error){toast(`❌ ${error.message}`,'error');}},true);
$('activityEvidence')?.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const preview=$('activityEvidencePreview');preview.src=URL.createObjectURL(f);preview.classList.add('visible');},true);
document.querySelectorAll('[data-sport]').forEach(b=>b.addEventListener('click',()=>{productionSport=b.dataset.sport;sessionStorage.setItem('sumandoMinutosUltimaSeccion','deportes');sessionStorage.setItem('sumandoMinutosUltimoDeporte',productionSport);setTimeout(()=>Promise.all([renderHistory(),renderSportCalories()]).catch(e=>toast(`❌ ${e.message}`,'error')),0);},true));
$('communityFeed')?.addEventListener('submit',async e=>{const id=e.target.dataset.cloudComment;if(!id)return;e.preventDefault();e.stopImmediatePropagation();try{await comment(id,e.target.elements.comment.value.trim());await renderPosts();toast('✅ Comentario publicado','success');}catch(error){toast(`❌ ${error.message}`,'error');}},true);
$('communityFeed')?.addEventListener('click',async e=>{const b=e.target.closest('[data-cloud-rate]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();try{const input=document.querySelector(`[data-cloud-rating="${b.dataset.cloudRate}"]`);await rate(b.dataset.cloudRate,Number(input.value));await renderPosts();toast('✅ Calificación guardada','success');}catch(error){toast(`❌ ${error.message}`,'error');}},true);
$('studentObservationSearch')?.addEventListener('input',e=>{e.stopImmediatePropagation();searchStudents(e.target.value);},true);
$('studentObservationResults')?.addEventListener('click',e=>{const b=e.target.closest('[data-cloud-student]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();selectStudent(b.dataset.cloudStudent).catch(error=>toast(`❌ ${error.message}`,'error'));},true);
[$('teacherSentObservations'),$('studentObservationsList')].filter(Boolean).forEach(box=>box.addEventListener('click',async e=>{const b=e.target.closest('[data-cloud-edit-message]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();const message=prompt('Editar mensaje:');if(!message?.trim())return;try{await editOwnMessage(b.dataset.cloudEditMessage,message.trim());await renderConversation();toast('✅ Mensaje editado','success');}catch(error){toast(`❌ ${error.message}`,'error');}},true));

// La base histórica queda disponible solo para preferencias visuales. Los flujos sensibles se interceptan arriba.
boot();
