# Actualización consolidada 2

## 1. Actualizar Supabase

En **Supabase → SQL Editor → New query**, copia y ejecuta completo:

`supabase/update_20260831_b.sql`

Debe aparecer `Success. No rows returned`.

## 2. Actualizar GitHub

Sube a la raíz del repositorio todos los archivos y carpetas de esta versión, reemplazando los existentes. No subas el ZIP. Confirma con el mensaje:

`Actualización de rankings, comunidad, PDF y recordatorios`

Netlify publicará automáticamente la rama `main`.

## 3. Activar WhatsApp (requiere cuenta de Twilio)

La interfaz y la tarea automática ya están incluidas, pero WhatsApp no puede enviar mensajes sin un remitente empresarial y una plantilla aprobada.

En Twilio crea una plantilla cuyo texto sea:

`{{1}}`

Después configura en **Netlify → Project configuration → Environment variables**:

- `SUPABASE_SERVICE_ROLE_KEY`: clave `service_role` de Supabase. Solo se usa en funciones del servidor; nunca debe ponerse en el navegador ni en GitHub.
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`: número remitente en formato internacional, sin el prefijo `whatsapp:`.
- `TWILIO_CONTENT_SID`: identificador de la plantilla aprobada.

La tarea se ejecuta todos los días a las 5:00 p. m. de Ciudad de México. Solo envía a usuarios que activaron la opción y no registraron actividad ese día. El mensaje enviado es: “Recuerda que debes SUMAR MINUTOS hoy”.

## 4. Medallas semanales

El cierre automático ocurre cada viernes a la 1:00 p. m. de Ciudad de México. Suma todos los deportes, guarda oro, plata y bronce y comienza el periodo siguiente. En empates se usa nombre y después identificador de usuario para mantener posiciones estables.

## 5. Prueba final

1. Espera a que Netlify indique **Published**.
2. Abre el sitio y presiona `Ctrl + F5`.
3. Registra una actividad y revisa Inicio, rankings, medallas y Top 3 por deporte.
4. Genera un plan y pulsa **Imprimir / Guardar PDF**.
5. Guarda una evidencia y comprueba que aparezca en **Mi Perfil → Evidencias guardadas**.
6. Publica una foto pública y comprueba que otra cuenta pueda verla. Una publicación privada solo debe aparecer en Mi Perfil.
7. Cambia de sección y comprueba que la fotografía de identificación permanezca visible.

Nota: “Guardar como PDF” aparece como destino dentro del cuadro de impresión del navegador.
