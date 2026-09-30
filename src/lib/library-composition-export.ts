import type { LibraryComposition } from "./library-composition";

const encoder = new TextEncoder();

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function withoutQuery(value: string): string {
  return value.split("?")[0] ?? value;
}

function extensionFromSource(source: string, fallback = ".svg"): string {
  if (source.startsWith("data:image/png")) return ".png";
  if (source.startsWith("data:image/jpeg")) return ".jpg";
  if (source.startsWith("data:image/webp")) return ".webp";
  const match = withoutQuery(source).match(/(\.[a-z0-9]{2,5})$/i);
  return match?.[1] ?? fallback;
}

function assetName(name: string, source: string, fallback: string): string {
  const base = name.replace(/[^a-z0-9áéíóúüñ._-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || fallback;
  return /\.[a-z0-9]{2,5}$/i.test(base) ? base : `${base}${extensionFromSource(source)}`;
}

export function libraryCompositionJson(composition: LibraryComposition): string {
  return JSON.stringify({ composition }, null, 2);
}

export function libraryCompositionHtml(composition: LibraryComposition, relativeAssets = false): string {
  const background = relativeAssets && composition.background.src ? `assets/${assetName(composition.background.assetFile, composition.background.src, "fondo")}` : composition.background.src;
  const furniture = composition.items.map(item => {
    const src = relativeAssets ? `assets/${assetName(item.assetFile, item.src, item.id)}` : item.src;
    return `      <img src="${escapeHtml(src)}" alt="${escapeHtml(item.description || item.name)}" style="position:absolute;left:${item.left}%;top:${item.top}%;height:${item.height}%;aspect-ratio:${item.aspect};z-index:${item.layer};filter:drop-shadow(2px 8px 5px rgba(17,22,19,.2));" />`;
  }).join("\n");
  const backgroundStyle = background ? `background: url('${escapeHtml(background)}') center / 100% 100% no-repeat, #eef8f2;` : "background: #eef8f2;";

  return `<!doctype html>
<html lang="gl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Composición do mobiliario da Biblioteca</title>
</head>
<body style="margin:0;background:#f5fbf7;overflow-x:auto;">
  <main style="width:min(100%, 1440px);min-width:704px;margin:0 auto;padding:16px;box-sizing:border-box;">
    <section aria-label="Composición do mobiliario da Biblioteca" style="position:relative;aspect-ratio:11 / 5;overflow:hidden;${backgroundStyle}">
${furniture}
    </section>
  </main>
</body>
</html>`;
}

export function downloadCompositionBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadCompositionText(name: string, content: string, type: string): void {
  downloadCompositionBlob(name, new Blob([content], { type }));
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    const byte = data[index]!;
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function u32(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
}

function concatenate(chunks: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/** Builds a standards-compliant, uncompressed ZIP with no third-party runtime dependency. */
function makeZip(entries: Array<{ name: string; data: Uint8Array }>): Blob {
  const localFiles: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const local = concatenate([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(entry.data.length), u32(entry.data.length), u16(name.length), u16(0), name, entry.data,
    ]);
    localFiles.push(local);
    directory.push(concatenate([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(entry.data.length), u32(entry.data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name,
    ]));
    offset += local.length;
  }

  const directoryData = concatenate(directory);
  const end = concatenate([
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(directoryData.length), u32(offset), u16(0),
  ]);
  return new Blob([concatenate([...localFiles, directoryData, end])], { type: "application/zip" });
}

async function bytesForAsset(source: string): Promise<Uint8Array> {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`asset:${source}`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function libraryCompositionZip(composition: LibraryComposition): Promise<Blob> {
  const assets = new Map<string, string>();
  if (composition.background.src) assets.set(assetName(composition.background.assetFile, composition.background.src, "fondo"), composition.background.src);
  composition.items.forEach(item => assets.set(assetName(item.assetFile, item.src, item.id), item.src));

  const portable: LibraryComposition = {
    ...composition,
    background: composition.background.src ? { ...composition.background, src: `assets/${assetName(composition.background.assetFile, composition.background.src, "fondo")}` } : { ...composition.background },
    items: composition.items.map(item => ({ ...item, src: `assets/${assetName(item.assetFile, item.src, item.id)}` })),
  };

  const assetEntries = await Promise.all(Array.from(assets.entries()).map(async ([name, source]) => ({ name: `assets/${name}`, data: await bytesForAsset(source) })));
  return makeZip([
    { name: "index.html", data: encoder.encode(libraryCompositionHtml(composition, true)) },
    { name: "composicion-biblioteca.json", data: encoder.encode(libraryCompositionJson(portable)) },
    { name: "LEEME.txt", data: encoder.encode("Paquete portable da composición da Biblioteca. Mantén o cartafol assets xunto a index.html.\n") },
    ...assetEntries,
  ]);
}
