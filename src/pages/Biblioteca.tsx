import { catalogFetch } from "@/lib/catalog-api";
import SEO from "@/components/SEO";
import { LibraryCompositionEditor } from "@/components/LibraryCompositionEditor";
import { displayBookTitle, explorerShelfAreaName, splitBibliographicTags, type BibliotecaBook, type BibliotecaFilterOptions, type BibliotecaSearchResponse } from "@shared/biblioteca";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_LIBRARY_COMPOSITION, fetchLibraryComposition, type LibraryComposition } from "@/lib/library-composition";
import { ArrowDownAZ, Binoculars, BookOpen, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp, CircleAlert, Info, LoaderCircle, Search, SlidersHorizontal, Sparkles, X, ZoomIn } from "lucide-react";
import { Fragment, FormEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type WheelEvent as ReactWheelEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";

const EMPTY_FILTERS: BibliotecaFilterOptions = {
  tematicas: [],
  idiomas: [],
  formatos: [],
  soportes: [],
  limitesPaxinas: { min: null, max: null },
  actualizadaEn: null,
};

const MONTHS_IN_GALICIAN = ["xaneiro", "febreiro", "marzo", "abril", "maio", "xuño", "xullo", "agosto", "setembro", "outubro", "novembro", "decembro"] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDate(date: string | null): string | null {
  if (!date) return null;
  if (/^\d{4}$/.test(date)) return date;
  const [year, month] = date.split("-").map(Number);
  if (!year || !month || month > 12) return null;
  const monthName = MONTHS_IN_GALICIAN[month - 1]!;
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} de ${year}`;
}

export function parseMonthYearInput(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\s*\/\s*(\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]);
  return month >= 1 && month <= 12 ? `${match[2]}-${String(month).padStart(2, "0")}` : null;
}

export function updatePageRangeBoundary(boundary: "minimum" | "maximum", proposedValue: number, currentRange: [number, number], catalogMaximum: number): [number, number] {
  const maximum = Math.max(1, catalogMaximum);
  const value = Math.max(1, Math.min(maximum, Math.round(proposedValue)));
  return boundary === "minimum" ? [Math.min(value, currentRange[1]), currentRange[1]] : [currentRange[0], Math.max(value, currentRange[0])];
}

export function constrainSliderPageRange(nextValues: number[], currentRange: [number, number], catalogMaximum: number, activeThumb: 0 | 1 | null): [number, number] {
  const [first = 1, second = Math.max(1, catalogMaximum)] = nextValues;
  if (activeThumb === 0) {
    const proposedMinimum = first === currentRange[1] && second !== currentRange[1] ? second : first;
    return updatePageRangeBoundary("minimum", proposedMinimum, currentRange, catalogMaximum);
  }
  if (activeThumb === 1) {
    const proposedMaximum = second === currentRange[0] && first !== currentRange[0] ? first : second;
    return updatePageRangeBoundary("maximum", proposedMaximum, currentRange, catalogMaximum);
  }
  return [Math.min(first, second), Math.max(first, second)];
}

function monthLabel(monthIndex: number): string {
  const month = MONTHS_IN_GALICIAN[monthIndex] ?? "";
  return `${month.charAt(0).toUpperCase()}${month.slice(1)}`;
}

function SearchHelp() {
  return <Popover>
    <PopoverTrigger asChild>
      <button type="button" aria-label="Axuda sobre a sintaxe de busca" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Info size={20} strokeWidth={2.25} /></button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] border-2 border-primary bg-card p-4 text-sm leading-6 shadow-[4px_4px_0_var(--color-muted)]">
      Emprega comiñas para unha frase exacta e <strong>AND</strong>, <strong>OR</strong> ou <strong>NOT</strong> para combinar termos. Para buscar nun campo concreto: <code className="bg-secondary px-1">titulo:</code>, <code className="bg-secondary px-1">autoria:</code>, <code className="bg-secondary px-1">direccion:</code>, <code className="bg-secondary px-1">producion:</code>, <code className="bg-secondary px-1">guion:</code>, <code className="bg-secondary px-1">reparto:</code>, <code className="bg-secondary px-1">musica:</code>, <code className="bg-secondary px-1">fotografia:</code>, <code className="bg-secondary px-1">editorial:</code>, <code className="bg-secondary px-1">coleccion:</code>, <code className="bg-secondary px-1">volume:</code>, <code className="bg-secondary px-1">numero:</code>, <code className="bg-secondary px-1">discografica:</code>, <code className="bg-secondary px-1">estudio:</code> ou <code className="bg-secondary px-1">sinopse:</code>.
    </PopoverContent>
  </Popover>;
}

export function LibraryUsageButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return <button type="button" onClick={onClick} aria-haspopup="dialog" className={`inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition-transform duration-150 hover:bg-primary/90 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4 ${className}`}><Sparkles aria-hidden="true" data-testid="usage-sparkles-icon" size={18} strokeWidth={2.3} /> Como usarme</button>;
}

export type LibraryMode = "initial" | "catalog" | "explorer";

const EXPLORER_SPECIAL_SHELF_CODES: Record<string, string> = {
  woodenDisplay: "EL",
  magazineRack: "ER",
  blueShelf: "Z",
  circularUnit: "C",
};

export function explorerShelfCode(furnitureId: string, interactionId: string | null): string | null {
  return EXPLORER_SPECIAL_SHELF_CODES[furnitureId] ?? (interactionId?.trim() || null);
}

export function shouldFetchExplorerResults(mode: LibraryMode, shelfCode: string | null): boolean {
  return mode !== "initial" && (mode !== "explorer" || Boolean(shelfCode));
}

export function shouldShowExplorerClearFilter(mode: LibraryMode, shelfCode: string | null): boolean {
  return mode === "explorer" && Boolean(shelfCode);
}

export function explorerShelfLabel(shelfCode: string | null, correspondences?: LibraryComposition["shelfMappings"]): string | null {
  return shelfCode ? explorerShelfAreaName(shelfCode, correspondences) : null;
}

export const EXPLORER_EMPTY_STATE_TEXT_CLASS = "mx-auto mt-2 max-w-md text-muted-foreground";

export function emptyResultsDescription(mode: LibraryMode, shelfCode: string | null): string {
  return mode === "explorer" && Boolean(shelfCode)
    ? "Segue explorando o mobiliario da biblioteca. Procura noutro estante."
    : "Proba a empregar menos termos, cambiar os filtros ou buscar con palabras relacionadas.";
}

export function LibraryModeSwitcher({ activeMode, onSelectCatalog, onSelectExplorer, catalogContent, explorerContent }: { activeMode: LibraryMode; onSelectCatalog: (fromInitial: boolean) => void; onSelectExplorer: (fromInitial: boolean) => void; catalogContent: ReactNode; explorerContent: ReactNode }) {
  const catalogActive = activeMode === "catalog";
  const explorerActive = activeMode === "explorer";
  const compactMode = catalogActive || explorerActive;
  const columns = catalogActive ? "minmax(0, 1fr) 2.75rem" : explorerActive ? "2.75rem minmax(0, 1fr)" : "minmax(0, 1fr) minmax(0, 1fr)";
  const activePanelClass = "biblioteca-mode-panel min-w-0";

  return <section aria-label="Modos de consulta da Biblioteca" className="isolate grid transition-[grid-template-columns,gap] duration-350 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" style={{ gridTemplateColumns: columns, gap: compactMode ? "0.5rem" : "0.75rem" }}>
    {explorerActive ? <button type="button" onClick={() => onSelectCatalog(false)} aria-label="Abrir Modo catálogo" className="flex min-h-28 items-center justify-center rounded-md bg-primary px-2 text-center font-display font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span className="whitespace-nowrap -rotate-90 text-sm sm:text-base">Ir a catálogo</span></button> : <div className={`min-w-0 ${catalogActive ? "" : "rounded-md bg-primary text-primary-foreground"}`}>
      {catalogActive ? <div className={activePanelClass}>{catalogContent}</div> : <button type="button" data-library-initial-mode="true" onClick={() => onSelectCatalog(true)} className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-md px-4 text-center font-display text-xl font-bold transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:min-h-72 sm:flex-row sm:gap-3"><BookOpen aria-hidden="true" size={30} strokeWidth={2.15} /><span className="w-full sm:w-auto">Modo catálogo</span></button>}</div>}
    {catalogActive ? <button type="button" onClick={() => onSelectExplorer(false)} aria-label="Abrir Modo explorador" className="flex min-h-28 items-center justify-center rounded-md bg-primary px-2 text-center font-display font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span className="whitespace-nowrap rotate-90 text-sm sm:text-base">Ir a explorador</span></button> : <div className={`min-w-0 ${explorerActive ? "" : "rounded-md bg-primary text-primary-foreground"}`}>
      {explorerActive ? <div className={activePanelClass}>{explorerContent}</div> : <button type="button" data-library-initial-mode="true" onClick={() => onSelectExplorer(true)} className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-md px-4 text-center font-display text-xl font-bold transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:min-h-72 sm:flex-row sm:gap-3"><Binoculars aria-hidden="true" size={30} strokeWidth={2.15} /><span className="w-full sm:w-auto">Modo explorador</span></button>}</div>}
  </section>;
}

function LibraryPagination({ page, totalPages, onPageChange, className = "" }: { page: number; totalPages: number; onPageChange: (nextPage: number) => void; className?: string }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paxinación de resultados" className={`flex shrink-0 items-center justify-center gap-1.5 sm:gap-2 ${className}`}>
      <button type="button" disabled={page === 1} onClick={() => onPageChange(Math.max(1, page - 1))} aria-label="Páxina anterior" className="inline-flex h-9 items-center gap-1 rounded-md border border-primary px-2 text-sm font-bold transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3">
        <ChevronLeft size={17} /> <span className="hidden sm:inline">Anterior</span>
      </button>
      <span className="min-w-20 whitespace-nowrap px-1 text-center text-sm font-medium text-muted-foreground sm:min-w-24">Páxina {page} de {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))} aria-label="Páxina seguinte" className="inline-flex h-9 items-center gap-1 rounded-md border border-primary px-2 text-sm font-bold transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40 sm:px-3">
        <span className="hidden sm:inline">Seguinte</span> <ChevronRight size={17} />
      </button>
    </nav>
  );
}

export function recommendationBookHref(book: Pick<BibliotecaBook, "id" | "slug">): string {
  const identifier = book.slug?.trim() || book.id;
  return `/biblioteca/${encodeURIComponent(identifier)}?modo=explorador`;
}

export function recommendationDragScrollTop(startScrollTop: number, startY: number, currentY: number): number {
  return startScrollTop - (currentY - startY);
}

export function recommendationCanStartDrag(targetIsLink: boolean): boolean {
  return !targetIsLink;
}

const RECOMMENDATION_LOOP_BUFFER_SIZE = 4;

export function recommendationLoopItems(recommendations: BibliotecaBook[]): { before: BibliotecaBook[]; main: BibliotecaBook[]; after: BibliotecaBook[] } {
  const bufferSize = Math.min(RECOMMENDATION_LOOP_BUFFER_SIZE, recommendations.length);
  return {
    before: recommendations.slice(-bufferSize),
    main: recommendations,
    after: recommendations.slice(0, bufferSize),
  };
}

export function wrapRecommendationScrollTop(currentScrollTop: number, beforeHeight: number, mainHeight: number, maximumScroll: number): number {
  if (mainHeight <= 0) return currentScrollTop;
  if (currentScrollTop <= 0) return currentScrollTop + mainHeight;
  if (currentScrollTop >= maximumScroll) return currentScrollTop - mainHeight;
  return currentScrollTop;
}

export function recommendationWheelWrapTop(currentScrollTop: number, deltaY: number, mainHeight: number, maximumScroll: number): number {
  if (mainHeight <= 0) return currentScrollTop;
  if (deltaY < 0 && currentScrollTop <= 1) return currentScrollTop + mainHeight;
  if (deltaY > 0 && currentScrollTop >= maximumScroll - 1) return currentScrollTop - mainHeight;
  return currentScrollTop;
}

function RecommendationCard({ book, className = "", coverClassName = "" }: { book: BibliotecaBook; className?: string; coverClassName?: string }) {
  const title = displayBookTitle(book);
  return <Link href={recommendationBookHref(book)} draggable={false} className={`group flex h-full min-w-0 flex-col items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${className}`} aria-label={`Abrir a ficha de ${title}`}>
    <div className={`aspect-[3/4] w-full shrink-0 max-w-[8.25rem] overflow-hidden border border-border bg-secondary shadow-sm ${coverClassName}`}>
      {book.portada ? <img src={book.portada} alt={`Portada de ${title}`} loading="lazy" draggable={false} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-muted-foreground"><BookOpen aria-hidden="true" size={26} /></div>}
    </div>
    <span className="mt-2 block w-full shrink-0 max-w-[13rem] line-clamp-2 text-center font-display text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{title}</span>
  </Link>;
}

export function ExplorerSidePanel({ recommendations = [], loading = false, title = "Recomendacións", testId = "explorer-side-panel" }: { recommendations?: BibliotecaBook[]; loading?: boolean; title?: string; testId?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const beforeBufferRef = useRef<HTMLDivElement>(null);
  const mainListRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef({ pointerId: -1, startY: 0, startScrollTop: 0, moved: false });
  const loopItems = useMemo(() => recommendationLoopItems(recommendations), [recommendations]);

  const loopAtBoundary = (element: HTMLDivElement) => {
    const beforeHeight = beforeBufferRef.current?.offsetHeight ?? 0;
    const mainHeight = mainListRef.current?.offsetHeight ?? 0;
    const maximumScroll = Math.max(0, element.scrollHeight - element.clientHeight);
    const wrappedScrollTop = wrapRecommendationScrollTop(element.scrollTop, beforeHeight, mainHeight, maximumScroll);
    if (wrappedScrollTop !== element.scrollTop) element.scrollTop = wrappedScrollTop;
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const mainHeight = mainListRef.current?.offsetHeight ?? 0;
    const maximumScroll = Math.max(0, element.scrollHeight - element.clientHeight);
    const wrappedScrollTop = recommendationWheelWrapTop(element.scrollTop, event.deltaY, mainHeight, maximumScroll);
    if (wrappedScrollTop !== element.scrollTop) element.scrollTop = wrappedScrollTop;
  };

  useEffect(() => {
    const element = scrollRef.current;
    const beforeHeight = beforeBufferRef.current?.offsetHeight ?? 0;
    if (element && beforeHeight > 0) element.scrollTop = beforeHeight;
  }, [recommendations]);

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const targetIsLink = event.target instanceof Element && Boolean(event.target.closest("a"));
    if (!recommendationCanStartDrag(targetIsLink)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = { pointerId: event.pointerId, startY: event.clientY, startScrollTop: event.currentTarget.scrollTop, moved: false };
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current.pointerId !== event.pointerId) return;
    const distance = event.clientY - draggingRef.current.startY;
    if (Math.abs(distance) <= 3) return;
    draggingRef.current.moved = true;
    event.preventDefault();
    event.currentTarget.scrollTop = recommendationDragScrollTop(draggingRef.current.startScrollTop, draggingRef.current.startY, event.clientY);
    loopAtBoundary(event.currentTarget);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (draggingRef.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    draggingRef.current.pointerId = -1;
  };

  return <aside aria-label={`${title} da Biblioteca`} data-testid={testId} className="hidden self-start border-2 border-primary bg-card p-4 shadow-[4px_4px_0_var(--color-muted)] lg:block">
    <div className="border-b-2 border-primary pb-4"><h2 className="font-display text-xl font-bold">{title}</h2></div>
    {loading && <div className="flex h-[35rem] items-center justify-center text-muted-foreground"><LoaderCircle className="animate-spin" aria-label={`Cargando ${title.toLowerCase()}`} /></div>}
    {!loading && recommendations.length > 0 && <div ref={scrollRef} tabIndex={0} role="region" aria-label={`${title} en desprazamento vertical continuo`} onScroll={event => loopAtBoundary(event.currentTarget)} onWheel={handleWheel} onDragStartCapture={event => event.preventDefault()} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} className="mt-4 h-[35rem] cursor-grab overflow-y-auto overscroll-y-contain scrollbar-hide touch-pan-y select-none active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><div ref={beforeBufferRef}>{loopItems.before.map((book, index) => <div key={`before-${book.id}-${index}`} className="mb-3 flex min-h-[10.5rem] justify-center"><RecommendationCard book={book} className="w-full max-w-[13rem]" coverClassName="max-w-[5.5rem]" /></div>)}</div><div ref={mainListRef}>{loopItems.main.map(book => <div key={book.id} className="mb-3 flex min-h-[10.5rem] justify-center"><RecommendationCard book={book} className="w-full max-w-[13rem]" coverClassName="max-w-[5.5rem]" /></div>)}</div><div>{loopItems.after.map((book, index) => <div key={`after-${book.id}-${index}`} className="mb-3 flex min-h-[10.5rem] justify-center"><RecommendationCard book={book} className="w-full max-w-[13rem]" coverClassName="max-w-[5.5rem]" /></div>)}</div></div>}
  </aside>;
}

export function ExplorerMobileRecommendations({ recommendations = [], loading = false, title = "Recomendacións", testId = "explorer-mobile-recommendations" }: { recommendations?: BibliotecaBook[]; loading?: boolean; title?: string; testId?: string }) {
  return <section aria-label={`${title} da Biblioteca`} data-testid={testId} className="border-t-2 border-primary pt-6">
    <h2 className="font-display text-2xl font-bold">{title}</h2>
    {loading && <div className="flex h-48 items-center justify-center text-muted-foreground"><LoaderCircle className="animate-spin" aria-label={`Cargando ${title.toLowerCase()}`} /></div>}
    {!loading && recommendations.length > 0 && <Carousel opts={{ loop: true, align: "start" }} className="mt-4 overflow-hidden" aria-label={`${title} en desprazamento horizontal continuo`}><CarouselContent className="-ml-3">{recommendations.map(book => <CarouselItem key={book.id} className="basis-[58%] pl-3 sm:basis-[34%]"><RecommendationCard book={book} className="pb-5" /></CarouselItem>)}</CarouselContent></Carousel>}
  </section>;
}

export function ExplorerLibraryScene({ onSelectShelf, activeShelf, composition = DEFAULT_LIBRARY_COMPOSITION, onCompositionChange }: { onSelectShelf: (shelfCode: string) => void; activeShelf: string | null; composition?: LibraryComposition; onCompositionChange?: (composition: LibraryComposition) => void }) {
  return <LibraryCompositionEditor composition={composition} activeShelf={activeShelf} onSelectShelf={onSelectShelf} shelfCodeFor={explorerShelfCode} onCommittedChange={onCompositionChange} />;
}

function MonthYearControl({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  const currentYear = Number(value.match(/^\d{1,2}\s*\/\s*(\d{4})$/)?.[1]) || new Date().getFullYear();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(currentYear);

  useEffect(() => { if (!open) setYear(currentYear); }, [currentYear, open]);

  return <div className="text-sm">
    <label htmlFor={id} className="mb-1 block text-muted-foreground">{label}</label>
    <div className="relative">
      <input id={id} inputMode="text" placeholder="MM/AAAA" value={value} onChange={event => onChange(event.target.value)} className="w-full border border-input bg-card px-2 py-2 pr-9 text-sm" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={`Escoller manualmente o mes e o ano de ${label.toLowerCase()}`} className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-primary transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><CalendarDays size={15} /></button>
        </PopoverTrigger>
        <PopoverContent align="end" className="z-[70] w-[19rem] border-2 border-primary bg-card p-4 shadow-[4px_4px_0_var(--color-muted)]">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setYear(current => current - 10)} aria-label="Dez anos anteriores" className="flex h-7 w-7 items-center justify-center text-primary hover:bg-secondary"><ChevronsLeft size={18} strokeWidth={2.5} /></button>
              <button type="button" onClick={() => setYear(current => current - 1)} aria-label="Ano anterior" className="flex h-7 w-7 items-center justify-center text-primary hover:bg-secondary"><ChevronLeft size={20} /></button>
            </div>
            <strong className="font-display text-lg">{year}</strong>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setYear(current => current + 1)} aria-label="Ano seguinte" className="flex h-7 w-7 items-center justify-center text-primary hover:bg-secondary"><ChevronRight size={20} /></button>
              <button type="button" onClick={() => setYear(current => current + 10)} aria-label="Dez anos seguintes" className="flex h-7 w-7 items-center justify-center text-primary hover:bg-secondary"><ChevronsRight size={18} strokeWidth={2.5} /></button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS_IN_GALICIAN.map((_, index) => <button key={index} type="button" onClick={() => { onChange(`${String(index + 1).padStart(2, "0")}/${year}`); setOpen(false); }} className="border border-border px-2 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{monthLabel(index)}</button>)}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  </div>;
}

export function formatSyncDate(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getUTCDate()} de ${MONTHS_IN_GALICIAN[parsed.getUTCMonth()]} de ${parsed.getUTCFullYear()}, ás ${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}`;
}

