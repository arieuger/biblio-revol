export const demoMode = import.meta.env.VITE_CATALOG_MODE === "demo";

export async function catalogFetch(url: string, options?: RequestInit): Promise<Response> {
  if (!demoMode) return fetch(url, options);
  options?.signal?.throwIfAborted();
  const { demoResponse } = await import("./demo-catalog");
  options?.signal?.throwIfAborted();
  return demoResponse(new URL(url, "http://localhost"));
}
