import { filterOptions, getCatalogBook, recentCatalog, recommendedCatalog, searchCatalog, syncCatalog, type Env } from "./biblioteca";
import { getSeoManifest, renderSeoShell, resolveSeoBook, sitemapFromManifest } from "./seo";

const ICAL_URL = "https://calendar.google.com/calendar/ical/REEMPLAZAR_CALENDAR_ID%40group.calendar.google.com/private-8a9ab8d9f909b127579293519cce6f2d/basic.ics";

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" } });
    try {
      if (request.method === "GET" && url.pathname === "/sitemap.xml" && env.SEO_KV) {
        const manifest = await getSeoManifest(env);
        if (manifest) {
          const staticSitemap = env.ASSETS
            ? await env.ASSETS.fetch(new Request(new URL("/sitemap.xml", request.url), request))
            : await fetch(new Request(new URL("/sitemap.xml", request.url), request));
          return new Response(sitemapFromManifest(manifest, await staticSitemap.text()), { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
        }
      }
      if (request.method === "GET" && (url.pathname === "/biblioteca" || url.pathname === "/biblioteca/")) {
        return fetch(new Request(new URL("/", request.url), request));
      }
      const detailMatch = url.pathname.match(/^\/biblioteca\/([^/]+)$/);
      if (request.method === "GET" && detailMatch && env.SEO_KV) {
        const slug = decodeURIComponent(detailMatch[1]!);
        const resolved = await resolveSeoBook(env, slug);
        if (resolved && resolved.canonicalSlug !== slug) {
          return Response.redirect(`${url.origin}/biblioteca/${encodeURIComponent(resolved.canonicalSlug)}`, 301);
        }
        const book = resolved?.book ?? null;
        if (!book) return new Response("Exemplar non atopado", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
        const shellResponse = env.ASSETS
          ? await env.ASSETS.fetch(new Request(new URL("/", request.url), request))
          : await fetch(new Request(new URL("/", request.url), request));
        const shell = await shellResponse.text();
        return new Response(renderSeoShell(shell, book, `/biblioteca/${encodeURIComponent(slug)}`), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300, stale-while-revalidate=60" } });
      }
      if (url.pathname === "/api/biblioteca/libros") return Response.json(await searchCatalog(env, url), { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
      if (url.pathname === "/api/biblioteca/recomendacions") return Response.json(await recommendedCatalog(env), { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
      if (url.pathname === "/api/biblioteca/novidades") return Response.json(await recentCatalog(env), { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
      const bookMatch = url.pathname.match(/^\/api\/biblioteca\/libros\/([^/]+)$/);
      if (bookMatch) {
        const book = await getCatalogBook(env, decodeURIComponent(bookMatch[1]!));
        return book ? Response.json(book, { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } }) : Response.json({ erro: "Exemplar non atopado." }, { status: 404, headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
      }
      if (url.pathname === "/api/biblioteca/filtros") return Response.json(await filterOptions(env), { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
      if (url.pathname === "/api/biblioteca/estado") return Response.json({ actualizadaEn: (await filterOptions(env)).actualizadaEn }, { headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
      if (url.pathname === "/api/calendar/ical") {
        const calendar = await fetch(ICAL_URL, { headers: { "User-Agent": "NOME DA ASOCIACIÓN-Calendar/1.0" }, cf: { cacheTtl: 300, cacheEverything: true } });
        if (!calendar.ok) throw new Error("Non se puido obter o calendario.");
        return new Response(calendar.body, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" } });
      }
    } catch (error) {
      console.error("[biblioteca]", error);
      return Response.json({ erro: "O catálogo está actualizándose. Téntao de novo nuns instantes." }, { status: 503, headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Non atopado", { status: 404 });
  },
  async scheduled(_controller, env, ctx): Promise<void> {
    ctx.waitUntil(syncCatalog(env, { refreshSeo: true }));
  },
} satisfies ExportedHandler<Env>;
