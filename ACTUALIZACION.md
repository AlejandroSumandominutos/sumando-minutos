# Actualización consolidada — 31 de agosto de 2026

## Orden obligatorio

1. Abre Supabase y entra al proyecto de Sumando Minutos.
2. Ve a **SQL Editor** y crea una consulta nueva.
3. Copia completo el archivo `supabase/update_20260831.sql`, pégalo y pulsa **Run** una sola vez.
4. En GitHub, abre `AlejandroSumandominutos/sumando-minutos` y sustituye los archivos del repositorio con esta versión. No subas el archivo ZIP dentro del repositorio.
5. Confirma el cambio con el mensaje `Actualización completa de progreso y perfil`.
6. Netlify publicará automáticamente desde la rama `main`. Espera a que el nuevo deploy aparezca como **Published**.
7. Abre la página en una ventana privada o presiona `Ctrl + F5` para evitar archivos antiguos en caché.

## Comprobación rápida

- Registra una actividad y confirma que el formulario queda vacío.
- Confirma que las calorías de hoy y de la semana aumentan en el deporte elegido.
- Abre Inicio y Mi Perfil: minutos, calorías, XP y racha deben reflejar el registro.
- Genera un objetivo y confirma que aparezca la tabla semanal.
- Cambia la foto en Mi Perfil y confirma que la anterior deja de mostrarse.
- Abre un quiz y confirma que no repita inmediatamente la misma pregunta.

No agregues `SUPABASE_SECRET_KEY` ni `service_role` al navegador o a GitHub. La aplicación solamente utiliza la clave pública configurada en Netlify.
