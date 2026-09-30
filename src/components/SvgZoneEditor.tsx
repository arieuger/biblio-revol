import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { parseZoneSvg, svgDataUrl, writeSvgZones, zoneRectangle, type ParsedZoneSvg, type SvgZone } from '@/lib/svg-zones';
import type { LibraryFurniture } from '@/lib/library-composition';

const button = 'rounded border border-primary px-3 py-2 text-sm font-semibold disabled:opacity-50';
export function SvgZoneEditor({ item, onSave, onClose }: { item: LibraryFurniture; onSave: (source: string) => void; onClose: () => void }) {
  const [parsed, setParsed] = useState<ParsedZoneSvg | null>(null);
  const [zones, setZones] = useState<SvgZone[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [pending, setPending] = useState<ReturnType<typeof zoneRectangle> | null>(null);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch(item.src, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('Non se puido cargar o SVG.');
      return response.text();
    }).then(source => {
      const data = parseZoneSvg(source);
      setParsed(data); setZones(data.zones); setSelected(data.zones[0]?.id ?? null); setLoaded(true);
    }).catch(error => { if (error.name !== 'AbortError') { setError(error.message); setLoaded(true); } });
    return () => controller.abort();
  }, [item.src]);
  const active = zones.find(zone => zone.id === selected);
  const point = (event: PointerEvent<SVGSVGElement>) => {
    const matrix = svgRef.current?.getScreenCTM();
    if (!matrix) return null;
    const transformed = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: transformed.x, y: transformed.y };
  };
  const add = (rect: ReturnType<typeof zoneRectangle>) => {
    const id = `zona-${crypto.randomUUID()}`;
    let number = zones.length + 1;
    while (zones.some(zone => zone.name === `Zona ${number}`)) number++;
    setZones(current => [...current, { ...rect, id, name: `Zona ${number}` }]);
    setSelected(id); setError('');
  };
  const change = (patch: Partial<SvgZone>) => setZones(current => current.map(zone => zone.id === selected ? { ...zone, ...patch } : zone));
  const cancelDraw = () => { start.current = null; setPending(null); setDrawing(false); };
  const save = () => {
    if (!parsed) return;
    try { onSave(svgDataUrl(writeSvgZones(parsed, zones))); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Non se puideron gardar as zonas.'); }
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-5xl">
      <DialogTitle>Zonas de {item.name}</DialogTitle>
      <DialogDescription>Debuxa un rectángulo sobre cada andel e ponlle un nome. Ao rematar, aplica as zonas, aplica a composición e publica en Decap.</DialogDescription>
      {!loaded && <p role="status">Cargando SVG…</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {parsed && <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" className={button} aria-pressed={drawing} onClick={() => { cancelDraw(); setDrawing(!drawing); }}>{drawing ? 'Cancelar debuxo' : 'Debuxar zona'}</button>
            <button type="button" className={button} onClick={() => { cancelDraw(); add({ x: parsed.canvas.x + parsed.canvas.width * .1, y: parsed.canvas.y + parsed.canvas.height * .1, width: parsed.canvas.width * .8, height: parsed.canvas.height * .15 }); }}>Engadir zona con medidas</button>
          </div>
          <p role="status" className="mb-2 text-sm">{drawing ? 'Arrastra sobre o moble para debuxar a zona.' : 'Selecciona unha zona para cambiar o nome ou as medidas.'}</p>
          <svg ref={svgRef} viewBox={`${parsed.canvas.x} ${parsed.canvas.y} ${parsed.canvas.width} ${parsed.canvas.height}`} className={`w-full h-[55vh] rounded border bg-secondary/30 touch-none ${drawing ? 'cursor-crosshair' : ''}`} aria-label="Debuxo de zonas sobre o moble"
            onPointerDown={event => { if (!drawing || event.button !== 0) return; start.current = point(event); event.currentTarget.setPointerCapture(event.pointerId); event.preventDefault(); }}
            onPointerMove={event => { const end = point(event); if (start.current && end) setPending(zoneRectangle(start.current, end, parsed.canvas)); }}
            onPointerUp={event => { const end = point(event); if (start.current && end) { const rect = zoneRectangle(start.current, end, parsed.canvas); if (rect.width >= parsed.canvas.width * .005 && rect.height >= parsed.canvas.height * .005) add(rect); } if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); cancelDraw(); }}
            onPointerCancel={cancelDraw}>
            <image href={item.src} x={parsed.canvas.x} y={parsed.canvas.y} width={parsed.canvas.width} height={parsed.canvas.height} pointerEvents="none" />
            {zones.map(zone => <g key={zone.id} onPointerDown={event => { if (!drawing) { event.stopPropagation(); setSelected(zone.id); } }}>
              <rect x={zone.x} y={zone.y} width={Math.max(0, zone.width)} height={Math.max(0, zone.height)} fill={zone.id === selected ? '#73de9e66' : '#3f44471a'} stroke={zone.id === selected ? '#277347' : '#3f4447'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <text x={zone.x + 4} y={zone.y + parsed.canvas.height * .025} fontSize={parsed.canvas.height * .025} fill="#3f4447" pointerEvents="none">{zone.name}</text>
            </g>)}
            {pending && <rect {...pending} fill="#73de9e66" stroke="#277347" strokeWidth="2" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
          </svg>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-semibold">Zonas ({zones.length})<select className="mt-1 w-full border rounded p-2" value={selected ?? ''} onChange={event => setSelected(event.target.value)}><option value="" disabled>Selecciona unha zona</option>{zones.map(zone => <option key={zone.id} value={zone.id}>{zone.name || 'Sen nome'}</option>)}</select></label>
          {active && <>
            <label className="block text-sm font-semibold">Nome da zona<input className="mt-1 w-full border rounded p-2" maxLength={100} value={active.name} onChange={event => change({ name: event.target.value })} /></label>
            <div className="grid grid-cols-2 gap-2">{([{ key: 'x', label: 'Posición X' }, { key: 'y', label: 'Posición Y' }, { key: 'width', label: 'Ancho' }, { key: 'height', label: 'Alto' }] as const).map(({key,label}) => <label key={key} className="text-sm">{label}<input type="number" step="any" className="w-full border rounded p-2" value={active[key]} onChange={event => change({ [key]: event.target.valueAsNumber || 0 })} /></label>)}</div>
            <p className="text-xs text-muted-foreground">Medidas nas unidades do SVG. Podes axustalas sen arrastrar.</p>
            <button type="button" className={`${button} text-destructive`} onClick={() => { setZones(current => current.filter(zone => zone.id !== selected)); setSelected(null); }}>Eliminar zona</button>
          </>}
          {!zones.length && <p className="text-sm">Este moble aínda non ten zonas creadas co editor.</p>}
          {parsed.existingIds.length > 0 && <p className="text-xs text-muted-foreground">O SVG xa inclúe {parsed.existingIds.length} zonas externas. Consérvanse sen modificar.</p>}
          <p className="text-sm">Na táboa de correspondencias atoparás cada zona polo seu nome e polo moble ao que pertence.</p>
        </div>
      </div>}
      <div className="flex justify-end gap-3"><button type="button" className={button} onClick={onClose}>Cancelar</button><button type="button" className={`${button} bg-primary text-primary-foreground`} disabled={!parsed} onClick={save}>Aplicar zonas ao moble</button></div>
    </DialogContent>
  </Dialog>;
}
