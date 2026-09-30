/** Prefix local assets with the Vite deployment base, leaving external/data URLs intact. */
export function withBase(value: string | null | undefined, base = import.meta.env.BASE_URL): string {
  if (!value) return '';
  if (!value.startsWith('/') || value.startsWith('//') || base === '/') return value;
  const prefix = base.replace(/\/$/, '');
  return value === prefix || value.startsWith(`${prefix}/`) ? value : `${prefix}${value}`;
}
