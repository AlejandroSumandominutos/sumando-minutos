exports.handler=async()=>{
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return {statusCode:503,body:'Configuración incompleta'};
  const response=await fetch(`${url}/rest/v1/rpc/finalize_weekly_awards`,{method:'POST',headers:{apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json'},body:'{}'});
  return {statusCode:response.status,body:await response.text()};
};
