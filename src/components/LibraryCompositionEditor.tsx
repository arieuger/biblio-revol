import { SvgZoneEditor } from "./SvgZoneEditor";
import { SvgZoneOverlay } from "./SvgZoneOverlay";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  cloneLibraryComposition,
  DEFAULT_LIBRARY_COMPOSITION,
  type LibraryComposition,
  type LibraryFurniture,
  safeAssetFile,
} from "@/lib/library-composition";
import {
  downloadCompositionBlob,
  downloadCompositionText,
  libraryCompositionHtml,
  libraryCompositionJson,
  libraryCompositionZip,
} from "@/lib/library-composition-export";
import { Archive, Download, FileJson2, FileText, GripVertical, ImageUp, Layers, Maximize2, Minus, RotateCcw, Trash2, Upload, X } from "lucide-react";
import { type ChangeEvent, type PointerEvent as ReactPointerEvent, type SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";

type ShelfCodeResolver = (furnitureId: string, interactionId: string | null) => string | null;

type LibraryCompositionEditorProps = {
  composition: LibraryComposition;
  onSelectShelf: (shelfCode: string) => void;
  activeShelf: string | null;
  shelfCodeFor: ShelfCodeResolver;
  onCommittedChange?: (composition: LibraryComposition) => void;
  editorContext?: "site" | "cms";
  allowEditing?: boolean;
};

type DragState = {
  id: string;
  startX: number;
  startY: number;
  originLeft: number;
  originTop: number;
};

const stageClassName = "relative min-w-[44rem] aspect-[11/5] overflow-hidden md:min-w-0";
const primaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition-transform duration-150 hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50";
const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-primary/50 bg-card px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function compareComposition(first: LibraryComposition, second: LibraryComposition): boolean {
  return JSON.stringify(first) === JSON.stringify(second);
}

function extension(fileName: string, fallback: string): string {
  const match = fileName.match(/(\.[a-z0-9]{2,5})$/i);
  return match?.[1]?.toLocaleLowerCase() ?? fallback;
}

function inputFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file"));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("file"));
    reader.readAsDataURL(file);
  });
}

