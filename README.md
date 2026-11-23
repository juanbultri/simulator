# Rugby IQ — Reglamentación para equipos de rugby

Quiz interactivo (92 situaciones, 3 niveles), con entrenamiento libre, dibujos de cancha y liga semanal.

Este repositorio `juanbultri/simulator` fue reutilizado para Rugby IQ, sustituyendo al antiguo simulador MIR.
La aplicación utiliza **GitHub Pages** en `https://juanbultri.github.io/simulator/` y **Supabase Free** para cuentas y clasificaciones.

## Incluye
- Entrenamiento libre con corrección inmediata, explicación y ley aplicable.
- Liga semanal, diez preguntas por nivel con corrección al finalizar.
- Progreso local y resultados sincronizados para miembros del club.
- Diseño móvil apto para Safari de iPhone/iPad.

## Antes de invitar a jugadores
1. Comprobar que GitHub Pages usa la rama `master` y directorio `/`.
2. En Supabase, configurar el correo electrónico con códigos OTP (plantilla `{{ .Token }}`) y probar el acceso con dos usuarios reales.
3. Completar el contacto del responsable, privacidad y el período de conservación de los datos.
4. Entregar el código de invitación del club **de forma privada**; no subirlo a GitHub.

`config.js` solo contiene una clave **publicable** (no privilegiada) de Supabase. No publicar `service_role`, secretos ni códigos de invitación.

## Publicación

Para reciclar el repositorio original de MIR en vez de crear otro, ejecutá `Reemplazar_MIR_con_RugbyIQ.ps1` desde PowerShell en Windows (requiere Git y GitHub CLI). Conserva el historial de commits. No hace un push forzado.

## Fuente de reglas
Preguntas originales basadas en las Leyes de World Rugby; considerar las variantes de cada unión/competición y revisión arbitral antes de usar en una liga competitiva.
