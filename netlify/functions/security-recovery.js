const crypto=require('crypto');
const json=(statusCode,body)=>({statusCode,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)});
const apiHeaders=key=>({apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json'});
const normalize=value=>String(value||'').trim().toLowerCase();
const sign=value=>crypto.createHmac('sha256',process.env.SECURITY_RECOVERY_SECRET||process.env.SUPABASE_SERVICE_ROLE_KEY).update(value).digest('base64url');
const tokenFor=(id,expires)=>`${Buffer.from(JSON.stringify({id,expires})).toString('base64url')}.${sign(`${id}.${expires}`)}`;
const readToken=token=>{try{const [raw,signature]=String(token||'').split('.'),data=JSON.parse(Buffer.from(raw,'base64url').toString());if(signature!==sign(`${data.id}.${data.expires}`)||Date.now()>data.expires)return null;return data;}catch{return null;}};
exports.handler=async event=>{
  if(event.httpMethod!=='POST')return json(405,{error:'Método no permitido'});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)return json(503,{error:'Recuperación no configurada'});
  try{
    const body=JSON.parse(event.body||'{}');
    if(body.action==='reset'){
      const claim=readToken(body.token),password=String(body.password||'');if(!claim)return json(401,{error:'La verificación expiró. Inicia nuevamente.'});if(password.length<8||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password))return json(400,{error:'La contraseña no cumple los requisitos.'});
      const changed=await fetch(`${url}/auth/v1/admin/users/${claim.id}`,{method:'PUT',headers:apiHeaders(key),body:JSON.stringify({password})});if(!changed.ok)throw new Error(await changed.text());return json(200,{ok:true});
    }
    const identifier=normalize(body.identifier);if(!identifier)return json(400,{error:'Escribe tu usuario o correo.'});
    const filter=identifier.includes('@')?`email=eq.${encodeURIComponent(identifier)}`:`username=ilike.${encodeURIComponent(identifier)}`;
    const profileResponse=await fetch(`${url}/rest/v1/profiles?${filter}&select=id,security_question&limit=1`,{headers:apiHeaders(key)}),profiles=await profileResponse.json(),profile=profiles[0];
    if(!profile?.security_question)return json(404,{error:'La cuenta no tiene una pregunta de seguridad configurada.'});
    if(body.action==='question')return json(200,{question:profile.security_question});
    if(body.action==='verify'){
      const verify=await fetch(`${url}/rest/v1/rpc/verify_security_answer`,{method:'POST',headers:apiHeaders(key),body:JSON.stringify({p_user_id:profile.id,p_answer:String(body.answer||'')})}),valid=await verify.json();
      if(!verify.ok)throw new Error(JSON.stringify(valid));if(!valid)return json(401,{error:'La respuesta de seguridad no es correcta.'});return json(200,{token:tokenFor(profile.id,Date.now()+10*60*1000)});
    }
    return json(400,{error:'Acción no válida'});
  }catch(error){console.error('security-recovery',error);return json(500,{error:'No fue posible completar la recuperación.'});}
};