async function svgAspect(file: File): Promise<number> {
  const svg = await file.text();
  if (!/<svg[\s>]/i.test(svg)) throw new Error("svg");
  const viewBox = svg.match(/viewBox\s*=\s*["']\s*[-.\d]+\s+[-.\d]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (viewBox) {
    const width = Number(viewBox[1]);
    const height = Number(viewBox[2]);
    if (width > 0 && height > 0) return clamp(width / height, 0.1, 8);
  }
  const width = Number(svg.match(/\bwidth\s*=\s*["']([\d.]+)/i)?.[1]);
  const height = Number(svg.match(/\bheight\s*=\s*["']([\d.]+)/i)?.[1]);
  return width > 0 && height > 0 ? clamp(width / height, 0.1, 8) : 1;
}

function LabelledRange({ label, value, min, max, step, suffix = "%", onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; onChange: (value: number) => void }) {
  const inputId = `composition-${label.toLocaleLowerCase().replace(/[^a-z0-9]+/gi, "-")}`;
  return <label htmlFor={inputId} className="block text-sm font-semibold text-foreground">
    <span className="mb-1 flex items-center justify-between gap-3"><span>{label}</span><output className="font-mono text-xs font-medium text-muted-foreground">{value.toFixed(1)}{suffix}</output></span>
    <input id={inputId} type="range" min={min} max={max} step={step} value={value} onChange={event => onChange(Number(event.target.value))} className="h-2 w-full cursor-pointer accent-primary" />
  </label>;
}

export function LibraryCompositionEditor({ composition, onSelectShelf, activeShelf, shelfCodeFor, onCommittedChange, editorContext = "site", allowEditing = false }: LibraryCompositionEditorProps) {
  const [committed, setCommitted] = useState(() => cloneLibraryComposition(composition));
  const [draft, setDraft] = useState(() => cloneLibraryComposition(composition));
  const [editing, setEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(composition.items[0]?.id ?? null);
  const [zoneEditorId, setZoneEditorId] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [status, setStatus] = useState("");
  const [exportingZip, setExportingZip] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const svgInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const furnitureObjectsRef = useRef(new Map<string, HTMLObjectElement>());

  useEffect(() => {
    const next = cloneLibraryComposition(composition);
    setCommitted(next);
    if (!editing) setDraft(cloneLibraryComposition(next));
  }, [composition, editing]);

  const displayed = editing ? draft : committed;
  const selected = useMemo(() => draft.items.find(item => item.id === selectedId) ?? null, [draft.items, selectedId]);
  const hasChanges = !compareComposition(draft, committed);

  const updateDraft = (updater: (current: LibraryComposition) => LibraryComposition) => {
    setDraft(current => updater(cloneLibraryComposition(current)));
  };

  const updateFurniture = (id: string, patch: Partial<LibraryFurniture>) => {
    updateDraft(current => ({ ...current, items: current.items.map(item => item.id === id ? { ...item, ...patch } : item) }));
  };

  function applyActiveShelfMark(object: HTMLObjectElement, furnitureId: string) {
    const svgDocument = object.contentDocument;
    if (!svgDocument) return;
    ensureGenericActiveAreaStyles(svgDocument);
    svgDocument.querySelectorAll<SVGElement>("[data-id]").forEach(hitbox => {
      const shelfCode = resolveShelfCode(furnitureId, hitbox.getAttribute("data-id"));
      hitbox.classList.toggle("is-active", Boolean(activeShelf && shelfCode === activeShelf));
    });
  }

  function ensureGenericActiveAreaStyles(svgDocument: Document) {
    if (svgDocument.getElementById("library-generic-active-area-styles")) return;
    const style = svgDocument.createElementNS("http://www.w3.org/2000/svg", "style");
    style.id = "library-generic-active-area-styles";
    style.textContent = `
      [data-id].is-active,
      [data-id].is-active:hover,
      [data-id].is-active:focus {
        fill: rgba(115, 222, 158, 0.4) !important;
        stroke: #277347 !important;
        animation: library-generic-active-area-pulse 1s ease-in-out infinite !important;
        will-change: opacity;
      }
      @keyframes library-generic-active-area-pulse {
        0%, 100% { opacity: 0.72; }
        50% { opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        [data-id].is-active { animation: none !important; opacity: 1; }
      }
    `;
    svgDocument.documentElement.append(style);
  }

  function resolveShelfCode(furnitureId: string, interactionId: string | null): string | null {
    const svgArea = shelfCodeFor(furnitureId, interactionId);
    if (!svgArea) return null;
    return displayed.shelfMappings.find(mapping => mapping.svgArea.toUpperCase() === svgArea.toUpperCase())?.spreadsheetTerm ?? svgArea;
  }

  useEffect(() => {
    furnitureObjectsRef.current.forEach((object, furnitureId) => applyActiveShelfMark(object, furnitureId));
  }, [activeShelf, displayed.items, displayed.shelfMappings]);

  function bindNativeShelfInteractions(event: SyntheticEvent<HTMLObjectElement>, furnitureId: string) {
    const svgDocument = event.currentTarget.contentDocument;
    if (!svgDocument || svgDocument.documentElement.dataset.shelfBound === "true") return;
    svgDocument.documentElement.dataset.shelfBound = "true";
    ensureGenericActiveAreaStyles(svgDocument);
    svgDocument.querySelectorAll<SVGElement>("[data-id]").forEach(hitbox => hitbox.addEventListener("shelf:click", () => {
      const shelfCode = resolveShelfCode(furnitureId, hitbox.getAttribute("data-id"));
      if (shelfCode) onSelectShelf(shelfCode);
    }));
  }

  const beginEdit = () => {
    setDraft(cloneLibraryComposition(committed));
    setSelectedId(committed.items[0]?.id ?? null);
    setStatus("Modo edición activado. Arrastra un moble ou usa os controis para axustar a composición.");
    setEditing(true);
  };

  const resetComposition = () => {
    const reset = cloneLibraryComposition(DEFAULT_LIBRARY_COMPOSITION);
    if (editing) {
      setDraft(reset);
      setSelectedId(reset.items[0]?.id ?? null);
    } else {
      setCommitted(reset);
      setDraft(cloneLibraryComposition(reset));
      onCommittedChange?.(reset);
    }
    setStatus("Restableceuse a composición orixinal, cos SVG e as posicións aprobadas.");
  };

  const requestClose = () => {
    if (!hasChanges) {
      setEditing(false);
      setStatus("Edición pechada.");
      return;
    }
    setConfirmClose(true);
  };

  const confirmEdition = () => {
    const next = cloneLibraryComposition(draft);
    setCommitted(next);
    onCommittedChange?.(next);
    setConfirmClose(false);
    setEditing(false);
    setStatus(editorContext === "cms" ? "A composición actualizouse neste formulario. Garda os cambios en DecapCMS para publicala." : "A composición actualizouse nesta vista. Para publicala no sitio, gárdaa desde DecapCMS.");
  };

  const discardEdition = () => {
    setDraft(cloneLibraryComposition(committed));
    setConfirmClose(false);
    setEditing(false);
    setStatus("Descartáronse os cambios de edición.");
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>, furnitureId: string) => {
    if (!allowEditing || !editing || !stageRef.current || (event.pointerType === "mouse" && event.button !== 0)) return;
    const item = draft.items.find(candidate => candidate.id === furnitureId);
    if (!item) return;
    const rect = stageRef.current.getBoundingClientRect();
    dragRef.current = { id: furnitureId, startX: event.clientX / rect.width, startY: event.clientY / rect.height, originLeft: item.left, originTop: item.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(furnitureId);
    event.preventDefault();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!allowEditing || !editing || !drag || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    updateFurniture(drag.id, {
      left: clamp(drag.originLeft + ((event.clientX / rect.width) - drag.startX) * 100, 0, 98),
      top: clamp(drag.originTop + ((event.clientY / rect.height) - drag.startY) * 100, 0, 96),
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragRef.current = null;
  };

  const moveLayer = (direction: "back" | "front") => {
    if (!selected) return;
    const layers = draft.items.map(item => item.layer);
    const layer = direction === "front" ? Math.max(0, ...layers) + 1 : Math.min(0, ...layers) - 1;
    updateFurniture(selected.id, { layer });
  };

  const removeSelected = () => {
    if (!selected) return;
    const remaining = draft.items.filter(item => item.id !== selected.id);
    updateDraft(current => ({ ...current, items: remaining }));
    setSelectedId(remaining[0]?.id ?? null);
    setStatus(`Eliminouse «${selected.name}» da composición.`);
  };


  const handleBackground = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (!file.type.startsWith("image/")) throw new Error("background");
      const src = await inputFileToDataUrl(file);
      updateDraft(current => ({ ...current, background: { src, assetFile: safeAssetFile(file.name, `fondo${extension(file.name, ".svg")}`) } }));
      setStatus(`Actualizouse o fondo con «${file.name}».`);
    } catch {
      setStatus("Escolle un SVG, PNG, JPEG ou WebP válido para o fondo.");
    } finally {
      event.target.value = "";
    }
  };

  const removeBackground = () => {
    updateDraft(current => ({ ...current, background: { ...current.background, src: "" } }));
    setStatus("Eliminouse o fondo da composición.");
  };

  const handleSvg = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const aspect = await svgAspect(file);
      const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const src = await inputFileToDataUrl(file);
      const baseName = file.name.replace(/\.svg$/i, "");
      const assetFile = safeAssetFile(file.name, `${id}.svg`);
      const next: LibraryFurniture = {
        id,
        name: baseName || "Moble novo",
        description: `Moble engadido: ${baseName || file.name}`,
        src,
        assetFile: assetFile.endsWith(".svg") ? assetFile : `${assetFile}.svg`,
        left: 45,
        top: 25,
        height: 24,
        aspect,
        layer: Math.max(0, ...draft.items.map(item => item.layer)) + 1,
      };
      updateDraft(current => ({ ...current, items: [...current.items, next] }));
      setSelectedId(id);
      setStatus(`Engadiuse «${next.name}». Arrástrao ou axusta os seus controis.`);
    } catch {
      setStatus("Só se poden engadir ficheiros SVG válidos.");
    } finally {
      event.target.value = "";
    }
  };

  const exportJson = () => {
    downloadCompositionText("composicion-biblioteca.json", libraryCompositionJson(displayed), "application/json");
    setStatus("Descargouse a configuración JSON.");
  };

  const exportHtml = () => {
    downloadCompositionText("composicion-biblioteca.html", libraryCompositionHtml(displayed), "text/html;charset=utf-8");
    setStatus("Descargouse un HTML da composición.");
  };

  const exportZip = async () => {
    try {
      setExportingZip(true);
      downloadCompositionBlob("composicion-biblioteca.zip", await libraryCompositionZip(displayed));
      setStatus("Descargouse un ZIP portátil co fondo, os SVG e a configuración.");
    } catch {
      setStatus("Non se puido crear o ZIP. Comproba que todos os recursos da composición estean dispoñibles.");
    } finally {
      setExportingZip(false);
    }
  };

  return <section data-testid="explorer-library-scene" aria-label="Escena interactiva da Biblioteca" className="border-2 border-primary bg-card p-3 shadow-[5px_5px_0_var(--color-muted)] sm:p-4">
    {allowEditing && <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Composición da Biblioteca</p><p className="mt-0.5 text-sm font-semibold text-foreground">{editing ? "Modo edición" : "Modo visualización"}</p></div>
      {allowEditing && <div className="flex flex-wrap gap-2"><button type="button" onClick={resetComposition} className={secondaryButton}><RotateCcw size={16} /> Restablecer</button><button type="button" onClick={editing ? requestClose : beginEdit} className={primaryButton}>{editing ? <X size={17} /> : <GripVertical size={17} />}{editing ? "Pechar edición" : "Editar composición"}</button></div>}
    </div>}

    {allowEditing && editing && <div className="mt-4 grid gap-4 border-b border-border pb-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section aria-label="Ferramentas de fondo e elementos" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <div className="rounded-md border border-border bg-secondary/35 p-3"><h3 className="text-sm font-bold">Fondo</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Podes substituílo por un SVG, PNG, JPEG ou WebP, ou deixalo baleiro.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => backgroundInputRef.current?.click()} className={secondaryButton}><ImageUp size={16} /> Subir fondo</button><button type="button" onClick={removeBackground} className={secondaryButton}><Minus size={16} /> Eliminar fondo</button></div></div>
        <div className="rounded-md border border-border bg-secondary/35 p-3"><h3 className="text-sm font-bold">Mobiliario</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Engade SVG propios; quedarán na configuración e nas exportacións.</p><button type="button" onClick={() => svgInputRef.current?.click()} className={`mt-3 ${secondaryButton}`}><Upload size={16} /> Engadir SVG</button></div>
        <input ref={backgroundInputRef} type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg,.png,.jpg,.jpeg,.webp" className="sr-only" onChange={handleBackground} />
        <input ref={svgInputRef} type="file" accept="image/svg+xml,.svg" className="sr-only" onChange={handleSvg} />
      </section>

      <section aria-label="Propiedades do moble seleccionado" className="rounded-md border border-border bg-card p-3">
        {selected ? <><div className="mb-3 flex items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Elemento seleccionado</p><label className="mt-1 block text-sm font-semibold">Nome do moble<input className="mt-1 w-full rounded border border-input p-2" value={selected.name} onChange={event => updateFurniture(selected.id, { name: event.target.value })} /></label></div><Layers size={18} className="shrink-0 text-primary" /></div><div className="space-y-3"><LabelledRange label="Posición horizontal" value={selected.left} min={0} max={98} step={0.1} onChange={left => updateFurniture(selected.id, { left })} /><LabelledRange label="Posición vertical" value={selected.top} min={0} max={96} step={0.1} onChange={top => updateFurniture(selected.id, { top })} /><LabelledRange label="Tamaño" value={selected.height} min={4} max={95} step={0.1} onChange={height => updateFurniture(selected.id, { height })} /></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => moveLayer("back")} className={secondaryButton}><Layers size={15} /> Enviar atrás</button><button type="button" onClick={() => moveLayer("front")} className={secondaryButton}><Layers size={15} /> Traer adiante</button><button type="button" onClick={() => setZoneEditorId(selected.id)} className={`col-span-2 ${primaryButton}`}>Debuxar e nomear zonas</button><button type="button" onClick={removeSelected} className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-destructive/50 px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"><Trash2 size={16} /> Eliminar</button></div></> : <div className="flex min-h-52 flex-col items-center justify-center text-center"><Maximize2 className="text-muted-foreground" size={22} /><h3 className="mt-2 text-sm font-bold">Non hai ningún moble seleccionado</h3><p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Preme nun moble da composición ou engade un SVG novo.</p></div>}
      </section>
    </div>}


    <div className="mt-4 overflow-x-auto" aria-label="Recreación interactiva da Biblioteca como plano continuo de dúas paredes">
      <div ref={stageRef} className={`${stageClassName} ${editing ? "touch-none" : ""}`} style={{ backgroundImage: displayed.background.src ? `url("${displayed.background.src}")` : undefined, backgroundSize: "100% 100%", backgroundPosition: "center bottom", backgroundRepeat: "no-repeat", backgroundColor: "#eef8f2" }} onPointerMove={handlePointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        {displayed.items.map(item => <div key={item.id} data-explorer-furniture={item.id} className={`absolute origin-bottom drop-shadow-[2px_8px_5px_rgba(17,22,19,0.2)] ${allowEditing && editing ? "cursor-move touch-none" : ""} ${allowEditing && editing && selectedId === item.id ? "outline outline-2 outline-offset-2 outline-primary" : ""}`} style={{ left: `${item.left}%`, top: `${item.top}%`, height: `${item.height}%`, aspectRatio: String(item.aspect), zIndex: item.layer }} onPointerDown={event => handlePointerDown(event, item.id)} onKeyDown={event => { if (allowEditing && editing && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); setSelectedId(item.id); } }} role={allowEditing && editing ? "button" : undefined} tabIndex={allowEditing && editing ? 0 : undefined} aria-label={allowEditing && editing ? `Editar ${item.name}` : item.name}>
          <object ref={node => { if (node) furnitureObjectsRef.current.set(item.id, node); else furnitureObjectsRef.current.delete(item.id); }} data={item.src} type="image/svg+xml" aria-label={item.name} onLoad={event => { bindNativeShelfInteractions(event, item.id); applyActiveShelfMark(event.currentTarget, item.id); }} className={`block h-full w-full ${editing ? "pointer-events-none" : ""}`}>{item.name}</object>
          {!editing && <SvgZoneOverlay src={item.src} isActive={id => Boolean(activeShelf && resolveShelfCode(item.id, id) === activeShelf)} onSelect={id => { const shelf = resolveShelfCode(item.id, id); if (shelf) onSelectShelf(shelf); }} />}
          {allowEditing && editing && <span className="pointer-events-none absolute left-1/2 top-0 max-w-[12rem] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">{item.name}</span>}
        </div>)}
      </div>
    </div>

    {allowEditing && <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-2"><button type="button" onClick={exportJson} className={secondaryButton}><FileJson2 size={16} /> Exportar JSON</button><button type="button" onClick={exportHtml} className={secondaryButton}><FileText size={16} /> Exportar HTML</button><button type="button" onClick={exportZip} disabled={exportingZip} className={secondaryButton}>{exportingZip ? <Download className="animate-pulse" size={16} /> : <Archive size={16} />} {exportingZip ? "Preparando ZIP…" : "Exportar ZIP"}</button></div><p className="max-w-md text-xs leading-5 text-muted-foreground">{editorContext === "cms" ? "Ao pechar a edición, DecapCMS recibirá a configuración. Preme «Publicar» no CMS para gardala no repositorio e despregala." : "A edición só está dispoñible desde DecapCMS."}</p></div>}
    {allowEditing && status && <p role="status" className="mt-3 border-l-4 border-primary bg-secondary/60 px-3 py-2 text-sm text-foreground">{status}</p>}

    {allowEditing && editing && zoneEditorId && draft.items.find(item => item.id === zoneEditorId) && <SvgZoneEditor key={zoneEditorId} item={draft.items.find(item => item.id === zoneEditorId)!} onClose={() => setZoneEditorId(null)} onSave={src => {
      updateFurniture(zoneEditorId, { src, assetFile: `${zoneEditorId}.svg` });
      setStatus("Zonas actualizadas no borrador. Pecha a edición, aplica os cambios e publica en Decap. Despois abre a táboa de correspondencias.");
    }} />}
    <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}><AlertDialogContent className="border-2 border-primary bg-card shadow-[6px_6px_0_var(--color-muted)]"><AlertDialogHeader><AlertDialogTitle>Aplicar os cambios da composición?</AlertDialogTitle><AlertDialogDescription>{editorContext === "cms" ? "Aplicaranse ao formulario de DecapCMS. A publicación definitiva faise co botón «Publicar»." : "Aplicaranse á vista actual. Para levalos á web publicada terás que gardar a composición en DecapCMS."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={discardEdition}>Descartar cambios</AlertDialogCancel><AlertDialogAction onClick={confirmEdition}>Aplicar cambios</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
