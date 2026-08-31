# Matriz de aceptación

## Estudiante

- [ ] Registro crea Auth + `profiles.role=student`; correo y sesión funcionan.
- [ ] Los nueve formularios muestran campos pertinentes.
- [ ] Evidencia obligatoria bloquea sin foto; archivo queda comprimido y privado.
- [ ] Actividad actualiza historial, estadísticas y ranking.
- [ ] Objetivo, post, comentario, voto, quiz y artículo persisten tras recargar.

## Docente y privacidad

- [ ] Solo ve estudiantes asociados y filtra/ordena datos agregados.
- [ ] Lee evidencia autorizada, envía observación y edita su mensaje.
- [ ] Cambiar `role` en DevTools no concede acceso.
- [ ] A no lee/edita actividad, mensaje o evidencia de B.
- [ ] Estudiante no modifica `profiles.role`; claves privadas no aparecen en Network.

## Rankings y medallas

- [ ] Orden semanal y top por deporte son correctos; vacío muestra “Sin registro”.
- [ ] Oro/Plata/Cobre y Constancia 420 no se duplican.

## UX y dispositivos

- [ ] Errores/carga se muestran sin depender de `alert()`.
- [ ] Recuperación acepta contraseña nueva.
- [ ] 360/768/1440 px no desbordan menús, tablas, comunidad o coach.
- [ ] Teclado, foco, etiquetas, texto alternativo y Lighthouse sin errores críticos.
