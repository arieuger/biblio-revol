import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
}

const SITE_URL = (import.meta.env.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "https://arieuger.github.io") + import.meta.env.BASE_URL).replace(/\/$/, "");
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

export default function SEO({ 
  title, 
  description, 
  image = DEFAULT_IMAGE, 
  type = "website" 
}: SEOProps) {
  useEffect(() => {
    // Título:
    // - Sen título: "Revolteira" (páxina de inicio)
    // - Con título e tipo "article": o título exacto (entradas do blog)
    // - Con título e tipo "website": "Revolteira - Título" (seccións)
    const baseTitle = "Revolteira";
    const fullTitle = title 
      ? (type === "article" ? title : `${baseTitle} - ${title}`) 
      : baseTitle;
    document.title = fullTitle;

    // Función para actualizar ou crear meta tags
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };

    // Meta tags estándar
    if (description) {
      updateMetaTag("description", description);
    }

    // URL canónica
    const currentUrl = window.location.href;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;

    // Imaxe: asegurarse de que sexa sempre unha URL absoluta
    const absoluteImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

    // Open Graph
    updateMetaTag("og:title", fullTitle, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:url", currentUrl, true);
    updateMetaTag("og:image", absoluteImage, true);
    if (description) {
      updateMetaTag("og:description", description, true);
    }

    // Twitter Card
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:url", currentUrl);
    updateMetaTag("twitter:image", absoluteImage);
    if (description) {
      updateMetaTag("twitter:description", description);
    }

  }, [title, description, image, type]);

  return null;
}
