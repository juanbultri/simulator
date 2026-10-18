# Simulador MIR v1.5 — aplicación sin contenido

Este repositorio contiene **solo el motor** del simulador. No contiene preguntas, imágenes, respuestas ni comentarios de terceros.

## Publicación en GitHub Pages

1. Creá un repositorio nuevo para este código.
2. Subí únicamente `index.html`, `manifest.webmanifest`, `sw.js` y este README.
3. En Settings → Pages, elegí Deploy from a branch, `main` y `/ (root)`.
4. Abrí la URL de GitHub Pages desde Safari en el iPad.
5. Importá un archivo JSON local desde Archivos. Usá solo materiales que tengas derecho a utilizar.
6. En Safari, Compartir → Añadir a pantalla de inicio para instalar el acceso directo.

No subas `Banco_MIR_PRIVADO_v1.5.json`, PDFs originales ni HTML de versiones anteriores: contienen material de terceros. El banco se almacena en IndexedDB del navegador y no se envía al servidor. Safari puede eliminar datos de sitios por políticas de almacenamiento; guardá una copia del JSON fuera del navegador.

## Modos

- Práctica con corrección inmediata.
- Simulacro configurable (cantidad/año/especialidad) con corrección al final.
- Simulacro completo: 200+10 reservas, 4h30, +3/−1/0.

## Estructura esperada del JSON

Objeto `{"format":"mir-bank-v1","questions":[...]}`. Cada pregunta contiene `question` (texto), `options` (4 textos), `answer` (1–4), `explanation` (texto), `year` (número) y `subject` (texto). Opcional: `id`, `number`, `topic`, `page`, `figures`.

El cronómetro empieza al iniciar cada simulacro. La nota presentada es orientativa, no una baremación MIR oficial.
