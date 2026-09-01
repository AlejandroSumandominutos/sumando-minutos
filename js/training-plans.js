const templates={
  'Gimnasio':[
    ['Fuerza de tren inferior','Sentadilla, bisagra de cadera, desplantes y pantorrilla','3–4 series de 8–12 repeticiones','—'],
    ['Fuerza de tren superior','Press, remo, empuje vertical y jalón','3–4 series de 8–12 repeticiones','—'],
    ['Cuerpo completo','Sentadilla, press, remo, peso muerto técnico y core','2–4 series de 8–15 repeticiones','—'],
    ['Recuperación activa','Movilidad de cadera, hombros y caminata suave','2 series controladas','—']
  ],
  'Calistenia':[
    ['Empuje y core','Flexiones progresivas, fondos asistidos, plancha','3–4 series de 6–15 repeticiones','—'],
    ['Tirón y postura','Remo invertido, dominada asistida, retracciones escapulares','3–4 series de 5–12 repeticiones','—'],
    ['Piernas y estabilidad','Sentadilla, zancada, puente de glúteo, plancha lateral','3 series de 10–20 repeticiones','—'],
    ['Técnica y movilidad','Progresiones suaves, muñecas, hombros y cadera','2–3 rondas','—']
  ],
  'Running':[
    ['Rodaje suave','Carrera conversacional y técnica relajada','Ritmo cómodo','3–8 km'],
    ['Intervalos','Calentamiento + repeticiones rápidas con recuperación','6–10 repeticiones','3–7 km'],
    ['Tempo controlado','Calentamiento + bloque sostenido + vuelta a la calma','Ritmo moderado','4–10 km'],
    ['Recuperación','Trote muy suave, movilidad y técnica','Ritmo fácil','2–5 km']
  ],
  'Hiking':[
    ['Ruta base','Terreno sencillo, ritmo sostenible e hidratación','Desnivel bajo','4–8 km'],
    ['Trabajo de desnivel','Subidas controladas y descenso técnico','Desnivel medio','5–10 km'],
    ['Ruta larga','Ritmo constante, pausas programadas y nutrición','Desnivel progresivo','8–18 km'],
    ['Recuperación','Caminata plana y movilidad de tobillo/cadera','Desnivel mínimo','3–6 km']
  ],
  'Tennis':[
    ['Técnica de fondo','Derecha, revés, control y dirección','4 bloques de ejercicios','—'],
    ['Saque y devolución','Lanzamiento, primer saque y devolución controlada','40–80 servicios','—'],
    ['Desplazamientos','Split step, laterales, recuperación al centro','6–10 bloques','—'],
    ['Juego aplicado','Puntos condicionados y set de práctica','1–2 sets','—']
  ],
  'Padel':[
    ['Control de fondo','Salida de pared, globo y dirección','4 bloques de ejercicios','—'],
    ['Red y bandeja','Volea, bandeja y transición hacia la red','5–8 bloques','—'],
    ['Pareja y posición','Comunicación, coberturas y desplazamiento coordinado','Situaciones guiadas','—'],
    ['Juego aplicado','Puntos condicionados y set de práctica','1–2 sets','—']
  ],
  'Fútbol':[
    ['Técnica individual','Conducción, control orientado y pase','4–6 circuitos','2–4 km'],
    ['Velocidad y agilidad','Aceleraciones, cambios de dirección y recuperación','6–10 repeticiones','2–5 km'],
    ['Resistencia específica','Juegos reducidos e intervalos con balón','4–8 bloques','3–7 km'],
    ['Táctica y recuperación','Posicionamiento, movilidad y trabajo suave','Carga baja','1–3 km']
  ],
  'Volleyball':[
    ['Recepción y colocación','Plataforma de antebrazos, orientación y colocación','5–8 bloques','—'],
    ['Saque y control','Saque dirigido, zonas y consistencia','30–60 saques','—'],
    ['Ataque y bloqueo','Pasos de remate, salto técnico y manos de bloqueo','4–6 bloques','—'],
    ['Juego aplicado','Rotaciones, comunicación y sets condicionados','2–4 sets','—']
  ],
  'Natación':[
    ['Técnica','Posición, respiración y brazada eficiente','Series técnicas','800–1600 m'],
    ['Resistencia','Bloques continuos a ritmo cómodo','Series medias/largas','1200–3000 m'],
    ['Velocidad','Repeticiones cortas con recuperación completa','8–16 repeticiones','800–1800 m'],
    ['Recuperación','Nado suave, patada y movilidad','Técnica relajada','600–1200 m']
  ]
};
const days=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
export function buildTrainingPlan({sport,level,purpose,weeklyMinutes}){
  const source=templates[sport]||templates.Running;
  const sessions=level==='Principiante'?3:level==='Intermedio'?4:5;
  const minutes=Math.max(30,Number(weeklyMinutes)||150);
  const perSession=Math.max(20,Math.round(minutes/sessions/5)*5);
  const spacing=sessions===3?[0,2,5]:sessions===4?[0,2,4,6]:[0,1,3,4,6];
  const rows=spacing.map((dayIndex,index)=>{const item=source[index%source.length];return {day:days[dayIndex],session:item[0],exercises:item[1],volume:item[2],distance:item[3],minutes:perSession,intensity:index===sessions-1?'Baja':index%3===1?'Alta':'Moderada'};});
  const title=`Plan semanal de ${sport} · ${level}`;
  const summary=`${sessions} sesiones y ${minutes} minutos por semana, orientados a ${String(purpose).toLowerCase()}. La carga se distribuye para alternar trabajo, técnica y recuperación.`;
  const progression=level==='Principiante'?'Mantén la primera semana estable y aumenta como máximo 5–10 % cuando termines sin dolor ni fatiga excesiva.':level==='Intermedio'?'Aumenta 5–10 % cada dos semanas y realiza una semana más ligera cada cuatro semanas.':'Alterna semanas de carga y descarga; aumenta solo una variable a la vez: volumen, distancia o intensidad.';
  const recovery='Deja al menos un día ligero entre sesiones exigentes, hidrátate, duerme bien y detente ante dolor, mareo o dificultad inusual.';
  return {title,summary,sport,level,purpose,weeklyMinutes:minutes,sessions,disclaimer:'Plan orientativo. Ajusta la carga a tu condición y detente ante dolor.',progression,recovery,rows};
}
