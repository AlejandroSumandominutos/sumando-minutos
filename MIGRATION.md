# Diagnóstico y migración

La versión recibida era una SPA monolítica de ~250 KB: HTML, CSS y JavaScript embebidos, tres PNG de Rubén Coach, Lucide/Google Fonts/Unsplash/YouTube remotos y ningún backend real.

Se conservaron navegación, identidad azul/blanco/dorado, nueve deportes, formularios dinámicos, historial, Comunidad, Rankings, Medallas, Objetivos, Perfil, observaciones, evidencias, artículos, Mini Quiz, frase diaria y Rubén Coach.

| Clave heredada | Destino de producción |
|---|---|
| `sumandoMinutosUsuarios` | Supabase Auth + `profiles` |
| `sumandoMinutosSesion` | sesión Supabase Auth |
| `sumandoMinutosActividades` | `activities` + bucket privado `evidence` |
| `sumandoMinutosPublicaciones` | posts, comentarios, ratings + `community` |
| `sumandoMinutosLecturas` | `saved_articles` |
| `sumandoMinutosQuiz` | `quiz_results` |
| `sumandoMinutosAsistente` | solo estado temporal no sensible |
| `sumandoMinutosVideosGuardados` | `saved_videos` |
| `sumandoMinutosConfiguracion` | `app_settings` |
| `sumandoMinutosObjetivos` | `goals` |
| `sumandoMinutosObservaciones` | `private_messages` |
| celebraciones en `sessionStorage` | permitido como estado efímero |

El código visual heredado permanece en `index.html`; `js/production.js` intercepta flujos sensibles. No se importan automáticamente datos históricos porque contienen contraseñas y fotos base64 sin identidad verificable. Si fueran reales, haga una migración administrativa auditada y fuerce restablecimiento de contraseña.

Problemas corregidos: contraseñas en claro, roles/recuperación simulados, evidencias sin ACL, rankings calculados descargando datos, falta de paginación/índices/RLS y secretos sin separación.
