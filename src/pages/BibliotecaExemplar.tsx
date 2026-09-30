import { catalogFetch } from "@/lib/catalog-api";
import SEO from "@/components/SEO";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { displayBookTitle, explorerShelfAreaName, explorerShelfHref, EXPLORER_SHELF_CORRESPONDENCES, splitBibliographicTags, type BibliotecaBook, type ExplorerShelfCorrespondence } from "@shared/biblioteca";
import { fetchLibraryComposition } from "@/lib/library-composition";
import { ArrowLeft, Binoculars, BookOpen, CircleAlert, LoaderCircle, X, ZoomIn } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Link, useRoute, useSearch } from "wouter";
import { catalogFilterHref, formatDate, formatDurationInMinutes } from "./Biblioteca";

function AvailabilityBadge({ copies }: { copies: number | null }) {
  if (copies === null) return null;
  const available = copies > 0;
  return <span className={`inline-flex items-center gap-2 border px-3 py-1.5 text-sm font-semibold ${available ? "border-emerald-700/30 bg-emerald-700/10 text-emerald-900" : "border-red-700/30 bg-red-700/10 text-red-900"}`}><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${available ? "bg-emerald-600" : "bg-red-600"}`} />{available ? "Dispoñible" : "Non dispoñible"}</span>;
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return <div className="py-4"><dt className="text-sm font-semibold text-muted-foreground">{label}</dt><dd className="mt-1 text-base text-foreground">{value}</dd></div>;
}

function TagFilterLinks({ value, filter }: { value: string | null; filter: "autoria" | "direccion" | "producion" | "guion" | "reparto" | "musica" | "fotografia" | "editorial" | "coleccion" | "discografica" | "estudio" }) {
  const labels = splitBibliographicTags(value);
  if (!labels.length) return null;
  return <>{labels.map((label, index) => <span key={label}>{index > 0 && ", "}<Link href={`/biblioteca?${filter}=${encodeURIComponent(label)}`} className="font-medium text-primary underline-offset-4 hover:underline">{label}</Link></span>)}</>;
}

export function bibliotecaReturnLink(search: string): { href: string; label: string } {
  const params = new URLSearchParams(search);
  const mode = params.get("modo");
  const shelfCode = params.get("andel");
  return mode === "explorador" ? { href: shelfCode ? explorerShelfHref(shelfCode) : "/biblioteca?modo=explorador", label: "Volver ao explorador" } : { href: "/biblioteca?modo=catalogo", label: "Volver ao catálogo" };
}

export function ShelfExplorerLinks({ shelves, correspondences = EXPLORER_SHELF_CORRESPONDENCES }: { shelves: string[]; correspondences?: ExplorerShelfCorrespondence[] }) {
  if (!shelves.length) return null;
  return <>{shelves.map((shelfCode, index) => {
    const areaName = explorerShelfAreaName(shelfCode, correspondences);
    return <span key={shelfCode}>{index > 0 && ", "}<Link href={explorerShelfHref(shelfCode)} aria-label={`Localizar ${areaName} no Modo explorador`} title={`Localizar ${areaName} no Modo explorador`} className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span>{areaName}</span><Binoculars aria-hidden="true" size={15} strokeWidth={2.3} /><span className="sr-only">Localizar no Modo explorador</span></Link></span>;
  })}</>;
}

export default function BibliotecaExemplar() {
  const [match, params] = useRoute("/biblioteca/:id");
  const [book, setBook] = useState<BibliotecaBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [shelfMappings, setShelfMappings] = useState<ExplorerShelfCorrespondence[]>(EXPLORER_SHELF_CORRESPONDENCES);
  const [coverOpen, setCoverOpen] = useState(false);
  const id = params?.id;
  const search = useSearch();
  const returnLink = bibliotecaReturnLink(search);

  useEffect(() => {
    if (!match || !id) return;
    const controller = new AbortController();
    setLoading(true);
    setNotFound(false);
    catalogFetch(`/api/biblioteca/libros/${encodeURIComponent(id)}`, { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (response.status === 404) { setNotFound(true); return null; }
        if (!response.ok) throw new Error("detalle");
        return response.json() as Promise<BibliotecaBook>;
      })
      .then(result => { if (result) setBook(result); })
      .catch(error => { if (error.name !== "AbortError") setNotFound(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, match]);

  useEffect(() => {
    fetchLibraryComposition().then(composition => setShelfMappings(composition.shelfMappings)).catch(() => undefined);
  }, []);

  const title = book ? displayBookTitle(book) : "Exemplar da Biblioteca";
  return <div className="min-h-screen pb-16">
    <SEO title={title} description={book?.sinopse ?? "Ficha dun exemplar da Biblioteca da Revolteira."} />
    <main className="container py-8 md:py-12">
      <Link href={returnLink.href} className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"><ArrowLeft size={17} /> {returnLink.label}</Link>
      {loading && <div className="flex items-center gap-3 py-16 text-muted-foreground"><LoaderCircle className="animate-spin" /> Cargando o exemplar…</div>}
      {!loading && notFound && <div className="border-l-4 border-accent bg-secondary p-6"><CircleAlert className="mb-3 text-accent" /><h2 className="font-display text-2xl font-bold">Non atopamos este exemplar</h2><p className="mt-2 text-muted-foreground">Pode que o catálogo se estea actualizando ou que a referencia xa non estea dispoñible.</p></div>}
      {!loading && book && <article className="mt-6 grid gap-8 lg:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)] lg:gap-12">
        <div className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none lg:sticky lg:top-24 lg:self-start"><div className="overflow-hidden border-2 border-border bg-secondary shadow-[6px_6px_0_var(--color-muted)]">{book.portada ? <button type="button" onClick={() => setCoverOpen(true)} aria-label={`Ampliar a portada de ${title}`} className="group relative block w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><img src={book.portada} alt={`Portada de ${title}`} className="h-auto w-full object-contain" /><span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white transition-colors group-hover:bg-black/15"><ZoomIn aria-hidden="true" className="opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100" size={34} /></span></button> : <div className="flex aspect-[3/4] flex-col items-center justify-center gap-3 text-muted-foreground"><BookOpen size={40} /><span>Sen portada</span></div>}</div><div className="mt-4"><AvailabilityBadge copies={book.exemplaresDispoñibles} /></div></div>
        <div><h1 className="max-w-4xl font-display text-3xl font-bold leading-tight md:text-4xl">{title}</h1><div className="mt-5 flex flex-wrap gap-2">{book.tematicas.map(topic => <Link key={topic} href={catalogFilterHref("tematica", topic)} className="bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-primary/15 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{topic}</Link>)}{book.idiomas.map(language => <Link key={language} href={catalogFilterHref("idioma", language)} className="border border-primary/30 px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{language}</Link>)}</div><dl className="mt-7 divide-y divide-border border-y border-border"><Detail label="Autoría" value={book.autoria ? <TagFilterLinks value={book.autoria} filter="autoria" /> : null} /><Detail label="Data de publicación" value={formatDate(book.dataPublicacion)} /><Detail label="Dirección" value={book.direccion ? <TagFilterLinks value={book.direccion} filter="direccion" /> : null} /><Detail label="Produción" value={book.producion ? <TagFilterLinks value={book.producion} filter="producion" /> : null} /><Detail label="Guión" value={book.guion ? <TagFilterLinks value={book.guion} filter="guion" /> : null} /><Detail label="Reparto" value={book.reparto ? <TagFilterLinks value={book.reparto} filter="reparto" /> : null} /><Detail label="Música" value={book.musica ? <TagFilterLinks value={book.musica} filter="musica" /> : null} /><Detail label="Fotografía" value={book.fotografia ? <TagFilterLinks value={book.fotografia} filter="fotografia" /> : null} /><Detail label="Editorial" value={book.editorial ? <TagFilterLinks value={book.editorial} filter="editorial" /> : null} /><Detail label="Colección" value={book.coleccion ? <TagFilterLinks value={book.coleccion} filter="coleccion" /> : null} /><Detail label="Volume" value={book.volume} /><Detail label="Número" value={book.numero} /><Detail label="Páxinas" value={book.numeroPaxinas} /><Detail label="Soporte" value={book.soporte} /><Detail label="Formato" value={book.formato} /><Detail label="Xénero" value={book.xenero} /><Detail label="Duración" value={formatDurationInMinutes(book.duracion)} /><Detail label="Discográfica" value={book.discografica ? <TagFilterLinks value={book.discografica} filter="discografica" /> : null} /><Detail label="Estudio" value={book.estudio ? <TagFilterLinks value={book.estudio} filter="estudio" /> : null} /><Detail label="ISBN / ISSN / EAN" value={book.isbnIssn} /><Detail label="Exemplares dispoñibles" value={book.exemplaresDispoñibles !== null && book.exemplaresTotais !== null ? `${book.exemplaresDispoñibles}/${book.exemplaresTotais}` : null} /><Detail label="Andel" value={<ShelfExplorerLinks shelves={book.andel} correspondences={shelfMappings} />} /></dl>{book.sinopse && <section className="mt-10 border-t-2 border-primary pt-6"><h2 className="font-display text-2xl font-bold">Sinopse</h2><p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-8 text-foreground/80">{book.sinopse}</p></section>}</div>
      </article>}
    </main>
    <Dialog open={coverOpen} onOpenChange={setCoverOpen}><DialogContent className="flex max-h-[95vh] max-w-[95vw] items-center justify-center border-none bg-transparent p-0 shadow-none"><DialogTitle className="sr-only">Portada de {title}</DialogTitle><div className="relative flex h-full w-full items-center justify-center"><button type="button" onClick={() => setCoverOpen(false)} aria-label="Pechar a portada ampliada" className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"><X size={24} /></button>{book?.portada && <img src={book.portada} alt={`Portada de ${title}`} className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl" />}</div></DialogContent></Dialog>
  </div>;
}
