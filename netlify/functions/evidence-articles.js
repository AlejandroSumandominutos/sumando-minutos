const queries={Gimnasio:'resistance training exercise',Calistenia:'calisthenics exercise',Running:'running training',Hiking:'hiking health',Tennis:'tennis training',Padel:'padel sport',Fútbol:'football training',Volleyball:'volleyball training',Natación:'swimming training'};
exports.handler=async event=>{
  const sport=event.queryStringParameters?.sport||'Running',query=queries[sport]||queries.Running,page=(Math.floor(Date.now()/3600000)%25)+1;
  const endpoint=`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(`${query} OPEN_ACCESS:Y`)}&format=json&pageSize=20&page=${page}`;
  const response=await fetch(endpoint,{headers:{accept:'application/json'}});if(!response.ok)return {statusCode:502,body:JSON.stringify({error:'No fue posible actualizar evidencias'})};
  const json=await response.json(),items=(json.resultList?.result||[]).map(x=>({id:x.pmid||x.pmcid||x.id,title:x.title,source:x.journalTitle||'Europe PMC',year:x.pubYear,url:`https://europepmc.org/article/${x.source||'MED'}/${x.pmid||x.pmcid||x.id}`}));
  return {statusCode:200,headers:{'content-type':'application/json','cache-control':'public,max-age=3600'},body:JSON.stringify({sport,items})};
};
