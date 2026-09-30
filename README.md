# Revolteira

Primera versión local con portada y catálogo de demostración. Consulta [Primeros pasos y extensiones de VS Code](docs/PRIMEROS-PASOS.md).

El manual original de la plantilla se conserva a continuación como referencia para la infraestructura pendiente de configurar.

# Plantilla de biblioteca web — React + DecapCMS + Sheets + Cloudflare

Plantilla estrutural baseada na arquitectura da biblioteca da web de A Hedreira. Inclúe a SPA, editor de composición e correspondencias, DecapCMS, Worker de catálogo, D1/FTS5, Vectorize/Workers AI, SEO en KV, cron e configuración de Pages/Workers. **Exclúe contido, portadas, logos, SVG e credenciais da Hedreira.** Todos os valores `REEMPLAZAR_*`, `biblioteca-exemplo.example.org`, `USUARIO/REPOSITORIO` e `example.org` son marcadores.

## Estrutura

- `src/`: SPA React/Vite; `src/pages/Biblioteca*.tsx` contén catálogo e editores.
- `src/lib/library-composition.ts`: contrato, normalización segura e carga de JSON CMS.
- `shared/biblioteca.ts`: tipos e correspondencias de andeis.
- `worker/index.ts`: API, fallback SPA, sitemap/SEO e `scheduled()`.
- `worker/biblioteca.ts`: CSV, normalización, D1, FTS5 e embeddings.
- `worker/seo.ts`: snapshot en KV e meta tags por exemplar.
- `migrations/`: migracións incrementais de D1 (aplicar en orde).
- `content/settings/`: fonte dos JSON editables por DecapCMS.
- `public/admin/`: DecapCMS e widgets; `templates/`: contrato da folla.
- `infra/decap-oauth-worker/`: proxy OAuth de GitHub para DecapCMS.

## Adaptación obrigatoria

1. Cambiar nome, textos, correo, dominio, logo, favicon, cores, legais, `index.html`, `src/components/SEO.tsx`, `worker/seo.ts`, scripts SEO, `robots.txt` e sitemap.
2. En `public/admin/config.yml`, cambiar `repo`, `branch`, `site_domain`, `base_url` e `auth_endpoint`.
3. En `worker/biblioteca.ts`, cambiar `SHEET_URL` por `https://docs.google.com/spreadsheets/d/ID/export?format=csv&gid=GID`. A folla debe ser pública como lector e ter a cabeceira de `templates/biblioteca-google-sheets.csv`; `Título` é obrigatoria.
4. Portadas: ficheiros en `public/images/biblioteca/`; na folla, só o nome simple, sen rutas nin barras.
5. Mobiliario: subir fondo/SVG a `public/images/biblioteca/mobiliario/`. As zonas interactivas deben ter `data-id`; editar `content/settings/library-composition.json` desde DecapCMS.
6. Correspondencias: `content/settings/library-shelf-mappings.json` contén `{ "spreadsheetTerm": "A1", "svgArea": "A1" }`; o primeiro debe coincidir coa columna `Andel`.
7. Calendario: substituír o ID/URL e a chave de Google Calendar en `src/pages/Calendario.tsx`; `calendar.json` garda cores.
8. Formularios: definir `VITE_WEB3FORMS_ACCESS_KEY` e `VITE_HCAPTCHA_SITEKEY` en variables, nunca no repo.

## Contrato Google Sheets

Columnas: `Portada`, `Título`, `Autoría`, `Data`, `Dirección`, `Produción`, `Guión`, `Reparto`, `Música`, `Fotografía`, `Editorial`, `Colección`, `Volume`, `Número`, `Páxinas`, `Soporte`, `Formato`, `Xénero`, `Duración`, `Discográfica`, `Estudio`, `ISBN / ISSN / EAN`, `Sinopse`, `Temática`, `Andel`, `Idioma`, `Exemplares totais`, `Exemplares emprestados`, `Exemplares dispoñibles`, `Recomendación`. Varias etiquetas sepáranse por `, `. Datas: `dd/mm/aaaa`, `mm/aaaa`, `aaaa-mm` ou `aaaa`. A sincronización ignora filas sen título, xera slugs e trata duplicados de forma estable.

## Cloudflare

Crear na conta propia: **D1**, **Vectorize** (1024 dimensións, cosine, compatible con `@cf/baai/bge-m3`), **KV** para `SEO_KV` e acceso a **Workers AI**. Cubrir IDs/nome/rutas en `wrangler.api.jsonc`; aplicar `pnpm exec wrangler d1 migrations apply NOME_DA_BASE --remote --config wrangler.api.jsonc`; crear índice con `pnpm exec wrangler vectorize create NOME --dimensions=1024 --metric=cosine`; publicar con `pnpm deploy:biblioteca-api`.

O cron incluído é `0 * * * *` (cada hora, UTC). O primeiro ciclo importa o CSV e xera embeddings pendentes; os seguintes comparan hash e son incrementais. A API expón `/api/biblioteca/libros`, `/api/biblioteca/libros/:slug`, `/api/biblioteca/filtros`, `/api/biblioteca/recomendacions`, `/api/biblioteca/novidades` e `/api/biblioteca/estado`. En Workers & Pages → Worker → Settings → Domains & Routes, asociar as rutas do dominio real. Se se une web+API, cubrir tamén `wrangler.jsonc`.

## Pages e GitHub

Pages: build `pnpm install --frozen-lockfile && pnpm build`, output `dist/public`. A publicación automática non se inclúe nesta plantilla; se a asociación crea un workflow GitHub, deberá configurar os secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` e opcionalmente `CLOUDFLARE_PAGES_PROJECT`. `public/_redirects` mantén o fallback SPA e `public/_headers` inclúe CSP para DecapCMS. Non commite tokens.

## DecapCMS/OAuth

Publicar `infra/decap-oauth-worker`, crear OAuth App en GitHub, usar como callback a súa URL `/callback`, definir secrets `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` e limitar `ALLOWED_ORIGIN`. Logo poñer a URL en `base_url`/`auth_endpoint`. O usuario GitHub precisa escritura no repo. Probar login, subida de imaxe, post, composición e correspondencias.

## Instalación/verificación

```sh
corepack enable && pnpm install --frozen-lockfile
cp .env.example .env
pnpm check && pnpm check:worker && pnpm test && pnpm build
pnpm dev
```

Checklist: eliminar todos os `REEMPLAZAR_`; configurar repo/rama/Sheets; crear e ligar D1/KV/Vectorize/AI; aplicar migracións; comprobar o cron e a primeira carga; configurar rutas/domínio, OAuth, SEO, legais, calendario, logos e portadas. A composición inicial está baleira para que a asociación suba os seus assets.
