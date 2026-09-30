export const demoMode = import.meta.env.VITE_CATALOG_MODE === "demo";
export const staticMode = import.meta.env.VITE_CATALOG_MODE === "static";

export async function catalogFetch(url: string, options?: RequestInit): Promise<Response> {

  options?.signal?.throwIfAborted();

  if (demoMode) {
    const { demoResponse } = await import("./demo-catalog");
    options?.signal?.throwIfAborted();
    return demoResponse(new URL(url, "http://localhost"));
  }

  if (staticMode) {
    const { staticCatalogResponse } = await import("./static-catalog");
    options?.signal?.throwIfAborted();
    return staticCatalogResponse(new URL(url, "http://localhost"));
  }

  return fetch(url, options);
}
