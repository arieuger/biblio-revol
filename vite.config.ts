import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { readFile } from "node:fs/promises";

// Vite's SPA fallback serves the React app for public directory URLs.
// Redirect only the CMS root; its React editor routes must keep using the SPA.
function decapAdminRoute(): Plugin {
  const install = (server: Pick<ViteDevServer, "middlewares">) => {
    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url ?? "/", "http://localhost");
      if (url.pathname !== "/admin" && url.pathname !== "/admin/") {
        next();
        return;
      }
      res.writeHead(302, { Location: `/admin/index.html${url.search}` });
      res.end();
    });
  };
  return {
    name: "decap-admin-route",
    configureServer: install,
    configurePreviewServer: install,
  };
}

// Decap writes the source settings. In development, serve those files directly
// instead of the public copies that are refreshed only during a build.
function localCmsSettings(): Plugin {
  const settings = new Set([
    "/settings/library-composition.json",
    "/settings/library-shelf-mappings.json",
    "/settings/calendar.json",
  ]);
  return {
    name: "local-cms-settings",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
        if (!settings.has(pathname) || (req.method !== "GET" && req.method !== "HEAD")) {
          next();
          return;
        }
        const file = path.resolve(server.config.root, "content", pathname.slice(1));
        void readFile(file).then(content => {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(req.method === "HEAD" ? undefined : content);
        }).catch(next);
      });
    },
  };
}

export default defineConfig({
  plugins: [decapAdminRoute(), localCmsSettings(), react(), tailwindcss()],
  server: {
    allowedHosts: [".manus.computer"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@shared": path.resolve(import.meta.dirname, "./shared"),
    },
  },
  base: process.env.VITE_BASE_PATH || "/",
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separamos as librarías pesadas para mellorar a caché e reducir o bundle principal
          'vendor-react': ['react', 'react-dom', 'wouter'],
          'vendor-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
            'lucide-react'
          ],
          'vendor-charts': ['recharts'],
          'vendor-markdown': ['react-markdown', 'rehype-raw'],
          'vendor-calendar': [
            '@fullcalendar/react',
            '@fullcalendar/daygrid',
            '@fullcalendar/list',
            '@fullcalendar/icalendar',
            '@fullcalendar/core',
            'ical.js'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
});
