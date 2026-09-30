import { EXPLORER_SHELF_CORRESPONDENCES, explorerSvgAreaId, explorerSvgAreaName, type ExplorerShelfCorrespondence } from "@shared/biblioteca";
import { fetchLibraryComposition } from "@/lib/library-composition";
import { useEffect, useState } from "react";

type MappingMessage = { type?: string; mappings?: unknown };

function normalizeMappings(value: unknown): ExplorerShelfCorrespondence[] {
  if (!Array.isArray(value)) return EXPLORER_SHELF_CORRESPONDENCES.map(mapping => ({ ...mapping }));
  return value.flatMap(entry => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Partial<ExplorerShelfCorrespondence>;
    const spreadsheetTerm = typeof candidate.spreadsheetTerm === "string" ? candidate.spreadsheetTerm.trim() : "";
    const svgArea = typeof candidate.svgArea === "string" ? explorerSvgAreaId(candidate.svgArea) : "";
    return spreadsheetTerm && svgArea ? [{ spreadsheetTerm, svgArea }] : [];
  });
}

async function discoverSvgAreas(): Promise<string[]> {
  const composition = await fetchLibraryComposition();
  const areas = new Set(EXPLORER_SHELF_CORRESPONDENCES.map(mapping => mapping.svgArea));
  await Promise.all(composition.items.map(async item => {
    try {
      const response = await fetch(item.src);
      if (!response.ok) return;
      const document = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
      document.querySelectorAll("[data-id]").forEach(element => {
        const value = element.getAttribute("data-id")?.trim();
        if (value) areas.add(explorerSvgAreaId(value));
      });
    } catch {
      // An unavailable asset does not prevent editing the known areas.
    }
  }));
  return Array.from(areas).sort((first, second) => first.localeCompare(second, undefined, { numeric: true }));
}

export default function LibraryShelfMappingsCmsEditor() {
  const [mappings, setMappings] = useState<ExplorerShelfCorrespondence[]>(EXPLORER_SHELF_CORRESPONDENCES);
  const [areaOptions, setAreaOptions] = useState<string[]>(EXPLORER_SHELF_CORRESPONDENCES.map(mapping => mapping.svgArea));
  const [embeddedInCms, setEmbeddedInCms] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.parent === window) return;
    setEmbeddedInCms(true);
    const receive = (event: MessageEvent<MappingMessage>) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type !== "library-mappings:load") return;
      setMappings(normalizeMappings(event.data.mappings));
      setReady(true);
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "library-mappings:ready" }, window.location.origin);
    discoverSvgAreas().then(setAreaOptions).catch(() => undefined);
    return () => window.removeEventListener("message", receive);
  }, []);

  const update = (index: number, patch: Partial<ExplorerShelfCorrespondence>) => {
    setMappings(current => current.map((mapping, mappingIndex) => mappingIndex === index ? { ...mapping, ...patch } : mapping));
  };
  const areaIsAssigned = (area: string, index: number) => mappings.some((candidate, candidateIndex) => candidateIndex !== index && candidate.svgArea.toUpperCase() === area.toUpperCase());
  const add = () => setMappings(current => [...current, { spreadsheetTerm: "", svgArea: areaOptions.find(area => !current.some(mapping => mapping.svgArea.toUpperCase() === area.toUpperCase())) ?? areaOptions[0] ?? "" }]);
  const remove = (index: number) => setMappings(current => current.filter((_, mappingIndex) => mappingIndex !== index));
  const publish = () => window.parent.postMessage({ type: "library-mappings:change", mappings }, window.location.origin);

  if (!embeddedInCms) return <main className="flex min-h-screen items-center justify-center p-6"><section className="max-w-lg border-2 border-primary bg-card p-6"><h1 className="text-2xl font-bold">Táboa non dispoñible nesta ruta</h1><p className="mt-3 text-sm">Esta táboa só se pode editar desde DecapCMS.</p></section></main>;

  return <main className="min-h-screen bg-background p-4 text-foreground sm:p-6"><div className="mx-auto max-w-6xl"><div className="mb-5"><h1 className="text-2xl font-bold sm:text-3xl">Táboa de correspondencias da Biblioteca</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Escribe o texto da folla de cálculo e selecciona a área SVG. O valor técnico gárdase internamente, pero aquí e en toda a web verás o nome público da área.</p>{!ready && <p className="mt-2 text-xs text-muted-foreground">Conectando co formulario de DecapCMS…</p>}</div><div className="overflow-x-auto rounded-md border border-border bg-card"><table className="w-full min-w-[42rem] border-collapse text-sm"><thead className="bg-secondary/50"><tr><th className="border-b border-border px-3 py-3 text-left">Texto da folla (Andel)</th><th className="border-b border-border px-3 py-3 text-left">Área SVG</th><th className="w-28 border-b border-border px-3 py-3 text-left">Acción</th></tr></thead><tbody>{mappings.map((mapping, index) => <tr key={`${index}-${mapping.spreadsheetTerm}`}><td className="border-b border-border p-2"><input aria-label={`Texto da folla ${index + 1}`} value={mapping.spreadsheetTerm} onChange={event => update(index, { spreadsheetTerm: event.target.value })} className="w-full rounded border border-input bg-card px-3 py-2" placeholder="Ex.: libros" /></td><td className="border-b border-border p-2"><select aria-label={`Área SVG ${index + 1}`} value={mapping.svgArea} onChange={event => update(index, { svgArea: event.target.value })} className="w-full rounded border border-input bg-card px-3 py-2">{!areaOptions.some(area => area.toUpperCase() === mapping.svgArea.toUpperCase()) && mapping.svgArea && <option value={mapping.svgArea}>{explorerSvgAreaName(mapping.svgArea)} (actual)</option>}{areaOptions.map(area => <option key={area} value={area} disabled={areaIsAssigned(area, index)}>{explorerSvgAreaName(area)}{areaIsAssigned(area, index) ? " (asignada)" : ""}</option>)}</select></td><td className="border-b border-border p-2"><button type="button" onClick={() => remove(index)} className="rounded border border-destructive/50 px-2 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10">Eliminar</button></td></tr>)}</tbody></table></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={add} className="rounded border border-primary/50 px-3 py-2 text-sm font-semibold text-primary">Engadir correspondencia</button><button type="button" onClick={publish} className="rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Gardar táboa no formulario</button></div><p className="mt-3 text-xs leading-5 text-muted-foreground">As áreas dispoñibles detéctanse dos SVG publicados da composición, incluídos os mobles SVG novos. Publica primeiro a composición se acabas de subir un moble novo.</p></div></main>;
}
