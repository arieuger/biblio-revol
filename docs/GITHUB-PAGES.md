# Publicación de Revolteira en GitHub Pages

Repositorio: `arieuger/biblio-revol`, rama `main`.
Web: https://arieuger.github.io/biblio-revol/
CMS: https://arieuger.github.io/biblio-revol/admin/

## Despliegue automático

En GitHub → Settings → Pages → Build and deployment, seleccionar **GitHub Actions**.
El workflow `.github/workflows/pages.yml` instala dependencias, comprueba tipos y pruebas,
compila y publica `dist/public` en cada push a `main`. También se puede ejecutar desde
Actions → Publish GitHub Pages → Run workflow.

Para reproducir la compilación:

```sh
npx --yes pnpm@10.4.1 build:pages
```

Este comando configura `/biblio-revol/`, el dominio público y el catálogo demo.
Genera las rutas de los editores del CMS y elimina `local_backend` de la configuración
publicada. El modo local sigue disponible con `dev` y `dev:cms`.

GitHub Pages no ejecuta Workers ni la API de Sheets, D1 o búsqueda semántica.
El despliegue inicial usa los libros de demostración. Una futura conexión con el catálogo
real necesitará publicar el Worker de biblioteca y configurar el acceso desde la web.
Las rutas conocidas tienen HTML propio. Las fichas no prerenderizadas se abren mediante
`404.html`: la aplicación funciona, pero GitHub devuelve un estado HTTP 404 en el acceso
directo a esas URL. Esto debe resolverse con prerenderizado del catálogo al conectarlo.

## Autenticación de Decap con GitHub

La web y el CMS son estáticos. Solo el intercambio OAuth se ejecuta en Cloudflare.

1. Autorizar y desplegar el Worker:

```sh
npx --yes pnpm@10.4.1 exec wrangler login --config infra/decap-oauth-worker/wrangler.toml
npx --yes pnpm@10.4.1 deploy:cms-auth
```

2. Copiar la URL HTTPS del Worker (`https://revolteira-decap-oauth.antiaroig.workers.dev`).
3. En https://github.com/settings/developers → OAuth Apps → New OAuth App:
   - Application name: `Revolteira CMS`.
   - Homepage URL: `https://arieuger.github.io/biblio-revol/`.
   - Authorization callback URL: la URL del Worker seguida de `/callback`.
4. Configurar **directamente** el Client ID y el Client Secret como secretos del Worker:

```sh
npx --yes pnpm@10.4.1 exec wrangler secret put GITHUB_CLIENT_ID --config infra/decap-oauth-worker/wrangler.toml
npx --yes pnpm@10.4.1 exec wrangler secret put GITHUB_CLIENT_SECRET --config infra/decap-oauth-worker/wrangler.toml
```

Estos comandos solicitan cada valor de manera interactiva. También se pueden añadir en
Cloudflare → Workers & Pages → revolteira-decap-oauth → Settings → Variables and Secrets.
No deben guardarse en el repositorio ni en variables `VITE_*`.

5. El `base_url` del CMS ya apunta a `https://revolteira-decap-oauth.antiaroig.workers.dev`.
   Si se cambia el Worker, actualizarlo o crear la variable de Actions `CMS_OAUTH_URL`
   con el nuevo origen HTTPS (sin `/auth` ni `/callback`).
6. Ejecutar otra vez el workflow de Pages. El build incorpora esa URL al `base_url` del CMS.
7. Abrir `/admin/`, autorizar GitHub y comprobar una edición. La cuenta debe tener permiso
   de escritura sobre `arieuger/biblio-revol`. Al publicar desde Decap se crea un commit
   en `main` que activa el despliegue de Pages.

El Worker restringe los mensajes OAuth al origen `https://arieuger.github.io` y valida
el estado de sesión mediante una cookie. `/health` informa de si están configuradas las
credenciales, pero no verifica que GitHub las acepte: el login completo debe probarse.
El scope `repo` admite repositorios privados; para uno público puede reducirse a
`public_repo` en `infra/decap-oauth-worker/wrangler.toml`.

Referencias:
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://decapcms.org/docs/github-backend/
