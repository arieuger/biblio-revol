export type SvgZone = { id: string; name: string; x: number; y: number; width: number; height: number };
export type SvgCanvas = { x: number; y: number; width: number; height: number };
export type ParsedZoneSvg = { source: string; canvas: SvgCanvas; zones: SvgZone[]; existingIds: string[] };
const marker = 'data-library-zone';
const ns = 'http://www.w3.org/2000/svg';

export function parseZoneSvg(source: string): ParsedZoneSvg {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = document.documentElement;
  if (document.querySelector('parsererror') || root.localName !== 'svg') throw new Error('O ficheiro non é un SVG válido.');
  const viewBox = root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);
  const width = Number(root.getAttribute('width')?.replace(/px$/, ''));
  const height = Number(root.getAttribute('height')?.replace(/px$/, ''));
  const [x, y, w, h] = viewBox?.length === 4 ? viewBox : [0, 0, width, height];
  if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) throw new Error('O SVG precisa un viewBox ou un ancho e alto válidos.');
  const zones = Array.from(root.querySelectorAll(`rect[${marker}="true"]`)).map(element => ({
    id: element.getAttribute('data-id') ?? '',
    name: element.getAttribute('data-label') ?? element.getAttribute('data-id') ?? '',
    x: Number(element.getAttribute('x')), y: Number(element.getAttribute('y')),
    width: Number(element.getAttribute('width')), height: Number(element.getAttribute('height')),
  }));
  const existingIds = Array.from(root.querySelectorAll(`[data-id]:not([${marker}="true"])`)).map(element => element.getAttribute('data-id')!).filter(Boolean);
  return { source, canvas: { x, y, width: w, height: h }, zones, existingIds };
}

export function zoneRectangle(start: { x: number; y: number }, end: { x: number; y: number }, canvas: SvgCanvas) {
  const clampX = (x: number) => Math.max(canvas.x, Math.min(canvas.x + canvas.width, x));
  const clampY = (y: number) => Math.max(canvas.y, Math.min(canvas.y + canvas.height, y));
  const x1 = clampX(start.x), x2 = clampX(end.x), y1 = clampY(start.y), y2 = clampY(end.y);
  return { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x2 - x1), height: Math.abs(y2 - y1) };
}

export function writeSvgZones(parsed: ParsedZoneSvg, zones: SvgZone[]): string {
  const document = new DOMParser().parseFromString(parsed.source, 'image/svg+xml');
  const root = document.documentElement;
  root.querySelectorAll(`[${marker}="true"]`).forEach(element => element.remove());
  const ids = new Set(parsed.existingIds.map(id => id.toUpperCase()));
  const names = new Set<string>();
  for (const zone of zones) {
    const name = zone.name.trim();
    if (!name) throw new Error('Pon un nome a todas as zonas.');
    if (names.has(name.toLocaleLowerCase())) throw new Error('Usa nomes distintos para as zonas deste moble.');
    names.add(name.toLocaleLowerCase());
    if (!zone.id || ids.has(zone.id.toUpperCase())) throw new Error('Hai identificadores de zona repetidos.');
    ids.add(zone.id.toUpperCase());
    if (![zone.x, zone.y, zone.width, zone.height].every(Number.isFinite) || zone.width <= 0 || zone.height <= 0) throw new Error('As zonas deben ter ancho e alto maiores que cero.');
    const c = parsed.canvas;
    if (zone.x < c.x || zone.y < c.y || zone.x + zone.width > c.x + c.width + 0.001 || zone.y + zone.height > c.y + c.height + 0.001) throw new Error('As zonas deben quedar dentro do SVG.');
    const rect = document.createElementNS(ns, 'rect');
    const attrs = { [marker]: 'true', 'data-id': zone.id, 'data-label': name, x: zone.x, y: zone.y, width: zone.width, height: zone.height, fill: 'transparent', 'pointer-events': 'all', tabindex: '0', role: 'button', 'aria-label': name };
    Object.entries(attrs).forEach(([key, value]) => rect.setAttribute(key, String(value)));
    const title = document.createElementNS(ns, 'title');
    title.textContent = name;
    rect.append(title);
    root.append(rect);
  }
  return new XMLSerializer().serializeToString(document);
}

export function svgDataUrl(source: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
}
