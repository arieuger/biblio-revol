import { EXPLORER_SHELF_CORRESPONDENCES, explorerSvgAreaId, type ExplorerShelfCorrespondence } from "@shared/biblioteca";

export type LibraryBackground = {
  src: string;
  assetFile: string;
};

export type LibraryFurniture = {
  id: string;
  name: string;
  description: string;
  src: string;
  assetFile: string;
  left: number;
  top: number;
  height: number;
  aspect: number;
  layer: number;
};

export type LibraryComposition = {
  version: 1;
  background: LibraryBackground;
  items: LibraryFurniture[];
  shelfMappings: ExplorerShelfCorrespondence[];
};

const FURNITURE_ROOT = "/images/biblioteca/mobiliario/";

export const DEFAULT_LIBRARY_COMPOSITION: LibraryComposition = {
  version: 1,
  background: {
    src: `${FURNITURE_ROOT}escenario-dos-paredes.svg`,
    assetFile: "escenario-dos-paredes.svg",
  },
  items: [
    { id: "blackShelves", name: "Estantería grande", description: "O conxunto principal de estanterías do fondo bibliográfico.", src: `${FURNITURE_ROOT}estanteria-interactiva.svg?v=areas-gl-2`, assetFile: "estanteria-interactiva.svg", left: 7.713, top: 7.414, height: 63.1, aspect: 1.3, layer: 2 },
    { id: "greenShelf", name: "Estantería verde", description: "Estantería metálica verde de pé.", src: `${FURNITURE_ROOT}estanteria-verde-interactiva.svg?v=areas-gl-2`, assetFile: "estanteria-verde-interactiva.svg", left: 49.743, top: 21.496, height: 56.4, aspect: 0.56, layer: 3 },
    { id: "woodenDisplay", name: "Expositor de libros", description: "Expositor de madeira situado na parte superior da composición.", src: `${FURNITURE_ROOT}expositor-putumayo-interactivo.svg?v=areas-gl-2`, assetFile: "expositor-putumayo-interactivo.svg", left: 54.61, top: 7.45, height: 17.4, aspect: 0.83, layer: 1 },
    { id: "blueShelf", name: "Estantería azul", description: "Estantería de madeira azul.", src: `${FURNITURE_ROOT}estanteria-azul-interactiva.svg?v=areas-gl-2`, assetFile: "estanteria-azul-interactiva.svg", left: 66.548, top: 11.738, height: 31.1, aspect: 1.55, layer: 2 },
    { id: "magazineRack", name: "Expositor de revistas", description: "Expositor vertical para revistas e publicacións periódicas.", src: `${FURNITURE_ROOT}expositor-revistas-interactivo.svg?v=areas-gl-2`, assetFile: "expositor-revistas-interactivo.svg", left: 84.642, top: 20.769, height: 56.7, aspect: 0.29, layer: 5 },
    { id: "circularUnit", name: "Moble circular", description: "Moble circular de consulta e organización do fondo.", src: `${FURNITURE_ROOT}mueble-circular-interactivo.svg?v=areas-gl-2`, assetFile: "mueble-circular-interactivo.svg", left: 68.964, top: 42.712, height: 38.7, aspect: 1, layer: 6 },
  ],
  shelfMappings: EXPLORER_SHELF_CORRESPONDENCES.map(mapping => ({ ...mapping })),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function text(value: unknown, fallback: string, maximum = 180): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maximum) : fallback;
}

function normalizeShelfMappings(value: unknown): ExplorerShelfCorrespondence[] {
  if (!Array.isArray(value)) return EXPLORER_SHELF_CORRESPONDENCES.map(mapping => ({ ...mapping }));
  const seen = new Set<string>();
  return value.flatMap(entry => {
    if (!isRecord(entry)) return [];
    const spreadsheetTerm = text(entry.spreadsheetTerm, "", 80).toUpperCase();
    const svgArea = explorerSvgAreaId(text(entry.svgArea ?? entry.svgAreaName, "", 180));
    if (!spreadsheetTerm || !svgArea || seen.has(spreadsheetTerm)) return [];
    seen.add(spreadsheetTerm);
    return [{ spreadsheetTerm, svgArea }];
  });
}

