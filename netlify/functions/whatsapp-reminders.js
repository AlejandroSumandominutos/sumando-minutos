const headers=key=>({apikey:key,authorization:`Bearer ${key}`,'content-type':'application/json'});
exports.handler=async()=>{
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,sid=process.env.TWILIO_ACCOUNT_SID,token=process.env.TWILIO_AUTH_TOKEN,from=process.env.TWILIO_WHATSAPP_FROM,contentSid=process.env.TWILIO_CONTENT_SID;
  if(!url||!key||!sid||!token||!from||!contentSid)return {statusCode:503,body:'Configuración incompleta'};
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Mexico_City',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const prefs=await fetch(`${url}/rest/v1/whatsapp_preferences?enabled=eq.true&select=user_id,phone_e164,last_reminder_date`,{headers:headers(key)}).then(r=>r.json());
  const sent=[];
  for(const pref of prefs){
    if(pref.last_reminder_date===today)continue;
    const activities=await fetch(`${url}/rest/v1/activities?user_id=eq.${pref.user_id}&activity_date=eq.${today}&select=id&limit=1`,{headers:headers(key)}).then(r=>r.json());
    if(activities.length)continue;
    const body=new URLSearchParams({From:`whatsapp:${from}`,To:`whatsapp:${pref.phone_e164}`,ContentSid:contentSid,ContentVariables:JSON.stringify({1:'Recuerda que debes SUMAR MINUTOS hoy'})});
    const response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{method:'POST',headers:{authorization:`Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,'content-type':'application/x-www-form-urlencoded'},body});
    if(response.ok){sent.push(pref.user_id);await fetch(`${url}/rest/v1/whatsapp_preferences?user_id=eq.${pref.user_id}`,{method:'PATCH',headers:{...headers(key),Prefer:'return=minimal'},body:JSON.stringify({last_reminder_date:today})});}
  }
  return {statusCode:200,body:JSON.stringify({sent:sent.length})};
};
