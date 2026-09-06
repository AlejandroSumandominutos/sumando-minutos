const json=(statusCode,body)=>({statusCode,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify(body)});
exports.handler=async event=>{
  if(event.httpMethod!=='POST')return json(405,{error:'Método no permitido'});
  const url=process.env.SUPABASE_URL,anon=process.env.SUPABASE_ANON_KEY,service=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!service)return json(503,{error:'El inicio de sesión no está configurado.'});
  try{
    const body=JSON.parse(event.body||'{}'),identifier=String(body.identifier||'').trim().toLowerCase(),password=String(body.password||'');
    if(!identifier||!password)return json(400,{error:'Escribe tu usuario y contraseña.'});
    let email=identifier;
    if(!identifier.includes('@')){const response=await fetch(`${url}/rest/v1/profiles?username=ilike.${encodeURIComponent(identifier)}&select=email&limit=1`,{headers:{apikey:service,authorization:`Bearer ${service}`}}),rows=await response.json();email=rows[0]?.email||'';}
    if(!email)return json(400,{error:'Usuario o contraseña incorrectos.'});
    const response=await fetch(`${url}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:anon,'content-type':'application/json'},body:JSON.stringify({email,password})}),data=await response.json();
    if(!response.ok)return json(400,{error:'Usuario o contraseña incorrectos.'});
    return json(200,{access_token:data.access_token,refresh_token:data.refresh_token});
  }catch(error){console.error('username-login',error);return json(500,{error:'No fue posible iniciar sesión.'});}
};
