import { useEffect, useState } from 'react';
import { parseZoneSvg, type ParsedZoneSvg } from '@/lib/svg-zones';

/** Parent-document hit targets also work for SVG data URLs with opaque origins. */
export function SvgZoneOverlay({ src, isActive, onSelect }: { src: string; isActive: (id: string) => boolean; onSelect: (id: string) => void }) {
  const [parsed, setParsed] = useState<ParsedZoneSvg | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setParsed(null);
    fetch(src, { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error('svg');
      return response.text();
    }).then(source => setParsed(parseZoneSvg(source))).catch(() => undefined);
    return () => controller.abort();
  }, [src]);
  if (!parsed?.zones.length) return null;
  const c = parsed.canvas;
  return <svg viewBox={`${c.x} ${c.y} ${c.width} ${c.height}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-label="Zonas do moble">
    {parsed.zones.map(zone => <rect key={zone.id} x={zone.x} y={zone.y} width={zone.width} height={zone.height} role="button" tabIndex={0} aria-label={zone.name} aria-pressed={isActive(zone.id)} onClick={() => onSelect(zone.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(zone.id); } }} className="pointer-events-auto cursor-pointer hover:fill-primary/20 focus:fill-primary/20 focus:outline-none" fill={isActive(zone.id) ? '#73de9e66' : 'transparent'} stroke={isActive(zone.id) ? '#277347' : 'transparent'} strokeWidth="2" vectorEffect="non-scaling-stroke"><title>{zone.name}</title></rect>)}
  </svg>;
}
