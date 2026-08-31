# Sumando Minutos — Netlify + Supabase

Versión de producción que conserva la SPA visual original y sustituye la persistencia sensible por Supabase Auth, PostgreSQL, Storage y RLS.

## Configurar Supabase

1. Cree un proyecto y guarde `Project URL` y la clave pública `anon`.
2. En **Authentication → URL Configuration**, configure la URL de Netlify como `Site URL` y agregue `https://SU-SITIO.netlify.app/**` a Redirect URLs.
3. Active correo/contraseña y confirmación de correo.
4. Ejecute, en orden: `supabase/schema.sql`, `indexes.sql`, `policies.sql` y `medals.sql`.
5. Las políticas crean `avatars` y `community` públicos, y `evidence` privado, todos con límite de 1 MB. El navegador comprime normalmente a 200–500 KB.
6. No ejecute `seed.sql` en producción; no contiene usuarios ficticios.

## Variables de Netlify

Agregue `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY` y opcionalmente `OPENAI_MODEL`. `SUPABASE_SERVICE_ROLE_KEY` queda reservada para futuras funciones administrativas y nunca debe aparecer en HTML o `/js`. `.env.example` no contiene secretos.

## Publicar

1. Suba esta carpeta a GitHub.
2. En Netlify seleccione **Add new site → Import an existing project → GitHub**.
3. No requiere comando de build: `netlify.toml` publica `.` y carga `netlify/functions`.
4. Agregue las variables y publique.
5. `/.netlify/functions/public-config` debe devolver solo URL y clave pública, nunca service role.

## Crear el primer docente

El registro público siempre crea estudiantes. Registre y confirme una cuenta, y promuévala desde SQL:

```sql
update public.profiles set role='teacher' where email='docente@escuela.edu';
```

Asocie alumnos con UUID reales:

```sql
insert into public.teacher_students(teacher_id,student_id)
values ('UUID_DOCENTE','UUID_ESTUDIANTE') on conflict do nothing;
```

RLS limita al docente a esos alumnos. Sus herramientas continúan distribuidas en la navegación; no se crea una pestaña “Panel Docente”.

## Prueba de estudiante

Registre y confirme una cuenta; inicie con correo; pruebe los nueve formularios; registre actividad y evidencia; confirme historial, calorías aproximadas y ranking; cree objetivo y publicación; comente y vote; complete quiz; guarde artículo; cierre sesión y pruebe el enlace real de recuperación.

## Prueba de docente

Inicie con un perfil promovido; confirme que solo lista alumnos asociados; filtre por deporte y ordene minutos; consulte una evidencia privada autorizada; envíe una observación y edite únicamente su propio mensaje.

## Verificar RLS

Con estudiantes A/B y docente D, autentíquese como A e intente leer o cambiar una actividad/mensaje/evidencia de B, insertar con `user_id` de B y actualizar `profiles.role`: debe obtener cero filas o error. D solo debe acceder a A después de `teacher_students(D,A)`. Verifique que `evidence` siga privado.

## Rankings, medallas y rendimiento

`weekly_rankings(sport)` calcula `SUM(minutes)` en PostgreSQL y muestra “Sin registro” sin filas. `award_weekly_medals()` usa restricciones únicas para Oro/Plata/Cobre y Constancia 420; prográmela con Supabase Cron según el cierre semanal. Historial pagina de 25, comunidad de 12, estadísticas usan RPC e índices compuestos. Esto es adecuado para el arranque previsto de ~100 estudiantes activos por semana.

Consulte `MIGRATION.md` para claves heredadas y `TESTING.md` para la matriz completa.
