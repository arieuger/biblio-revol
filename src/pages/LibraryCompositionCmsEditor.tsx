import { withBase } from "@/lib/site-path";
import { LibraryCompositionEditor } from "@/components/LibraryCompositionEditor";
import { DEFAULT_LIBRARY_COMPOSITION, normalizeLibraryComposition, type LibraryComposition } from "@/lib/library-composition";
import { useEffect, useState } from "react";

type EditorMessage = {
  type?: string;
  composition?: unknown;
};

/** Dedicated, embeddable editor surface used by the DecapCMS custom widget. */
export default function LibraryCompositionCmsEditor() {
  const [composition, setComposition] = useState<LibraryComposition>(DEFAULT_LIBRARY_COMPOSITION);
  const [ready, setReady] = useState(false);
  const [embeddedInCms, setEmbeddedInCms] = useState(false);

  useEffect(() => {
    if (window.parent === window) return;
    setEmbeddedInCms(true);
    const receiveComposition = (event: MessageEvent<EditorMessage>) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type !== "library-composition:load") return;
      // The CMS form is authoritative, including intentional deletions.
      // Loading the published snapshot here could overwrite the current draft.
      setComposition(normalizeLibraryComposition(event.data.composition));
      setReady(true);
    };
    window.addEventListener("message", receiveComposition);
    if (window.parent !== window) window.parent.postMessage({ type: "library-composition:ready" }, window.location.origin);
    return () => window.removeEventListener("message", receiveComposition);
  }, []);

  const publishToCms = (next: LibraryComposition) => {
    setComposition(next);
    const { shelfMappings: _shelfMappings, ...compositionOnly } = next;
    if (window.parent !== window) window.parent.postMessage({ type: "library-composition:change", composition: compositionOnly }, window.location.origin);
  };

  if (!embeddedInCms) return <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground"><section className="max-w-lg border-2 border-primary bg-card p-6 shadow-[6px_6px_0_var(--color-muted)]"><h1 className="font-display text-2xl font-bold">Editor non dispoñible nesta ruta</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">A composición da Biblioteca só se pode editar desde o panel autenticado de DecapCMS.</p><a href={withBase("/admin/")} className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Ir a DecapCMS</a></section></main>;

  return <main className="min-h-screen bg-background p-3 text-foreground sm:p-5">
    <div className="mx-auto max-w-7xl">
      <div className="mb-4"><h1 className="font-display text-2xl font-bold sm:text-3xl">Editor da composición da Biblioteca</h1><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Move, escala e ordena o mobiliario. Ao pechar a edición, a configuración actualizarase no formulario de DecapCMS.</p>{!ready && <p className="mt-2 text-xs font-medium text-muted-foreground">Conectando co formulario de DecapCMS…</p>}</div>
      {ready && <LibraryCompositionEditor composition={composition} activeShelf={null} onSelectShelf={() => undefined} shelfCodeFor={() => null} onCommittedChange={publishToCms} editorContext="cms" allowEditing />}
    </div>
  </main>;
}
