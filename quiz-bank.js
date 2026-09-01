(function () {
  const facts = {
    "Gimnasio": [
      ["¿Qué debes dominar antes de aumentar la carga?","La técnica correcta",["La velocidad máxima","La comparación con otros","El entrenamiento con dolor"]],
      ["¿Qué prepara músculos y articulaciones para entrenar?","Un calentamiento progresivo",["Evitar todo movimiento previo","Comenzar con el peso máximo","Reducir la hidratación"]],
      ["¿Qué ayuda a recuperar el músculo después de una sesión?","Descanso y alimentación suficiente",["Entrenar el mismo músculo sin pausa","Dormir menos","Ignorar la fatiga"]],
      ["¿Cómo debe ser la respiración durante una repetición controlada?","Continua y coordinada",["Contenida durante toda la serie","Rápida y superficial siempre","Irregular intencionalmente"]],
      ["¿Qué indica dolor agudo durante un ejercicio?","Detenerse y evaluar la causa",["Añadir más peso","Acelerar las repeticiones","Continuar sin modificar nada"]],
      ["¿Para qué sirve ajustar una máquina antes de usarla?","Alinear el cuerpo y trabajar con seguridad",["Hacer ruido al entrenar","Eliminar el calentamiento","Evitar toda supervisión"]],
      ["¿Qué describe una repetición de calidad?","Recorrido controlado y postura estable",["Movimiento con impulso excesivo","Máxima velocidad sin control","Acortar siempre el recorrido"]],
      ["¿Qué principio favorece el progreso sostenido?","Aumentar gradualmente el estímulo",["Cambiar todo cada día","Entrenar siempre al fallo","Ignorar el registro de cargas"]],
      ["¿Qué conviene hacer entre series exigentes?","Descansar según el objetivo y recuperar la técnica",["Evitar respirar","Realizar la siguiente sin control","Abandonar la hidratación"]],
      ["¿Por qué se registran series, repeticiones y peso?","Para observar el progreso y ajustar la carga",["Para competir con desconocidos","Para sustituir la técnica","Para eliminar los días de descanso"]]
    ],
    "Calistenia": [
      ["¿Qué resistencia utiliza principalmente la calistenia?","El peso corporal",["Solo máquinas eléctricas","Únicamente barras olímpicas","Exclusivamente bicicletas"]],
      ["¿Cómo se aprende un movimiento avanzado con seguridad?","Mediante progresiones",["Saltando todas las etapas","Entrenando con dolor","Usando impulso sin control"]],
      ["¿Qué es esencial en una plancha?","Mantener el cuerpo alineado",["Hundir la zona lumbar","Contener siempre la respiración","Elevar solo un hombro"]],
      ["¿Qué ayuda a mejorar las dominadas?","Fortalecer tirón y practicar progresiones",["Evitar colgarse por completo","Mover las piernas sin control","Entrenar solo empuje"]],
      ["¿Qué debe hacerse si una variante pierde calidad técnica?","Usar una variante más sencilla",["Aumentar la velocidad","Ignorar la postura","Añadir repeticiones forzadas"]],
      ["¿Para qué sirve la movilidad de muñecas antes de apoyos?","Preparar las articulaciones",["Eliminar la necesidad de técnica","Evitar usar los hombros","Sustituir el calentamiento completo"]],
      ["¿Qué caracteriza una flexión bien ejecutada?","Tronco estable y movimiento controlado",["Cadera caída","Codos abiertos sin control","Recorrido hecho con rebotes"]],
      ["¿Cómo conviene aumentar el volumen semanal?","De forma gradual",["Duplicándolo cada día","Sin días de recuperación","Solo cuando existe dolor"]],
      ["¿Qué función cumple el abdomen en muchos ejercicios?","Estabilizar el tronco",["Mover únicamente los pies","Evitar que trabajen los hombros","Acelerar todas las repeticiones"]],
      ["¿Qué favorece el desarrollo equilibrado?","Combinar empuje, tirón, piernas y estabilidad",["Entrenar solo brazos","Evitar las piernas","Repetir un único ejercicio siempre"]]
    ],
    "Running": [
      ["¿Cuántos metros mide una vuelta por el carril interior de una pista estándar?","400 metros",["200 metros","300 metros","500 metros"]],
      ["¿Cómo debe aumentar su distancia una persona principiante?","Gradualmente",["Duplicándola cada día","Solo corriendo en subida","Sin incluir descansos"]],
      ["¿Qué intensidad permite conversar con frases durante un rodaje suave?","Una intensidad cómoda",["Un sprint máximo","Una intensidad con dolor","Un esfuerzo sin respiración controlada"]],
      ["¿Qué ayuda a reducir el riesgo de lesión por sobrecarga?","Alternar carga y recuperación",["Aumentar todo al mismo tiempo","Ignorar molestias persistentes","Correr siempre al máximo"]],
      ["¿Qué conviene hacer antes de una sesión rápida?","Calentamiento y activación progresiva",["Permanecer inmóvil y empezar al máximo","Evitar hidratarse","Usar calzado sin probar"]],
      ["¿Qué describe el ritmo de carrera?","El tiempo empleado por unidad de distancia",["Solo la frecuencia cardiaca","El peso del calzado","La altura del corredor"]],
      ["¿Cuál es una postura eficiente al correr?","Tronco estable y mirada al frente",["Hombros rígidos y elevados","Mirada constante a los pies","Brazos completamente inmóviles"]],
      ["¿Qué debe hacerse ante dolor que altera la zancada?","Detenerse y valorar la molestia",["Acelerar para terminar antes","Cambiar de calzado durante el sprint","Ignorarlo siempre"]],
      ["¿Para qué sirve un día de carrera suave?","Desarrollar base y facilitar recuperación",["Batir récord en cada sesión","Eliminar el descanso semanal","Evitar toda adaptación gradual"]],
      ["¿Qué factor debe considerarse al correr con calor?","Hidratación y reducción de intensidad",["Usar más ropa sin necesidad","Evitar cualquier líquido","Mantener el máximo esfuerzo"]]
    ],
    "Hiking": [
      ["¿Qué debes revisar antes de iniciar una ruta?","Clima, recorrido y dificultad",["Solo la música","Únicamente la hora de salida","El color de la mochila"]],
      ["¿Qué elemento es esencial en una caminata larga?","Agua suficiente",["Calzado nuevo sin probar","Ir sin avisar","Evitar todos los descansos"]],
      ["¿Por qué conviene informar a alguien sobre la ruta?","Para facilitar ayuda ante una emergencia",["Para caminar más rápido","Para evitar llevar mapa","Para sustituir la preparación"]],
      ["¿Qué calzado es más apropiado?","Uno probado y adecuado al terreno",["Uno nuevo estrenado ese día","Sandalias para cualquier ruta","El más pesado disponible"]],
      ["¿Qué hacer si cambia peligrosamente el clima?","Evaluar el regreso o buscar refugio seguro",["Continuar sin observar","Separarse del grupo","Subir a zonas expuestas"]],
      ["¿Qué significa respetar el principio de no dejar rastro?","Llevarse los residuos y cuidar el entorno",["Marcar árboles","Abandonar restos orgánicos","Salir siempre del sendero"]],
      ["¿Cómo se administra el esfuerzo en una subida larga?","Con un ritmo sostenible",["Comenzando al máximo","Evitando respirar profundo","Sin beber agua"]],
      ["¿Para qué sirve consultar el desnivel?","Para estimar la exigencia de la ruta",["Para conocer el color del suelo","Para evitar llevar comida","Para calcular la música necesaria"]],
      ["¿Qué conviene llevar aunque se use un teléfono?","Un medio alternativo de orientación",["Solo una cámara","Objetos innecesarios","Ninguna referencia de ruta"]],
      ["¿Qué hacer al encontrar fauna silvestre?","Mantener distancia y no alimentarla",["Perseguirla para fotografiarla","Ofrecerle comida","Bloquear su paso"]]
    ],
    "Tennis": [
      ["¿Con qué acción comienza normalmente un punto?","El saque",["La volea","El globo","El cambio de lado"]],
      ["¿Qué debes observar durante el contacto?","La pelota",["La grada","El marcador","Tu sombra"]],
      ["¿Cuántos puntos básicos se anuncian antes de ganar un juego sin ventaja?","15, 30 y 40",["10, 20 y 30","20, 40 y 60","1, 2 y 3"]],
      ["¿Qué es un revés?","Un golpe realizado por el lado opuesto a la derecha dominante",["Un tipo de saque bajo","Una pausa entre sets","Un golpe exclusivo de red"]],
      ["¿Para qué sirve la posición de espera?","Para reaccionar en distintas direcciones",["Para permanecer rígido","Para mirar al público","Para evitar mover los pies"]],
      ["¿Qué ocurre cuando el saque toca la red y entra correctamente?","Se repite como let",["Se pierde siempre el partido","Cuenta doble","El receptor cambia de raqueta"]],
      ["¿Qué ayuda a controlar un golpe?","Preparación temprana y equilibrio",["Cerrar los ojos","Golpear siempre con máxima fuerza","Detener los pies demasiado pronto"]],
      ["¿Cuándo se cambia de lado normalmente?","Después de juegos impares",["Después de cada punto","Solo al terminar el partido","Nunca"]],
      ["¿Qué es una volea?","Un golpe antes de que la pelota bote",["Un saque que bota dos veces","Un descanso","Un golpe fuera de la cancha"]],
      ["¿Qué reduce el riesgo al servir?","Calentar hombro y progresar la intensidad",["Empezar con máxima potencia","Ignorar dolor de hombro","Evitar mover las piernas"]]
    ],
    "Padel": [
      ["¿Cuántos jugadores participan normalmente en un partido?","Cuatro",["Dos","Tres","Seis"]],
      ["¿Qué habilidad es clave al jugar en pareja?","La comunicación",["Jugar siempre solo","No moverse","Golpear todo con máxima fuerza"]],
      ["¿Cómo se realiza reglamentariamente el saque?","Por debajo de la cintura tras un bote",["Por encima de la cabeza","Sin dejar botar","Desde cualquier lugar"]],
      ["¿Qué función pueden tener las paredes?","Mantener la pelota en juego después del bote",["Detener automáticamente el punto","Servir como red","Cambiar la puntuación"]],
      ["¿Qué posición facilita cubrir espacios con la pareja?","Moverse coordinadamente",["Permanecer ambos en una esquina","No hablar","Dar siempre la espalda a la red"]],
      ["¿Qué es una bandeja?","Un golpe de control por encima de la cabeza",["Un saque con el pie","Una pausa obligatoria","Un golpe después de dos botes"]],
      ["¿Qué conviene priorizar al comenzar?","Control y colocación",["Potencia máxima en cada bola","Golpear sin preparar","Evitar usar las paredes"]],
      ["¿Cuándo termina el punto por doble bote?","Cuando la pelota bota dos veces antes de devolverse",["Tras tocar una pared","Después de una volea","Al cambiar de lado"]],
      ["¿Qué ayuda a proteger el espacio central?","Acordar quién toma cada pelota",["Evitar comunicarse","Dejar ambas palas abajo","Correr en direcciones opuestas"]],
      ["¿Qué calentamiento es útil antes de jugar?","Movilidad y golpes progresivos",["Empezar con remates máximos","Evitar mover los hombros","Jugar con dolor"]]
    ],
    "Fútbol": [
      ["¿Cuántos jugadores tiene cada equipo en el campo al iniciar?","Once",["Nueve","Diez","Doce"]],
      ["¿Qué acción ayuda a conservar la posesión?","Un pase preciso",["Cerrar los ojos","No comunicarse","Salir del campo"]],
      ["¿Qué parte del pie ofrece una superficie amplia para pases cortos?","El interior",["El talón siempre","La punta exclusivamente","El tobillo"]],
      ["¿Qué sanciona normalmente una tarjeta roja?","La expulsión",["Un saque de banda","Un gol doble","Un descanso adicional"]],
      ["¿Qué ocurre cuando el balón cruza completamente la línea lateral?","Se concede saque de banda",["Se concede penal automáticamente","El partido termina","Cuenta como gol"]],
      ["¿Para qué sirve mirar antes de recibir?","Conocer espacios, compañeros y rivales",["Evitar controlar el balón","Reducir la comunicación","Permanecer inmóvil"]],
      ["¿Qué ayuda a prevenir lesiones frecuentes?","Calentamiento y carga progresiva",["Jugar con dolor","Evitar descansar","Entrar sin preparación"]],
      ["¿Qué jugador puede usar las manos dentro de su área?","El portero",["Cualquier defensa","El capitán","El delantero centro"]],
      ["¿Qué es el fuera de juego en términos generales?","Una posición adelantada sancionable al participar en la jugada",["Cualquier pase hacia atrás","Todo saque de esquina","Una falta del portero"]],
      ["¿Qué favorece una defensa organizada?","Comunicación y coberturas",["Perseguir todos el balón","No mantener posiciones","Evitar hablar"]]
    ],
    "Volleyball": [
      ["¿Cuántos jugadores hay por equipo en cancha?","Seis",["Cinco","Siete","Ocho"]],
      ["¿Qué técnica se usa frecuentemente para recibir el saque?","El golpe de antebrazos",["Un cabezazo","Una patada","El puño sin control"]],
      ["¿Cuántos contactos puede realizar normalmente un equipo antes de enviar el balón?","Tres",["Uno","Dos","Cinco"]],
      ["¿Qué jugador usa una camiseta diferente y se especializa en defensa?","El líbero",["El árbitro","El colocador siempre","El capitán obligatoriamente"]],
      ["¿Qué acción inicia cada punto?","El saque",["El bloqueo","La recepción","El cambio de cancha"]],
      ["¿Qué ayuda a realizar una colocación precisa?","Manos preparadas y contacto controlado",["Golpear con los pies","Cerrar los ojos","Usar máxima fuerza"]],
      ["¿Puede bloquearse directamente el saque rival?","No",["Sí, siempre","Solo con un pie","Solo fuera de la cancha"]],
      ["¿Qué conviene hacer antes de saltos repetidos?","Calentar y progresar la carga",["Empezar al máximo","Evitar mover tobillos","Ignorar dolor de rodilla"]],
      ["¿Qué permite la rotación?","Cambiar posiciones al recuperar el saque",["Añadir jugadores","Eliminar la red","Duplicar los puntos"]],
      ["¿Qué mejora la recepción colectiva?","Comunicación y responsabilidad de zonas",["Guardar silencio","Mirar al suelo","Juntarse todos en un punto"]]
    ],
    "Natación": [
      ["¿Cuántos carriles tiene una piscina olímpica moderna?","Diez",["Seis","Ocho","Doce"]],
      ["¿Qué debe coordinarse con las brazadas?","La respiración",["El calzado","La raqueta","El balón"]],
      ["¿Qué medida de seguridad es fundamental?","Nadar con supervisión y respetar las reglas",["Nadar solo en cualquier lugar","Correr alrededor de la piscina","Ignorar la profundidad"]],
      ["¿Qué estilo utiliza una patada simultánea similar a la de una rana?","Pecho",["Dorso","Libre","Mariposa"]],
      ["¿En qué estilo se nada mirando principalmente hacia arriba?","Dorso",["Pecho","Mariposa","Libre"]],
      ["¿Qué ayuda a deslizarse con menor resistencia?","Una posición corporal alineada",["Levantar demasiado la cabeza","Flexionar el tronco constantemente","Separar movimientos sin coordinación"]],
      ["¿Qué conviene hacer al sentir fatiga inusual en el agua?","Detenerse en un lugar seguro y avisar",["Alejarse más","Aguantar la respiración","Continuar sin comunicarlo"]],
      ["¿Por qué se exhala dentro del agua?","Para facilitar una inspiración rápida y controlada",["Para hundirse más","Para evitar mover los brazos","Para aumentar la resistencia"]],
      ["¿Qué longitud tiene una piscina olímpica?","50 metros",["20 metros","25 metros","100 metros"]],
      ["¿Qué prepara hombros y articulaciones antes de nadar?","Movilidad y calentamiento progresivo",["Entrar con máxima intensidad","Evitar mover los brazos","Contener la respiración"]]
    ]
  };

  const prefixes = ["Para comenzar:","Durante la práctica:","Reto de aprendizaje:","Con buena técnica:","Pensando en seguridad:","Para progresar:","En una sesión responsable:","Comprueba tus conocimientos:","Concepto deportivo:","Decisión inteligente:"];
  const suffixes = ["Elige la opción correcta.","¿Cuál respuesta es adecuada?","Selecciona la mejor respuesta.","Identifica la opción válida.","¿Qué alternativa corresponde?","Marca la respuesta correcta.","¿Cuál opción aplicarías?","Escoge la afirmación correcta.","¿Qué deberías recordar?","Selecciona la respuesta más precisa."];

  function rotateOptions(correct, distractors, seed) {
    const options = [correct, ...distractors];
    const offset = seed % options.length;
    const rotated = options.slice(offset).concat(options.slice(0, offset));
    return { options: rotated, correct: rotated.indexOf(correct) };
  }

  window.expandQuizLibrary = function expandQuizLibrary(library) {
    Object.entries(facts).forEach(([sport, sportFacts]) => {
      const questions = [];
      sportFacts.forEach((fact, factIndex) => {
        for (let variant = 0; variant < 100; variant += 1) {
          const answers = rotateOptions(fact[1], fact[2], factIndex * 101 + variant);
          questions.push({
            id: `quiz-${sport.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")}-${factIndex + 1}-${variant + 1}`,
            question: `${prefixes[variant % prefixes.length]} ${fact[0]} ${suffixes[Math.floor(variant / 10)]}`,
            options: answers.options,
            correct: answers.correct
          });
        }
      });
      library[sport] = questions;
    });
    return library;
  };
})();
