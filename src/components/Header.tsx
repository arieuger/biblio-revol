import { withBase } from "@/lib/site-path";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { demoMode } from "@/lib/catalog-api";
export default function Header() {
  const [location] = useLocation();
  const [logoFailed, setLogoFailed] = useState(false);
  return <header className="border-b-2 border-primary bg-background sticky top-0 z-50">
    <div className="container flex flex-wrap items-center justify-between gap-4 py-5">
      <Link href="/" aria-label="Revolteira — Inicio" className="flex items-center gap-3 font-display text-2xl font-bold">{logoFailed ? "Revolteira" : <img src={withBase("/logo.png")} alt="Revolteira" onError={() => setLogoFailed(true)} className="h-12 w-auto max-w-40 object-contain" />}</Link>
      <nav aria-label="Navegación principal" className="flex gap-5 text-sm font-semibold">
        <Link href="/" aria-current={location === "/" ? "page" : undefined}>Inicio</Link>
        <Link href="/biblioteca?modo=catalogo" aria-current={location.startsWith("/biblioteca") ? "page" : undefined}>Catálogo</Link>
      </nav>
    </div>
    {demoMode && <p className="bg-accent text-accent-foreground text-center px-4 py-2 text-sm">Versión de demostración · Os exemplares e a dispoñibilidade son datos de exemplo.</p>}
  </header>;
}
