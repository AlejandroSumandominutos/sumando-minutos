const crypto=require('crypto');
const json=(statusCode,body)=>({statusCode,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)});
const serviceHeaders=key=>({apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json'});
exports.handler=async event=>{
  if(event.httpMethod!=='POST')return json(405,{error:'Método no permitido'});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return json(503,{error:'El servicio de recuperación no está configurado.'});
  try{
    const accessToken=String(event.headers.authorization||'').replace(/^Bearer\s+/i,'');
    if(!accessToken)return json(401,{error:'Inicia sesión nuevamente.'});
    const authResponse=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,authorization:`Bearer ${accessToken}`}}),teacher=await authResponse.json();
    if(!authResponse.ok||!teacher.id)return json(401,{error:'La sesión no es válida.'});
    const teacherProfiles=await fetch(`${url}/rest/v1/profiles?id=eq.${teacher.id}&role=eq.teacher&select=id`,{headers:serviceHeaders(key)}).then(r=>r.json());
    if(!teacherProfiles.length)return json(403,{error:'Solo una cuenta docente puede restablecer contraseñas.'});
    const {studentId}=JSON.parse(event.body||'{}');
    const students=await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(studentId||'')}&role=eq.student&select=id,username,full_name`,{headers:serviceHeaders(key)}).then(r=>r.json()),student=students[0];
    if(!student)return json(404,{error:'No se encontró al alumno seleccionado.'});
    const password=`Sm!${crypto.randomBytes(6).toString('base64url')}7a`;
    const update=await fetch(`${url}/auth/v1/admin/users/${student.id}`,{method:'PUT',headers:serviceHeaders(key),body:JSON.stringify({password})});
    if(!update.ok){const detail=await update.json().catch(()=>({}));throw new Error(detail.msg||detail.message||'Supabase rechazó el cambio');}
    await fetch(`${url}/rest/v1/teacher_password_reset_audit`,{method:'POST',headers:{...serviceHeaders(key),Prefer:'return=minimal'},body:JSON.stringify({teacher_id:teacher.id,student_id:student.id})});
    return json(200,{password,username:student.username,studentName:student.full_name});
  }catch(error){console.error('teacher-reset-password',error);return json(500,{error:'No fue posible generar la contraseña nueva.'});}
};
