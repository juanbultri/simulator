# Rugby IQ v3.2 — Liga por apodos, sin correo

Aplicación offline-first con 92 situaciones y competición semanal. Reutiliza `juanbultri/simulator` (GitHub Pages) y el proyecto Supabase `jxqqiwjjwkmuyjefcwpz`.

## Lo que cambia
- No se solicitan correos, contraseñas ni códigos del club.
- Cada jugador usa un apodo. La aplicación crea automáticamente una sesión anónima de Supabase cuando participa por primera vez.
- Se mantienen las reglas de puntuación verificadas por la base de datos, el historial y las rondas semanales.
- Cada cuenta anónima se conserva en el navegador. Borrar datos del sitio o cambiar de dispositivo puede impedir recuperar la cuenta.

## ÚNICO ajuste manual requerido en Supabase

Entrar a [Supabase Authentication → Providers](https://supabase.com/dashboard/project/jxqqiwjjwkmuyjefcwpz/auth/providers) y activar **Allow anonymous sign-ins** (Anonymous Sign-Ins). No habilita correos y no requiere SMTP. Si ya está activo, no hace falta cambiar nada.

La migración `join_club_nickname` ya está aplicada al proyecto Supabase. El anterior RPC `join_club` con código de invitación se revocó para usuarios autenticados.

## Para publicar en el repo actual

Ejecutar desde PowerShell `Actualizar_RugbyIQ_sin_correo.ps1` con Git y GitHub CLI. El script verifica que el repositorio siga siendo Rugby IQ, actualiza solo archivos de aplicación, conserva el historial y usa un push normal sin forzar.

## Privacidad y seguridad

No hay identidad real verificada: una persona puede crear un nuevo jugador desde otro navegador. El ranking sirve para competir entre amigos, no para premios sujetos a controles estrictos. No publicar códigos secretos ni `service_role`. La clave `sb_publishable_*` de `config.js` es pública por diseño.

Antes de invitar a todo el club: revisar política de privacidad y probar dos usuarios en navegadores distintos.
