# Infraestrutura da Biblioteca en Cloudflare

O catálogo está preparado para executarse no mesmo ecosistema de Cloudflare que xa serve a web. Esta arquitectura evita unha base MySQL ou PostgreSQL separada e mantén os datos, a busca e a actualización periódica nunha única conta.

| Requisito | Servizo de Cloudflare | Implementación |
| --- | --- | --- |
| Datos bibliográficos e filtros | D1 | Base `REEMPLAZAR-biblioteca`, coas táboas `biblioteca_libros`, `biblioteca_vectores` e `biblioteca_sincronizacion`. |
| Busca textual ponderada | D1 FTS5 | O índice `biblioteca_fts` busca en título, autoría, dirección, produción, guión, reparto, música, fotografía, editorial, colección, volume, número, discográfica, estudio e sinopse. Os pesos son, nesa orde: `8, 8, 5, 4, 4, 4, 4, 3, 3, 3, 6, 8, 3, 3, 1`; así, título, autoría e número teñen a máxima prioridade. |
| Busca semántica | Vectorize + Workers AI | O modelo multilingüe `@cf/baai/bge-m3` xera vectores e Vectorize devolve os títulos relacionados. |
| Actualización automática | Worker Cron Trigger | A expresión `0 * * * *` inicia a sincronización do CSV público cada hora, en UTC. |
| Publicación da web | Workers Assets | Serve `dist/public` e conserva o comportamento de aplicación dunha soa páxina. |

## Recursos creados

A base D1 xa creada para o catálogo ten o identificador `REEMPLAZAR_D1_DATABASE_ID`. A configuración `wrangler.jsonc` enlaza este identificador co Worker como `BIBLIOTECA_DB`.

Antes do primeiro despregamento, crea o índice Vectorize multilingüe cunha dimensión compatible con `@cf/baai/bge-m3` e co nome configurado no ficheiro `wrangler.jsonc`:

```sh
pnpm exec wrangler vectorize create REEMPLAZAR-biblioteca-vectors --dimensions=1024 --metric=cosine
```

O repositorio inclúe o workflow `.github/workflows/deploy-biblioteca.yml`, que en cada push a `main` executa os tests, aplica as migracións remotas D1 e publica automaticamente o Worker da API. Para que GitHub poida facelo, a configuración do repositorio debe ter os secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`; non é necesario iniciar sesión manualmente desde o sandbox. Se a web estática se publica en Cloudflare Pages, a variable de repositorio `CLOUDFLARE_PAGES_PROJECT` activa tamén o job que constrúe e publica `dist/public`; se non existe, ese job omítese e o Worker da API publícase igualmente.

Para unha publicación manual, tamén se pode executar:

```sh
pnpm deploy:biblioteca-api
```

O primeiro ciclo importa a folla e procesa ata 128 vectores. Os ciclos seguintes continúan coa indexación incremental sen volver a xerar vectores para libros que non cambiaron.

## Separación da API e da web estática

A web actual pode seguir publicada en Cloudflare Pages. O ficheiro `wrangler.api.jsonc` publica só a API e o Cron Trigger nun Worker chamado `REEMPLAZAR-biblioteca-api`; isto evita migrar ou volver subir os activos estáticos existentes. Tras a súa publicación, a ruta `biblioteca-exemplo.example.org/api/biblioteca/*` debe asociarse a ese Worker desde **Workers & Pages → REEMPLAZAR-biblioteca-api → Settings → Domains & Routes**.

## Operación e observabilidade

O Cron Trigger executa a sincronización en UTC. Cloudflare pode tardar varios minutos en propagar unha alta ou cambio do cron, pero a programación configurada é de un minuto. Os últimos cen eventos poden consultarse en **Workers & Pages → Worker → Settings → Trigger Events → View events**.

Non se empregan segredos: tanto o CSV como a lectura pública do catálogo poden ser accesibles. A fonte publica as portadas no propio repositorio, en `public/images/biblioteca/`.

## Referencias

[1] [Cloudflare D1 — SQL statements e FTS5](https://developers.cloudflare.com/d1/sql-api/sql-statements/).

[2] [Cloudflare Vectorize e Workers AI](https://developers.cloudflare.com/vectorize/get-started/embeddings/).

[3] [Cloudflare Workers AI — bge-m3](https://developers.cloudflare.com/workers-ai/models/bge-m3/).

[4] [Cloudflare Workers — Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/).
