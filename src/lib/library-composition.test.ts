import { describe, expect, it } from "vitest";
import { DEFAULT_LIBRARY_COMPOSITION, normalizeLibraryComposition } from "./library-composition";
import { libraryCompositionHtml, libraryCompositionJson } from "./library-composition-export";

describe("library composition", () => {
  it("keeps the approved initial scene valid", () => {
    const normalized = normalizeLibraryComposition({ composition: DEFAULT_LIBRARY_COMPOSITION });
    expect(normalized.background.src).toContain("escenario-dos-paredes.svg");
    expect(normalized.items).toHaveLength(6);
    expect(normalized.items.map(item => item.id)).toContain("circularUnit");
  });

  it("normalizes CMS values and rejects unsafe furniture sources", () => {
    const normalized = normalizeLibraryComposition({
      composition: {
        version: 1,
        background: { src: "", assetFile: "fondo.svg" },
        items: [
          { id: "novo", name: "Moble novo", description: "Proba", src: "data:image/svg+xml;base64,PHN2Zy8+", assetFile: "novo.svg", left: 200, top: -10, height: 101, aspect: 10, layer: 4 },
          { id: "inseguro", src: "https://example.invalid/moble.svg", left: 1, top: 1, height: 10, aspect: 1, layer: 1 },
        ],
      },
    });
    expect(normalized.background.src).toBe("");
    expect(normalized.items).toHaveLength(1);
    expect(normalized.items[0]).toMatchObject({ id: "novo", left: 100, top: 0, height: 95, aspect: 8 });
  });

  it("preserves deleting every item through the CMS save and reload cycle", () => {
    const saved = normalizeLibraryComposition({
      composition: { ...DEFAULT_LIBRARY_COMPOSITION, items: [] },
    });
    expect(saved.items).toEqual([]);
    const reloaded = normalizeLibraryComposition(JSON.parse(libraryCompositionJson(saved)));
    expect(reloaded.items).toEqual([]);
  });

  it("preserves partial deletions without restoring missing furniture", () => {
    const remaining = DEFAULT_LIBRARY_COMPOSITION.items.slice(1);
    const reloaded = normalizeLibraryComposition({ composition: {
      ...DEFAULT_LIBRARY_COMPOSITION, items: remaining,
    } });
    expect(reloaded.items.map(item => item.id)).toEqual(remaining.map(item => item.id));
  });

  it("does not insert default furniture when all supplied assets are rejected", () => {
    expect(normalizeLibraryComposition({ items: [
      { id: "unsafe", src: "https://example.invalid/furniture.svg" },
    ] }).items).toEqual([]);
  });

  it("still supplies defaults for a missing items field", () => {
    expect(normalizeLibraryComposition({}).items).toEqual(DEFAULT_LIBRARY_COMPOSITION.items);
  });

  it("exports self-contained JSON and HTML structures", () => {
    const json = libraryCompositionJson(DEFAULT_LIBRARY_COMPOSITION);
    const html = libraryCompositionHtml(DEFAULT_LIBRARY_COMPOSITION);
    expect(json).toContain('"composition"');
    expect(html).toContain("Composición do mobiliario da Biblioteca");
    expect(html).toContain("estanteria-interactiva.svg");
  });
});
