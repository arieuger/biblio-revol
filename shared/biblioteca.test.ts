import { describe, expect, it } from "vitest";
import { EXPLORER_SHELF_CORRESPONDENCES, explorerShelfAreaName, explorerSvgAreaId, explorerSvgAreaName } from "./biblioteca";

describe("correspondencias entre Andel e áreas SVG", () => {
  it("mantén unha única etiqueta pública por código da folla", () => {
    expect(explorerShelfAreaName("EL")).toBe("Expositor de libros");
    expect(explorerShelfAreaName("ER")).toBe("Expositor de revistas");
    expect(explorerShelfAreaName("Z")).toBe("Estantería azul");
    expect(explorerShelfAreaName("C")).toBe("Moble circular");
    expect(explorerShelfAreaName("a1")).toBe("A1");
    expect(explorerShelfAreaName("v4")).toBe("V4");
  });

  it("cobre todas as áreas con interacción dos SVG", () => {
    const terms = new Set(EXPLORER_SHELF_CORRESPONDENCES.map(entry => entry.spreadsheetTerm));
    expect(["A1", "A4", "B7", "C6", "D6", "V4", "EL", "ER", "Z", "C"].every(term => terms.has(term))).toBe(true);
    expect(new Set(EXPLORER_SHELF_CORRESPONDENCES.map(entry => entry.spreadsheetTerm)).size).toBe(EXPLORER_SHELF_CORRESPONDENCES.length);
  });

  it("permite cambiar o termo da folla sen cambiar o texto da área SVG", () => {
    expect(explorerShelfAreaName("LIBROS", [{ spreadsheetTerm: "LIBROS", svgArea: "EL" }])).toBe("Expositor de libros");
  });

  it("converte os identificadores SVG nos nomes públicos do menú", () => {
    expect(explorerSvgAreaName("EL")).toBe("Expositor de libros");
    expect(explorerSvgAreaName("ER")).toBe("Expositor de revistas");
    expect(explorerSvgAreaName("Z")).toBe("Estantería azul");
    expect(explorerSvgAreaName("C")).toBe("Moble circular");
    expect(explorerSvgAreaName("EXPOSITOR DE XORNAIS")).toBe("Expositor de xornais");
    expect(explorerSvgAreaId("Expositor de libros")).toBe("EL");
    expect(explorerSvgAreaId("Expositor de xornais")).toBe("Expositor de xornais");
  });
});
