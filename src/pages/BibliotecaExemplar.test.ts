import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { explorerShelfAreaName, explorerShelfHref } from "@shared/biblioteca";
import { bibliotecaReturnLink, ShelfExplorerLinks } from "./BibliotecaExemplar";

describe("retorno contextual das fichas da Biblioteca", () => {
  it("restaura o Modo catálogo por defecto e cando procede do catálogo", () => {
    expect(bibliotecaReturnLink("")).toEqual({ href: "/biblioteca?modo=catalogo", label: "Volver ao catálogo" });
    expect(bibliotecaReturnLink("modo=catalogo")).toEqual({ href: "/biblioteca?modo=catalogo", label: "Volver ao catálogo" });
  });

  it("restaura o Modo explorador cando a ficha se abriu desde ese modo", () => {
    expect(bibliotecaReturnLink("modo=explorador")).toEqual({ href: "/biblioteca?modo=explorador", label: "Volver ao explorador" });
  });

  it("preserva o andel activo ao volver á exploración desde unha ficha", () => {
    expect(bibliotecaReturnLink("modo=explorador&andel=EL")).toEqual({ href: "/biblioteca?modo=explorador&andel=EL", label: "Volver ao explorador" });
  });

  it("amosa os nomes das áreas e constrúe a ruta exploradora co filtro activo", () => {
    expect(explorerShelfAreaName("EL")).toBe("Expositor de libros");
    expect(explorerShelfAreaName("ER")).toBe("Expositor de revistas");
    expect(explorerShelfAreaName("Z")).toBe("Estantería azul");
    expect(explorerShelfAreaName("C")).toBe("Moble circular");
    expect(explorerShelfAreaName("A1")).toBe("A1");
    expect(explorerShelfHref("EL")).toBe("/biblioteca?modo=explorador&andel=EL");
  });

  it("mantén a orde bibliográfica dos campos multimedia na ficha", () => {
    const source = readFileSync("src/pages/BibliotecaExemplar.tsx", "utf8");
    const labels = ["Autoría", "Data de publicación", "Dirección", "Produción", "Guión", "Reparto", "Música", "Fotografía", "Editorial", "Colección", "Volume", "Número", "Páxinas", "Soporte", "Formato", "Xénero", "Duración", "Discográfica", "Estudio", "ISBN / ISSN / EAN", "Exemplares dispoñibles", "Andel"].map(label => `label="${label}"`);
    const positions = labels.map(label => source.indexOf(label));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect(source.indexOf('<h2 className="font-display text-2xl font-bold">Sinopse</h2>')).toBeGreaterThan(positions.at(-1) ?? -1);
    for (const filter of ["direccion", "producion", "guion", "reparto", "musica", "fotografia", "discografica", "estudio"]) expect(source).toContain(`filter="${filter}"`);
    expect(source).toContain("formatDurationInMinutes(book.duracion)");
  });

  it("engade prismáticos accesibles despois de cada andel ligado ao explorador", () => {
    Object.defineProperty(globalThis, "location", { value: new URL("https://biblioteca-exemplo.example.org/"), configurable: true });
    const links = renderToStaticMarkup(createElement(ShelfExplorerLinks, { shelves: ["EL", "A3"] }));
    Reflect.deleteProperty(globalThis, "location");
    expect(links).toContain("Expositor de libros");
    expect(links).toContain("A3");
    expect((links.match(/lucide-binoculars/g) ?? []).length).toBe(2);
    expect(links).toContain('href="/biblioteca?modo=explorador&amp;andel=EL"');
    expect(links).toContain('aria-label="Localizar Expositor de libros no Modo explorador"');
  });
});
