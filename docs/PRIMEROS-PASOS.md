# Revolteira: primera versión

La portada y el catálogo están preparados para probarse en local. Se mantiene el gallego de la plantilla. El catálogo de demostración contiene seis publicaciones completamente ficticias; ni sus autores ni la disponibilidad representan fondos reales.

## Arranque

Requiere Node.js compatible con Vite 7 (en esta instalación se ha utilizado Node 24) y pnpm 10.4.1. Si no tienes pnpm, los comandos siguientes lo ejecutan mediante npx:

```sh
npx --yes pnpm@10.4.1 install --frozen-lockfile
# Solo si todavía no existe .env:
cp .env.example .env
npx --yes pnpm@10.4.1 dev
```

Abre la dirección que imprime Vite, normalmente http://localhost:5173. En `.env`, `VITE_CATALOG_MODE=demo` activa los ejemplos. Reinicia Vite tras cambiar variables. El fichero `.env` está excluido del repositorio.

Puedes buscar «Lúa», combinar filtros, consultar fichas, comprobar ejemplares sin disponibilidad y probar búsquedas sin resultados. El modo demo funciona también en la compilación estática si se compila con esta variable. No hace búsqueda semántica ni guarda préstamos. El explorador espacial requiere subir y configurar el mobiliario propio; inicialmente está vacío.

```sh
npx --yes pnpm@10.4.1 check
npx --yes pnpm@10.4.1 check:worker
npx --yes pnpm@10.4.1 test
npx --yes pnpm@10.4.1 build
npx --yes pnpm@10.4.1 preview
```

La compilación queda en `dist/public`.

## Extensiones de Visual Studio Code

Abre esta carpeta en VS Code y busca `@recommended` en Extensiones. Las recomendaciones están en `.vscode/extensions.json`; no se han instalado extensiones en tu editor.

| Extensión | Para qué sirve |
| --- | --- |
| [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) | Autocompletado de las clases CSS de la aplicación. |
| [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) | Formato de TypeScript, TSX, JSON y otros archivos. |
| [YAML de Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) | Edición y validación básica de la configuración de Decap CMS. |

Son ayudas opcionales; la aplicación no depende de extensiones del editor. React, TypeScript, Vite, Tailwind, Vitest y Wrangler se instalan como dependencias del proyecto. No necesitas Live Server: usa Vite. La plantilla no tiene una configuración de ESLint; no se recomienda instalar su extensión hasta añadir esa configuración.

Para instalar estas tres extensiones, si el comando `code` está disponible:

```sh
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension redhat.vscode-yaml
```

Los plugins de GitHub o Google Drive para asistentes son otra cosa: son opcionales y no hacen falta para ejecutar Revolteira.

## Conectar los datos y publicar

La versión inicial incluye portada, navegación y catálogo. Las páginas adicionales de la plantilla se conservan en el código, fuera de la navegación principal, y requieren revisar textos, contactos y legales antes de publicarlas. El dominio, metadatos sociales y configuración de infraestructura todavía contienen marcadores.

1. Crear el repositorio propio de GitHub y actualizar `public/admin/config.yml` con repositorio, rama y URL definitiva.
2. Crear una hoja con las columnas de `templates/biblioteca-google-sheets.csv`. Añadir el catálogo real, publicarla con acceso de lectura y configurar `SHEET_URL` en `worker/biblioteca.ts`.
3. Crear D1, KV, Vectorize y acceso a Workers AI en Cloudflare; sustituir los marcadores de `wrangler.api.jsonc` y aplicar las migraciones según el manual original del README.
4. Desplegar el Worker y asociar las rutas `/api/biblioteca/*` al mismo dominio de la web. Vite por sí solo no ejecuta esta API; para desarrollo real utilizar el flujo de Wrangler del manual.
5. Configurar y desplegar el proxy OAuth de `infra/decap-oauth-worker`, registrar la OAuth App en GitHub y guardar los secretos en Cloudflare. El acceso CMS requiere esta configuración.
6. Sustituir el dominio de ejemplo, los metadatos, las imágenes sociales y los textos legales. Configurar el mobiliario desde Decap CMS si se desea el explorador espacial.
7. Establecer `VITE_CATALOG_MODE=api` en el entorno de compilación y volver a compilar. En este modo los errores de API se muestran; nunca se sustituyen silenciosamente los fondos reales por datos demo.
8. Publicar `dist/public` y verificar carga inicial de Sheets, cron, filtros, fichas y autenticación CMS.

No se han creado recursos remotos, conectado cuentas ni publicado la aplicación. No hacen falta tokens para la demostración local. Calendario y formularios son integraciones adicionales pendientes de configuración si se decide habilitarlos.

## Decap CMS en local

El modo local está habilitado en `public/admin/config.yml`. Abre dos terminales desde la raíz del proyecto:

```sh
# Terminal 1: web (si no está ya encendida)
npx --yes pnpm@10.4.1 dev
```

```sh
# Terminal 2: servidor de edición local (Linux/macOS)
npx --yes pnpm@10.4.1 dev:cms
```

En Windows PowerShell, el equivalente al segundo comando es:

```powershell
$env:BIND_HOST="127.0.0.1"
npx --yes pnpm@10.4.1 exec decap-server
```

Abre http://localhost:5173/admin/ (o el puerto que indique Vite). Si aparece «Login», pulsa para entrar al repositorio local; no necesitas cuenta ni contraseña de GitHub. El proxy escucha en 127.0.0.1:8081. Si aparece el acceso a GitHub, verifica que el servidor `dev:cms` esté encendido y recarga el panel.

Los cambios publicados desde el CMS se guardan en los archivos locales de `content/` y las imágenes en `public/images/`. No se publican en Internet ni se sincronizan con GitHub. Los libros siguen siendo los ejemplos del modo demo: Decap edita contenidos y ajustes; el catálogo real procederá de Sheets.

Después de aplicar los cambios del editor, pulsa «Publicar» en Decap para guardarlos en disco. En desarrollo, recarga la web para ver los ajustes de composición, correspondencias y calendario: Vite lee directamente `content/settings/`. Para una compilación o vista previa, ejecuta `npx --yes pnpm@10.4.1 build`, que actualiza las copias de `public/settings/`.

Referencia: https://decapcms.org/docs/decap-proxy/