function CheckGroup({
  title,
  items,
  selected,
  onChange,
}: {
  title: string;
  items: string[];
  selected: string[];
  onChange: (item: string) => void;
}) {
  if (!items.length) return null;
  return (
    <fieldset className="border-t border-border pt-5">
      <legend className="ml-1 bg-card px-2 font-display text-lg font-bold">{title}</legend>
      <div className="mt-2 space-y-0.5">
        {items.map(item => {
          const id = `${title}-${item}`.replace(/[^a-zA-Z0-9]/g, "-");
          return (
            <label key={item} htmlFor={id} className="group flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-sm leading-4 transition-colors hover:bg-secondary/70">
              <input id={id} type="checkbox" checked={selected.includes(item)} onChange={() => onChange(item)} className="peer sr-only" />
              <span aria-hidden="true" className="flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center border border-primary/40 bg-card text-primary-foreground transition-colors peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"><Check size={13} strokeWidth={3} className="opacity-0 transition-opacity peer-checked:opacity-100" /></span>
              <span className="transition-colors peer-checked:font-medium peer-checked:text-primary">{item}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function AvailabilityBadge({ copies }: { copies: number | null }) {
  if (copies === null) return null;
  const available = copies > 0;
  return <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-xs font-semibold ${available ? "border-emerald-700/30 bg-emerald-700/10 text-emerald-900" : "border-red-700/30 bg-red-700/10 text-red-900"}`}><span aria-hidden="true" className={`h-2 w-2 rounded-full ${available ? "bg-emerald-600" : "bg-red-600"}`} />{available ? "Dispoñible" : "Non dispoñible"}</span>;
}

type CatalogFilterKey = "autoria" | "direccion" | "producion" | "guion" | "reparto" | "musica" | "fotografia" | "editorial" | "coleccion" | "discografica" | "estudio" | "tematica" | "idioma";
type CatalogEntityFilterKey = Exclude<CatalogFilterKey, "tematica" | "idioma">;

export function catalogFilterHref(filter: CatalogFilterKey, value: string): string {
  return `/biblioteca?${filter}=${encodeURIComponent(value)}`;
}

function TagFilterLinks({ value, filter, className = "" }: { value: string | null; filter: CatalogEntityFilterKey; className?: string }) {
  const labels = splitBibliographicTags(value);
  if (!labels.length) return null;
  return <span className={className}>{labels.map((label, index) => <span key={label} className="break-words">{index > 0 && <span className="text-muted-foreground">, </span>}<Link href={catalogFilterHref(filter, label)} className="break-words font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{label}</Link></span>)}</span>;
}

type BibliographicMetaKey = "editorial" | "coleccion" | "data" | "paxinas";

export function catalogMetadataGroups(present: Record<BibliographicMetaKey, boolean>): BibliographicMetaKey[][] {
  return ([["editorial", "coleccion"], ["data", "paxinas"]] as BibliographicMetaKey[][]).map(group => group.filter(key => present[key]));
}

export function shouldHideMobileMetadataSeparator(previousLastTop: number | null, nextFirstTop: number | null): boolean {
  return previousLastTop !== null && nextFirstTop !== null && nextFirstTop > previousLastTop + 2;
}

export function formatDurationInMinutes(value: string | null): string | null {
  const duration = value?.trim();
  if (!duration) return null;
  const numericDuration = duration.replace(/\s*(?:min|mins|minutos)\b/gi, "").trim();
  return numericDuration ? `${numericDuration} minutos` : null;
}

function normalizedFormat(value: string | null): string {
  return value?.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase() ?? "";
}

function mediaResultPresentation(book: BibliotecaBook): { person: ReactNode | null; values: ReactNode[] } | null {
  const format = normalizedFormat(book.formato);
  if (format === "filme" || format === "documental") return { person: book.direccion ? <TagFilterLinks value={book.direccion} filter="direccion" /> : null, values: [book.producion ? <TagFilterLinks value={book.producion} filter="producion" /> : null, formatDate(book.dataPublicacion), formatDurationInMinutes(book.duracion)] };
  if (format === "musica") return { person: book.autoria ? <TagFilterLinks value={book.autoria} filter="autoria" /> : null, values: [book.discografica ? <TagFilterLinks value={book.discografica} filter="discografica" /> : null, formatDate(book.dataPublicacion), formatDurationInMinutes(book.duracion)] };
  return null;
}

export function BookCard({ book, onViewCover, mode, shelfCode }: { book: BibliotecaBook; onViewCover: (book: BibliotecaBook) => void; mode: Exclude<LibraryMode, "initial">; shelfCode: string | null }) {
  const [coverUnavailable, setCoverUnavailable] = useState(false);
  const mobileMetadataRef = useRef<HTMLDivElement>(null);
  const date = formatDate(book.dataPublicacion);
  const title = displayBookTitle(book);
  const publicIdentifier = book.slug || book.id;
  const mediaPresentation = mediaResultPresentation(book);
  const personValue = mediaPresentation ? mediaPresentation.person : book.autoria ? <TagFilterLinks value={book.autoria} filter="autoria" /> : null;
  const bibliographicMeta: Record<BibliographicMetaKey, ReactNode | null> = {
    editorial: book.editorial ? <TagFilterLinks value={book.editorial} filter="editorial" /> : null,
    coleccion: book.coleccion ? <TagFilterLinks value={book.coleccion} filter="coleccion" /> : null,
    data: date,
    paxinas: book.numeroPaxinas ? `${book.numeroPaxinas} páxinas` : null,
  };
  const bibliographicGroups = catalogMetadataGroups({ editorial: Boolean(book.editorial), coleccion: Boolean(book.coleccion), data: Boolean(date), paxinas: Boolean(book.numeroPaxinas) }).filter(group => group.length > 0);
  const bibliographicLine = bibliographicGroups.flat();
  useEffect(() => {
    const container = mobileMetadataRef.current;
    if (!container) return;
    let frame = 0;
    const updateSeparators = () => {
      const separators = Array.from(container.querySelectorAll<HTMLElement>("[data-mobile-metadata-separator]"));
      separators.forEach(separator => {
        separator.style.visibility = "";
        const glyph = separator.querySelector<HTMLElement>("[data-mobile-metadata-separator-glyph]");
        const trailingSpace = separator.querySelector<HTMLElement>("[data-mobile-metadata-separator-trailing-space]");
        if (glyph) glyph.style.display = "";
        if (trailingSpace) trailingSpace.style.display = "";
        const nextValue = container.querySelector<HTMLElement>(`[data-mobile-metadata-value="${separator.dataset.mobileMetadataNext}"]`);
        if (nextValue) {
          nextValue.style.display = "";
          nextValue.style.maxWidth = "";
        }
      });
      const measureSeparators = () => {
        let changed = false;
        separators.forEach(separator => {
          const previousValue = container.querySelector<HTMLElement>(`[data-mobile-metadata-value="${separator.dataset.mobileMetadataPrevious}"]`);
          const previousLastRect = previousValue ? Array.from(previousValue.getClientRects()).at(-1) : null;
          const nextValue = container.querySelector<HTMLElement>(`[data-mobile-metadata-value="${separator.dataset.mobileMetadataNext}"]`);
          const nextFirstRect = nextValue ? Array.from(nextValue.getClientRects())[0] : null;
          const glyph = separator.querySelector<HTMLElement>("[data-mobile-metadata-separator-glyph]");
          const entityWrapped = shouldHideMobileMetadataSeparator(previousLastRect?.top ?? null, nextFirstRect?.top ?? null);
          if (entityWrapped && glyph?.style.display !== "none") {
            // The separator has already forced the next entity onto a new line.
            // Remove the separator glyph and its trailing space so the next
            // entity keeps the line break without inheriting an indentation.
            const trailingSpace = separator.querySelector<HTMLElement>("[data-mobile-metadata-separator-trailing-space]");
            if (glyph) glyph.style.display = "none";
            if (trailingSpace) trailingSpace.style.display = "none";
            changed = true;
          } else if (glyph?.style.display === "none" && nextValue && previousLastRect && nextFirstRect && nextFirstRect.top <= previousLastRect.top + 2 && nextValue.style.display !== "inline-block") {
            // Removing the separator must not let only the beginning of the
            // next entity move up (for example, "181" without "páxinas").
            nextValue.style.display = "inline-block";
            nextValue.style.maxWidth = "100%";
            changed = true;
          }
        });
        if (changed) frame = window.requestAnimationFrame(measureSeparators);
      };
      frame = window.requestAnimationFrame(measureSeparators);
    };
    updateSeparators();
    window.addEventListener("resize", updateSeparators);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateSeparators);
    };
  }, [book.autoria, book.direccion, book.editorial, book.coleccion, book.dataPublicacion, book.numeroPaxinas, book.producion, book.duracion, book.discografica, book.formato]);
  return (
    <article className="group grid grid-cols-[5.75rem_minmax(0,1fr)] gap-4 border-b-2 border-border py-6 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-border bg-secondary shadow-sm">
        {book.portada && !coverUnavailable ? (
          <button type="button" onClick={() => onViewCover(book)} aria-label={`Ampliar a portada de ${title}`} className="group/cover relative h-full w-full cursor-zoom-in overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><img src={book.portada} alt={`Portada de ${title}`} loading="lazy" onError={() => setCoverUnavailable(true)} className="h-full w-full object-cover transition-transform duration-200 group-hover/cover:scale-[1.04]" /><span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition-colors group-hover/cover:bg-black/15"><ZoomIn aria-hidden="true" size={24} className="opacity-0 drop-shadow-md transition-opacity group-hover/cover:opacity-100" /></span></button>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center text-muted-foreground">
            <BookOpen aria-hidden="true" size={25} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Sen portada</span>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="font-display text-xl font-bold leading-tight sm:text-2xl"><Link href={`/biblioteca/${publicIdentifier}?modo=${mode === "explorer" ? "explorador" : "catalogo"}${mode === "explorer" && shelfCode ? `&andel=${encodeURIComponent(shelfCode)}` : ""}`} className="transition-colors hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{title}</Link></h2>
          {book.tipoCoincidencia === "semantica" && <span className="shrink-0 border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">Relacionado</span>}
        </div>
        {personValue && <p className="mt-2 text-foreground/80">{personValue}</p>}
        <div ref={mobileMetadataRef} className="mt-2 min-w-0 max-w-full break-words text-sm text-muted-foreground">
          {(mediaPresentation ? mediaPresentation.values : bibliographicLine.map(key => bibliographicMeta[key])).filter(value => value !== null && value !== undefined && value !== "").map((value, index, values) => {
            const key = mediaPresentation ? `media-${index}` : bibliographicLine[index];
            const editorialCollectionBoundary = !mediaPresentation && key === "editorial" && bibliographicLine[index + 1] === "coleccion";
            return <Fragment key={key}>
              <span data-mobile-metadata-value={key} className="break-words">{value}{editorialCollectionBoundary && " · "}</span>
              {index < values.length - 1 && !editorialCollectionBoundary && <span aria-hidden="true" data-mobile-metadata-separator data-mobile-metadata-previous={key} data-mobile-metadata-next={mediaPresentation ? `media-${index + 1}` : bibliographicLine[index + 1]}> <span data-mobile-metadata-separator-glyph>·</span><span data-mobile-metadata-separator-trailing-space> </span></span>}
            </Fragment>;
          })}
        </div>
        {(book.tematicas.length > 0 || book.idiomas.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {book.tematicas.slice(0, 3).map(topic => <Link key={topic} href={catalogFilterHref("tematica", topic)} className="bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-primary/15 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{topic}</Link>)}
            {book.idiomas.map(language => <Link key={language} href={catalogFilterHref("idioma", language)} className="border border-primary/30 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{language}</Link>)}
            <AvailabilityBadge copies={book.exemplaresDispoñibles} />
          </div>
        )}
      </div>
    </article>
  );
}

export default function Biblioteca() {
  const [activeMode, setActiveMode] = useState<LibraryMode>("initial");
  const [libraryComposition, setLibraryComposition] = useState<LibraryComposition>(DEFAULT_LIBRARY_COMPOSITION);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [alphabeticalOrder, setAlphabeticalOrder] = useState(false);
  const [result, setResult] = useState<BibliotecaSearchResponse | null>(null);
  const [options, setOptions] = useState<BibliotecaFilterOptions>(EMPTY_FILTERS);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState("");
  const [selectedSupport, setSelectedSupport] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput, setToDateInput] = useState("");
  const [pageRange, setPageRange] = useState<[number, number] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedTitle, setAdvancedTitle] = useState("");
  const [advancedAuthor, setAdvancedAuthor] = useState("");
  const [advancedPublisher, setAdvancedPublisher] = useState("");
  const [advancedCollection, setAdvancedCollection] = useState("");
  const [advancedIsbnIssn, setAdvancedIsbnIssn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCover, setSelectedCover] = useState<BibliotecaBook | null>(null);
  const [usageOpen, setUsageOpen] = useState(false);
  const [explorerShelf, setExplorerShelf] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<BibliotecaBook[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [novelties, setNovelties] = useState<BibliotecaBook[]>([]);
  const [noveltiesLoading, setNoveltiesLoading] = useState(false);
  const modeSwitcherRef = useRef<HTMLDivElement>(null);
  const search = useSearch();
  const [, setLocation] = useLocation();
  const maximumCatalogPages = Math.max(1, options.limitesPaxinas.max ?? 1);
  const visiblePageRange: [number, number] = pageRange ?? [1, maximumCatalogPages];
  const [pageMinimumInput, setPageMinimumInput] = useState(String(visiblePageRange[0]));
  const [pageMaximumInput, setPageMaximumInput] = useState(String(visiblePageRange[1]));
  const [activePageThumb, setActivePageThumb] = useState<0 | 1 | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLibraryComposition()
      .then(next => { if (!cancelled) setLibraryComposition(next); })
      .catch(() => { if (!cancelled) setLibraryComposition(DEFAULT_LIBRARY_COMPOSITION); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setPageMinimumInput(String(visiblePageRange[0]));
    setPageMaximumInput(String(visiblePageRange[1]));
  }, [visiblePageRange[0], visiblePageRange[1]]);

  const catalogTagFilters = useMemo(() => {
    const params = new URLSearchParams(search);
    return { autorias: params.getAll("autoria"), editoriais: params.getAll("editorial"), coleccions: params.getAll("coleccion"), direccions: params.getAll("direccion"), produccions: params.getAll("producion"), guions: params.getAll("guion"), repartos: params.getAll("reparto"), musicas: params.getAll("musica"), fotografias: params.getAll("fotografia"), discograficas: params.getAll("discografica"), estudios: params.getAll("estudio") };
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    setSelectedTopic(params.get("tematica") ?? "");
    setSelectedLanguages(params.getAll("idioma"));
    setSelectedFormat(params.get("formato") ?? "");
    setSelectedSupport(params.get("soporte") ?? "");
  }, [search]);

  const requestQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (activeMode === "explorer") {
      if (explorerShelf) params.append("andel", explorerShelf);
      if (alphabeticalOrder) params.set("orde", "alfabetica");
      params.set("paxina", String(page));
      params.set("porPaxina", "24");
      return params.toString();
    }
    if (query) params.set("q", query);
    if (alphabeticalOrder) params.set("orde", "alfabetica");
    if (fromDate) params.set("desde", fromDate);
    if (toDate) params.set("ata", toDate);
    if (pageRange && pageRange[0] > 1) params.set("paxinasMin", String(pageRange[0]));
    if (pageRange && pageRange[1] < maximumCatalogPages) params.set("paxinasMax", String(pageRange[1]));
    if (selectedTopic) params.append("tematica", selectedTopic);
    selectedLanguages.forEach(language => params.append("idioma", language));
    if (selectedFormat) params.append("formato", selectedFormat);
    if (selectedSupport) params.append("soporte", selectedSupport);
    catalogTagFilters.autorias.forEach(value => params.append("autoria", value));
    catalogTagFilters.editoriais.forEach(value => params.append("editorial", value));
    catalogTagFilters.coleccions.forEach(value => params.append("coleccion", value));
    catalogTagFilters.direccions.forEach(value => params.append("direccion", value));
    catalogTagFilters.produccions.forEach(value => params.append("producion", value));
    catalogTagFilters.guions.forEach(value => params.append("guion", value));
    catalogTagFilters.repartos.forEach(value => params.append("reparto", value));
    catalogTagFilters.musicas.forEach(value => params.append("musica", value));
    catalogTagFilters.fotografias.forEach(value => params.append("fotografia", value));
    catalogTagFilters.discograficas.forEach(value => params.append("discografica", value));
    catalogTagFilters.estudios.forEach(value => params.append("estudio", value));
    if (advancedTitle) params.set("av_titulo", advancedTitle);
    if (advancedAuthor) params.set("av_autoria", advancedAuthor);
    if (advancedPublisher) params.set("av_editorial", advancedPublisher);
    if (advancedCollection) params.set("av_coleccion", advancedCollection);
    if (advancedIsbnIssn) params.set("av_isbn", advancedIsbnIssn);
    params.set("paxina", String(page));
    params.set("porPaxina", "24");
    return params.toString();
  }, [activeMode, advancedAuthor, advancedCollection, advancedIsbnIssn, advancedPublisher, advancedTitle, alphabeticalOrder, catalogTagFilters, explorerShelf, fromDate, maximumCatalogPages, page, pageRange, query, selectedFormat, selectedLanguages, selectedSupport, selectedTopic, toDate]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const requestedMode = params.get("modo");
    if (requestedMode === "explorador") { setActiveMode("explorer"); setExplorerShelf(params.get("andel")?.trim().toUpperCase() || null); }
    else if (search) setActiveMode("catalog");
  }, [search]);

  useEffect(() => {
    if (activeMode === "initial") return;
    const controller = new AbortController();
    catalogFetch("/api/biblioteca/filtros", { signal: controller.signal, cache: "no-store" })
      .then(response => response.ok ? response.json() as Promise<BibliotecaFilterOptions> : Promise.reject(new Error("filtros")))
      .then(setOptions)
      .catch(error => { if (error.name !== "AbortError") console.warn("Non se puideron cargar os filtros", error); });
    return () => controller.abort();
  }, [activeMode]);

  useEffect(() => {
    if (!shouldFetchExplorerResults(activeMode, explorerShelf)) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    catalogFetch(`/api/biblioteca/libros?${requestQuery}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("catálogo");
        return response.json() as Promise<BibliotecaSearchResponse>;
      })
      .then(setResult)
      .catch(fetchError => { if (fetchError.name !== "AbortError") setError("O catálogo está actualizándose. Téntao de novo nuns instantes."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [activeMode, explorerShelf, requestQuery]);

  useEffect(() => {
    if (activeMode !== "explorer") {
      setRecommendations([]);
      setRecommendationsLoading(false);
      return;
    }
    const controller = new AbortController();
    setRecommendationsLoading(true);
    catalogFetch("/api/biblioteca/recomendacions", { signal: controller.signal, cache: "no-store" })
      .then(response => response.ok ? response.json() as Promise<BibliotecaBook[]> : Promise.reject(new Error("recomendacions")))
      .then(setRecommendations)
      .catch(fetchError => { if (fetchError.name !== "AbortError") setRecommendations([]); })
      .finally(() => { if (!controller.signal.aborted) setRecommendationsLoading(false); });
    return () => controller.abort();
  }, [activeMode]);

  useEffect(() => {
    if (activeMode !== "explorer") {
      setNovelties([]);
      setNoveltiesLoading(false);
      return;
    }
    const controller = new AbortController();
    setNoveltiesLoading(true);
    catalogFetch("/api/biblioteca/novidades", { signal: controller.signal, cache: "no-store" })
      .then(response => response.ok ? response.json() as Promise<BibliotecaBook[]> : Promise.reject(new Error("novidades")))
      .then(setNovelties)
      .catch(fetchError => { if (fetchError.name !== "AbortError") setNovelties([]); })
      .finally(() => { if (!controller.signal.aborted) setNoveltiesLoading(false); });
    return () => controller.abort();
  }, [activeMode]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQuery(draft.trim());
  }

  function selectMode(mode: Exclude<LibraryMode, "initial">, fromInitial: boolean) {
    setActiveMode(mode);
    if (mode === "explorer") setExplorerShelf(null);
    if (!fromInitial || !window.matchMedia("(min-width: 640px)").matches) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => modeSwitcherRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" }), reducedMotion ? 0 : 180);
  }

  function toggle(value: string, values: string[], setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
    setPage(1);
  }

  function clearFilters() {
    setDraft("");
    setQuery("");
    setSelectedTopic("");
    setSelectedLanguages([]);
    setSelectedFormat("");
    setSelectedSupport("");
    setFromDate("");
    setToDate("");
    setFromDateInput("");
    setToDateInput("");
    setPageRange(null);
    setAdvancedTitle("");
    setAdvancedAuthor("");
    setAdvancedPublisher("");
    setAdvancedCollection("");
    setAdvancedIsbnIssn("");
    setExplorerShelf(null);
    setPage(1);
    setLocation("/biblioteca", { replace: true });
    setFiltersOpen(false);
  }

  function updateMonthYear(value: string, setInput: (next: string) => void, setDate: (next: string) => void) {
    setInput(value);
    const parsed = parseMonthYearInput(value);
    if (parsed || value === "") { setDate(parsed ?? ""); setPage(1); }
  }

  function applyPageRange(nextRange: [number, number]) {
    const next: [number, number] = [Math.max(1, Math.min(nextRange[0], maximumCatalogPages)), Math.max(1, Math.min(nextRange[1], maximumCatalogPages))];
    const ordered: [number, number] = [Math.min(next[0], next[1]), Math.max(next[0], next[1])];
    setPageRange(ordered[0] === 1 && ordered[1] === maximumCatalogPages ? null : ordered);
    setPage(1);
  }

  function commitPageInput(boundary: "minimum" | "maximum") {
    const input = boundary === "minimum" ? pageMinimumInput : pageMaximumInput;
    const fallback = boundary === "minimum" ? visiblePageRange[0] : visiblePageRange[1];
    const parsed = Number(input);
    const next = updatePageRangeBoundary(boundary, Number.isFinite(parsed) ? parsed : fallback, visiblePageRange, maximumCatalogPages);
    applyPageRange(next);
  }

  const totalPages = Math.max(1, Math.ceil((result?.total ?? 0) / 24));
  const hasActiveFilters = Boolean(query || selectedTopic || selectedLanguages.length || selectedFormat || selectedSupport || fromDate || toDate || pageRange || advancedTitle || advancedAuthor || advancedPublisher || advancedCollection || advancedIsbnIssn || catalogTagFilters.autorias.length || catalogTagFilters.editoriais.length || catalogTagFilters.coleccions.length || catalogTagFilters.direccions.length || catalogTagFilters.produccions.length || catalogTagFilters.guions.length || catalogTagFilters.repartos.length || catalogTagFilters.musicas.length || catalogTagFilters.fotografias.length || catalogTagFilters.discograficas.length || catalogTagFilters.estudios.length);
  const showClearFilter = activeMode === "explorer" ? shouldShowExplorerClearFilter(activeMode, explorerShelf) : hasActiveFilters;
  const filterContent = (
    <>
      <div className="border-b-2 border-primary pb-4"><h2 className="font-display text-2xl font-bold">Filtros</h2></div>
      <fieldset className="border-t border-border pt-5">
        <legend className="ml-1 bg-card px-2 font-display text-lg font-bold">Data de publicación</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MonthYearControl id="catalog-date-from" label="Desde" value={fromDateInput} onChange={value => updateMonthYear(value, setFromDateInput, setFromDate)} />
          <MonthYearControl id="catalog-date-to" label="Ata" value={toDateInput} onChange={value => updateMonthYear(value, setToDateInput, setToDate)} />
        </div>
      </fieldset>
      <fieldset className="border-t border-border pt-5">
        <legend className="ml-1 bg-card px-2 font-display text-lg font-bold">Temática</legend>
        <label className="sr-only" htmlFor="catalog-topic">Seleccionar temática</label>
        <select id="catalog-topic" value={selectedTopic} onChange={event => { setSelectedTopic(event.target.value); setPage(1); }} className="mt-3 w-full border border-input bg-card px-3 py-2 text-sm">
          <option value="">--- Todas as temáticas ---</option>
          {options.tematicas.map(topic => <option key={topic} value={topic}>{topic}</option>)}
        </select>
      </fieldset>
      <CheckGroup title="Idioma" items={options.idiomas} selected={selectedLanguages} onChange={language => toggle(language, selectedLanguages, setSelectedLanguages)} />
      <fieldset className="border-t border-border pt-5">
        <legend className="ml-1 bg-card px-2 font-display text-lg font-bold">Número de páxinas</legend>
        <div className="mt-3 px-1 py-1.5">
          <div className="px-1 py-3">
            <Slider min={1} max={maximumCatalogPages} step={1} minStepsBetweenThumbs={0} value={visiblePageRange} onPointerDownCapture={event => { const thumb = (event.target as HTMLElement).closest<HTMLElement>("[data-slot='slider-thumb']"); const thumbs = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-slot='slider-thumb']")); const index = thumb ? thumbs.indexOf(thumb) : -1; setActivePageThumb(index === 0 || index === 1 ? index : null); }} onPointerUpCapture={() => setActivePageThumb(null)} onPointerCancelCapture={() => setActivePageThumb(null)} onValueChange={values => applyPageRange(constrainSliderPageRange(values, visiblePageRange, maximumCatalogPages, activePageThumb))} aria-label="Intervalo de páxinas" />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 border-t border-border/60 pt-3">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>Mínimo</span><input type="number" inputMode="numeric" min={1} max={maximumCatalogPages} value={pageMinimumInput} onChange={event => setPageMinimumInput(event.target.value)} onBlur={() => commitPageInput("minimum")} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }} className="h-9 w-full rounded-sm border border-border/80 bg-card/90 px-2 text-center text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" /></label>
            <span aria-hidden="true" className="pb-2 text-sm text-muted-foreground">—</span>
            <label className="grid gap-1 text-right text-xs font-medium text-muted-foreground"><span>Máximo</span><input type="number" inputMode="numeric" min={1} max={maximumCatalogPages} value={pageMaximumInput} onChange={event => setPageMaximumInput(event.target.value)} onBlur={() => commitPageInput("maximum")} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }} className="h-9 w-full rounded-sm border border-border/80 bg-card/90 px-2 text-center text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" /></label>
          </div>
        </div>
      </fieldset>
      <fieldset className="border-t border-border pt-5">
        <legend className="ml-1 bg-card px-2 font-display text-lg font-bold">Soporte</legend>
        <label className="sr-only" htmlFor="catalog-support">Seleccionar soporte</label>
        <select id="catalog-support" value={selectedSupport} onChange={event => { setSelectedSupport(event.target.value); setPage(1); }} className="mt-3 w-full border border-input bg-card px-3 py-2 text-sm">
          <option value="">--- Todos os soportes ---</option>
          {options.soportes.map(soporte => <option key={soporte} value={soporte}>{soporte}</option>)}
        </select>
      </fieldset>
      <fieldset className="border-t border-border pt-5">
        <legend className="ml-1 bg-card px-2 font-display text-lg font-bold">Formato</legend>
        <label className="sr-only" htmlFor="catalog-format">Seleccionar formato</label>
        <select id="catalog-format" value={selectedFormat} onChange={event => { setSelectedFormat(event.target.value); setPage(1); }} className="mt-3 w-full border border-input bg-card px-3 py-2 text-sm">
          <option value="">--- Todos os formatos ---</option>
          {options.formatos.map(format => <option key={format} value={format}>{format}</option>)}
        </select>
      </fieldset>
    </>
  );

  return (
    <div className="pb-8 md:pb-12">
      <SEO title="Biblioteca" description="Catálogo consultable da Biblioteca da Revolteira." />
      <section className="relative overflow-hidden border-b-2 border-border bg-muted/30 py-12 md:pb-16 md:pt-24">
        <img src="/assets/hedra.png" alt="" className="pointer-events-none absolute left-0 top-0 h-auto min-h-[40px] w-full object-cover opacity-80" aria-hidden="true" />
        <div className="container relative z-10">
          <div className="relative">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h1 className="font-display text-4xl font-bold md:text-5xl">Biblioteca</h1>
              <LibraryUsageButton onClick={() => setUsageOpen(true)} className="md:absolute md:bottom-0 md:right-0" />
            </div>
            <p className="max-w-2xl text-lg text-muted-foreground">Comunitaria e autoxestionada.</p>
          </div>
        </div>
      </section>

      <main className="container pt-8">
        <div ref={modeSwitcherRef} className="scroll-mt-20 md:scroll-mt-24">
          <LibraryModeSwitcher activeMode={activeMode} onSelectCatalog={(fromInitial) => selectMode("catalog", fromInitial)} onSelectExplorer={(fromInitial) => selectMode("explorer", fromInitial)} catalogContent={<form onSubmit={submitSearch} className="border-2 border-primary bg-card p-3 shadow-[5px_5px_0_var(--color-muted)] sm:p-4">
            <div className="sm:flex sm:items-center sm:gap-3">
              <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:gap-3">
                <span className="shrink-0"><SearchHelp /></span>
                <label className="sr-only sm:hidden" htmlFor="catalog-search-mobile">Buscar no catálogo</label>
                <input id="catalog-search-mobile" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Busca no catálogo…" className="h-12 min-w-0 w-full bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground sm:hidden" />
                <label className="sr-only" htmlFor="catalog-search">Buscar no catálogo</label>
                <input id="catalog-search" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Busca por título, autoría, editorial ou unha idea…" className="hidden h-12 min-w-0 w-full bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground sm:block sm:flex-1 sm:px-0" />
              </div>
              <button type="submit" className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 font-bold text-primary-foreground transition-transform duration-150 active:scale-[0.97] sm:mt-0 sm:w-auto">Buscar <Search size={17} /></button>
            </div>
            <div className="mt-3 flex items-center gap-3"><button type="button" onClick={() => setAdvancedOpen(open => !open)} aria-expanded={advancedOpen} className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline">Busca avanzada {advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button></div>
            {advancedOpen && <fieldset className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-5"><legend className="sr-only">Campos de busca avanzada</legend><label className="text-sm"><span className="mb-1 block font-medium">Título</span><input value={advancedTitle} onChange={event => { setAdvancedTitle(event.target.value); setPage(1); }} className="w-full border border-input bg-card px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">Autoría</span><input value={advancedAuthor} onChange={event => { setAdvancedAuthor(event.target.value); setPage(1); }} className="w-full border border-input bg-card px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">Editorial</span><input value={advancedPublisher} onChange={event => { setAdvancedPublisher(event.target.value); setPage(1); }} className="w-full border border-input bg-card px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">Colección</span><input value={advancedCollection} onChange={event => { setAdvancedCollection(event.target.value); setPage(1); }} className="w-full border border-input bg-card px-3 py-2" /></label><label className="text-sm"><span className="mb-1 block font-medium">ISBN / ISSN / EAN</span><input value={advancedIsbnIssn} onChange={event => { setAdvancedIsbnIssn(event.target.value); setPage(1); }} className="w-full border border-input bg-card px-3 py-2" /></label></fieldset>}
          </form>} explorerContent={<ExplorerLibraryScene composition={libraryComposition} onCompositionChange={setLibraryComposition} activeShelf={explorerShelf} onSelectShelf={shelfCode => { setExplorerShelf(shelfCode); setPage(1); }} />} />
        </div>
        {activeMode !== "initial" && <>
          {activeMode === "catalog" && <button type="button" onClick={() => setFiltersOpen(true)} className="mt-6 flex w-full items-center justify-center gap-2 border-2 border-primary bg-card px-4 py-3 font-bold lg:hidden"><SlidersHorizontal size={18} /> Filtros</button>}
          {activeMode === "catalog" && filtersOpen && <div className="fixed inset-0 z-[60] bg-foreground/30 p-4 lg:hidden"><aside className="ml-auto h-full max-w-md overflow-y-auto bg-card p-6 shadow-xl"><div className="mb-6 flex justify-end"><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Pechar filtros" className="p-2"><X /></button></div><div className="space-y-6">{filterContent}</div></aside></div>}

          <div className={`mt-8 grid gap-10 lg:gap-12 ${activeMode === "catalog" ? "lg:grid-cols-[17rem_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_17rem]"}`}>
            {activeMode === "catalog" && <aside className="hidden self-start border-2 border-primary bg-card p-5 shadow-[4px_4px_0_var(--color-muted)] lg:block"><div className="space-y-6">{filterContent}</div></aside>}
            <section aria-live="polite">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 border-b-2 border-primary pb-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-y-3 sm:pb-4">
                <div className="col-span-2 text-left sm:col-span-1"><h2 className="font-display text-3xl font-bold">Resultados</h2><div className="mt-1 flex items-center justify-between gap-2 sm:block"><p className="text-sm leading-tight text-muted-foreground">{activeMode === "explorer" && !explorerShelf ? "Preme nun andel para ver o contido." : loading ? "Buscando no catálogo…" : `${result?.total ?? 0} referencias atopadas`}</p>{totalPages === 1 && <div className="flex shrink-0 items-center gap-2 sm:hidden"><button type="button" onClick={() => { setAlphabeticalOrder(current => !current); setPage(1); }} aria-pressed={alphabeticalOrder} aria-label={alphabeticalOrder ? "Desactivar orde alfabética" : "Activar orde alfabética"} title={alphabeticalOrder ? "Orde alfabética activada" : "Activar orde alfabética"} className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${alphabeticalOrder ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><ArrowDownAZ size={20} strokeWidth={alphabeticalOrder ? 3 : 2} /><span className="sr-only">{alphabeticalOrder ? "Orde alfabética activada" : "Orde por relevancia activada"}</span></button>{showClearFilter && <button type="button" onClick={activeMode === "explorer" ? () => { setExplorerShelf(null); setPage(1); } : clearFilters} className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Limpar filtro{activeMode === "catalog" ? "s" : ""}</button>}</div>}</div></div>
                <LibraryPagination page={page} totalPages={totalPages} onPageChange={setPage} className="col-span-2 row-start-3 hidden sm:flex sm:col-span-1 sm:col-start-2 sm:row-start-1" />
                <div className="col-span-2 hidden text-sm text-muted-foreground sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:flex sm:flex-col sm:items-end sm:justify-self-end sm:text-right">
                  <div className="flex max-w-full flex-wrap justify-end gap-x-4 gap-y-0.5">
                    {activeMode === "explorer" && explorerShelf && <p className="max-w-sm">Andel: <span className="font-semibold text-foreground">{explorerShelfLabel(explorerShelf, libraryComposition.shelfMappings)}</span></p>}
                    {activeMode === "catalog" && query && <p className="max-w-sm">Busca: <span className="font-semibold text-foreground">{query}</span></p>}
                    {!query && (catalogTagFilters.autorias[0] || catalogTagFilters.editoriais[0] || catalogTagFilters.coleccions[0]) && <p className="max-w-sm">Filtro: <span className="font-semibold text-foreground">{catalogTagFilters.autorias[0] || catalogTagFilters.editoriais[0] || catalogTagFilters.coleccions[0]}</span></p>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-4">
                    <button type="button" onClick={() => { setAlphabeticalOrder(current => !current); setPage(1); }} aria-pressed={alphabeticalOrder} aria-label={alphabeticalOrder ? "Desactivar orde alfabética" : "Activar orde alfabética"} title={alphabeticalOrder ? "Orde alfabética activada" : "Activar orde por relevancia"} className="hidden h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex"><ArrowDownAZ size={20} strokeWidth={alphabeticalOrder ? 3 : 2} /><span className="sr-only">{alphabeticalOrder ? "Orde alfabética activada" : "Orde por relevancia activada"}</span></button>
                    {showClearFilter && <button type="button" onClick={activeMode === "explorer" ? () => { setExplorerShelf(null); setPage(1); } : clearFilters} className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Limpar filtro{activeMode === "catalog" ? "s" : ""}</button>}
                  </div>
                </div>
                <div className={`col-span-2 row-start-3 items-center justify-between gap-3 pt-2 sm:hidden ${totalPages > 1 ? "flex" : "hidden"}`}>
                  <LibraryPagination page={page} totalPages={totalPages} onPageChange={setPage} />
                  <div className="ml-auto flex items-center gap-2">
                    <button type="button" onClick={() => { setAlphabeticalOrder(current => !current); setPage(1); }} aria-pressed={alphabeticalOrder} aria-label={alphabeticalOrder ? "Desactivar orde alfabética" : "Activar orde alfabética"} title={alphabeticalOrder ? "Orde alfabética activada" : "Activar orde alfabética"} className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${alphabeticalOrder ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><ArrowDownAZ size={20} strokeWidth={alphabeticalOrder ? 3 : 2} /><span className="sr-only">{alphabeticalOrder ? "Orde alfabética activada" : "Orde por relevancia activada"}</span></button>
                    {showClearFilter && <button type="button" onClick={activeMode === "explorer" ? () => { setExplorerShelf(null); setPage(1); } : clearFilters} className="whitespace-nowrap font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Limpar filtro{activeMode === "catalog" ? "s" : ""}</button>}
                  </div>
                </div>
              </div>
              {loading && <div className="flex items-center gap-3 py-16 text-muted-foreground"><LoaderCircle className="animate-spin" /> Cargando referencias…</div>}
              {!loading && error && <div className="mt-6 flex gap-3 border-l-4 border-accent bg-secondary p-5 text-sm leading-6"><CircleAlert className="shrink-0 text-accent" /><p>{error}</p></div>}
              {!loading && !error && activeMode === "explorer" && !explorerShelf && <div className="py-16 text-center"><Binoculars className="mx-auto text-primary/70" size={32} strokeWidth={1.8} /><p className={EXPLORER_EMPTY_STATE_TEXT_CLASS}>Preme nun andel para ver o contido.</p></div>}
              {!loading && !error && !(activeMode === "explorer" && !explorerShelf) && result?.resultados.length === 0 && <div className="py-16 text-center">{activeMode === "explorer" && explorerShelf ? <Binoculars className="mx-auto text-primary" size={42} /> : <BookOpen className="mx-auto text-primary" size={42} />}<h3 className="mt-4 font-display text-2xl font-bold">Non atopamos referencias</h3><p className="mx-auto mt-2 max-w-md text-muted-foreground">{emptyResultsDescription(activeMode, explorerShelf)}</p></div>}
              {!loading && !error && result?.resultados.map(book => <BookCard book={book} key={book.id} onViewCover={setSelectedCover} mode={activeMode === "explorer" ? "explorer" : "catalog"} shelfCode={activeMode === "explorer" ? explorerShelf : null} />)}
              {!loading && !error && <LibraryPagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-8 border-t border-border/60 pt-5" />}
            </section>
            {activeMode === "explorer" && <div className="hidden self-start space-y-10 lg:block"><ExplorerSidePanel recommendations={recommendations} loading={recommendationsLoading} /><ExplorerSidePanel recommendations={novelties} loading={noveltiesLoading} title="Novidades" testId="explorer-side-panel-novelties" /></div>}
          </div>
          {activeMode === "explorer" && <div className="mt-10 space-y-10 lg:hidden"><ExplorerMobileRecommendations recommendations={recommendations} loading={recommendationsLoading} /><ExplorerMobileRecommendations recommendations={novelties} loading={noveltiesLoading} title="Novidades" testId="explorer-mobile-novelties" /></div>}
        </>}
      </main>
      <Dialog open={!!selectedCover} onOpenChange={open => !open && setSelectedCover(null)}>
        <DialogContent className="flex max-h-[95vh] max-w-[95vw] items-center justify-center border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{selectedCover ? `Portada de ${displayBookTitle(selectedCover)}` : "Portada ampliada"}</DialogTitle>
          <div className="relative flex h-full w-full items-center justify-center"><button type="button" onClick={() => setSelectedCover(null)} aria-label="Pechar a portada ampliada" className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"><X size={24} /></button>{selectedCover?.portada && <img src={selectedCover.portada} alt={`Portada de ${displayBookTitle(selectedCover)}`} className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl" />}</div>
        </DialogContent>
      </Dialog>
      <Dialog open={usageOpen} onOpenChange={setUsageOpen}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto border-2 border-primary bg-card p-5 shadow-[6px_6px_0_var(--color-muted)] sm:p-7">
          <DialogTitle className="sr-only">Guía de uso da Biblioteca</DialogTitle>
          <div className="space-y-5 text-sm leading-6 text-foreground/90 sm:text-base sm:leading-7">
            <p>A biblioteca da Revolteira mantémola viva colectivamente. O noso arquivo documental foise construíndo, fundamentalmente, por conta de doazóns particulares, á marxe dalgún libro adquirido polo propio centro social. É un lugar de posta en común de formas artísticas de expresarnos, de xeitos de analizarnos e interpretarnos, de transmisión de saberes, de enfoques políticos, de memoria de loitas locais e globais. Un acervo do coñecemento e da cultura que producimos e que nos pertence, e que, contrariamente ás lóxicas do capital, defendemos que sexa libre e publicamente accesible.</p>
            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="text-sm font-bold text-primary sm:text-base">Quero contribuír cunha doazón</h3>
              <p>Agradecemos de mil amores a túa disposición a enriquecer a oferta da biblioteca. En xeral, procuramos libros, revistas ou fanzines con interese social, político, educativo etc. Tamén nos interesa a narrativa, a poesía, o cómic, a música e calquera forma de arte. Non nos interesan enciclopedias, guías de usuario, manuais ou informes obsoletos.</p>
              <p>Como podes comprobar ao visitar o local, o espazo dispoñible é limitado, e non somos un punto limpo, polo que temos que facer unha selección do que máis nos pode interesar no centro social. Por iso, preferimos que contactes con nós por correo previamente indicando que material queres doar e poñerémonos de acordo para a entrega.</p>
              <p>Se nalgún momento vas querer recuperar libros doados por ti, escribe o teu nome e algunha forma de contacto na primeira páxina. Ten en conta, iso si, que durante o uso pode que algún exemplar non se devolva, se deteriore ou se perda.</p>
            </section>
            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="text-sm font-bold text-primary sm:text-base">Quero levar un libro á casa</h3>
              <p>Para levar material da biblioteca fala con alguén do centro social cando esteas por alí ou contáctanos por correo. Apuntaremos o teu nome e o do exemplar, unha forma de contactar contigo e a data na que o levas. Para devolvelo podes volver contactar con nós se tes dúbidas, pero non é preciso que o fagas: abonda con que marques a columna de «devolto» no rexistro que se atopa sobre o moble circular negro e con que o deixes no lugar no que estaba ou, se non o lembras, a carón do rexistro.</p>
              <p>Lembra que o material da biblioteca é colectivo: non o acapares para que o resto tamén poida usalo. Intenta non exceder as tres semanas. Considera que tamén podes quedar a ler nalgún dos comodísimos sofás do centro social.</p>
              <p>E coida o material! Especialmente tendo presente que non somos ningunha institución estatal e non contamos con ningún respaldo económico público nin privado. A biblioteca é unha forma de compartir e de organizar a nosa propia cultura. Partimos da idea de que, en xeral, somos boa xente e saberemos coidar o compartido :)</p>
            </section>
            <p className="border-t border-border pt-5">Se tes algunha dúbida ou algunha idea, queres ser parte do grupo de biblioteca ou queres contactar connosco porque a biblio está en chamas... podes escribirnos a <a href="mailto:contacto@example.org" className="font-semibold text-primary underline underline-offset-4">contacto@example.org</a>.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