function number(value: unknown, fallback: number, minimum: number, maximum: number): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback;
}

export function safeAssetFile(value: string, fallback = "elemento.svg"): string {
  const sanitized = value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9áéíóúüñ._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return sanitized || fallback;
}

export function isSafeAssetSource(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return value.startsWith(FURNITURE_ROOT) || value.startsWith("data:image/");
}

function normalizeItem(value: unknown, index: number): LibraryFurniture | null {
  if (!isRecord(value) || !isSafeAssetSource(value.src)) return null;
  const id = text(value.id, `custom-${index + 1}`, 80).replace(/[^a-zA-Z0-9_-]/g, "-");
  return {
    id,
    name: text(value.name, "Moble sen título"),
    description: text(value.description, "Moble engadido á composición.", 280),
    src: value.src,
    assetFile: safeAssetFile(text(value.assetFile, `${id}.svg`, 120)),
    left: number(value.left, 45, 0, 100),
    top: number(value.top, 25, 0, 100),
    height: number(value.height, 24, 4, 95),
    aspect: number(value.aspect, 1, 0.1, 8),
    layer: Math.round(number(value.layer, index + 1, 0, 100)),
  };
}

/** Normalizes untrusted CMS JSON before it is displayed by the public site. */
export function normalizeLibraryComposition(value: unknown): LibraryComposition {
  const wrapped = isRecord(value) && isRecord(value.composition);
  const root = wrapped ? value.composition : value;
  if (!isRecord(root)) return cloneLibraryComposition(DEFAULT_LIBRARY_COMPOSITION);

  const rawBackground = isRecord(root.background) ? root.background : null;
  const background: LibraryBackground = rawBackground
    ? {
        src: rawBackground.src === "" ? "" : (isSafeAssetSource(rawBackground.src) ? rawBackground.src : DEFAULT_LIBRARY_COMPOSITION.background.src),
        assetFile: safeAssetFile(text(rawBackground.assetFile, DEFAULT_LIBRARY_COMPOSITION.background.assetFile)),
      }
    : { ...DEFAULT_LIBRARY_COMPOSITION.background };

  const rawItems = Array.isArray(root.items) ? root.items : DEFAULT_LIBRARY_COMPOSITION.items;
  const uniqueIds = new Set<string>();
  const items = rawItems
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is LibraryFurniture => Boolean(item))
    .filter(item => {
      if (uniqueIds.has(item.id)) return false;
      uniqueIds.add(item.id);
      return true;
    });

  return {
    version: 1,
    background,
    items,
    shelfMappings: normalizeShelfMappings(wrapped && isRecord(value) ? value.shelfMappings : root.shelfMappings),
  };
}

export function cloneLibraryComposition(composition: LibraryComposition): LibraryComposition {
  return JSON.parse(JSON.stringify(composition)) as LibraryComposition;
}

/** Loads the committed CMS settings while retaining the approved local composition as a safe fallback. */
export async function fetchLibraryComposition(): Promise<LibraryComposition> {
  const [compositionResponse, mappingsResponse] = await Promise.all([
    fetch("/settings/library-composition.json", { cache: "no-cache" }),
    fetch("/settings/library-shelf-mappings.json", { cache: "no-cache" }),
  ]);
  if (!compositionResponse.ok) throw new Error("library-composition");
  const compositionValue = await compositionResponse.json();
  const mappingsValue = mappingsResponse.ok ? await mappingsResponse.json() : {};
  return normalizeLibraryComposition({ ...compositionValue, shelfMappings: mappingsValue.shelfMappings ?? mappingsValue.mappings });
}
