import { parse } from 'yaml';

// Como estamos nunha SPA sen acceso ao sistema de ficheiros no cliente, 
// necesitamos un xeito de ler os ficheiros .md que están no repo.
// Unha opción é usar a API de GitHub ou facer fetch se os ficheiros se serven.
// Pero a mellor opción para que a web cargue o contido de Decap é 
// que o proceso de build de Vite os inclúa.

export async function getDecapPosts() {
  try {
    // Importamos todos os ficheiros markdown da carpeta de posts
    const modules = import.meta.glob('../../content/posts/*.md', { query: '?raw', import: 'default', eager: true });
    
    const posts = Object.entries(modules).map(([filepath, content]) => {
      const filename = filepath.split('/').pop()?.replace('.md', '') || '';
      
      // Parsear o frontmatter manualmente (soportando diferentes finais de liña)
      const match = (content as string).match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
      const frontmatterRaw = match ? match[1] : '';
      const body = match ? (content as string).slice(match[0].length).trim() : (content as string).trim();
      
      const data = parse(frontmatterRaw) || {};
      
      return {
        _id: filename,
        title: data.title || filename,
        slug: { current: data.slug || filename },
        mainImage: data.image || '',
        publishedAt: data.publishedAt || new Date().toISOString(),
        body: body, // Gardamos o body como string
        categories: data.categories || [],
        isDecap: true
      };
    });
    
    return posts;
  } catch (e) {
    console.error("Error fetching Decap posts:", e);
    return [];
  }
}

export async function getDecapPost(slug: string) {
  const posts = await getDecapPosts();
  return posts.find(p => p.slug.current === slug) || null;
}

export async function getDecapWorkshops() {
  try {
    const modules = import.meta.glob('../../content/workshops/*.md', { query: '?raw', import: 'default', eager: true });
    
    const workshops = Object.entries(modules).map(([filepath, content]) => {
      const filename = filepath.split('/').pop()?.replace('.md', '') || '';
      
      const match = (content as string).match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
      const frontmatterRaw = match ? match[1] : '';
      const body = match ? (content as string).slice(match[0].length).trim() : (content as string).trim();
      
      const data = parse(frontmatterRaw) || {};
      
      return {
        _id: filename,
        title: data.title || filename,
        description: data.description || '',
        frequency: data.frequency || 'Puntual',
        frequencyColor: data.frequencyColor || '#ffffff',
        day: data.day || '',
        time: data.time || '',
        schedules: data.schedules || [],
        image: data.image || '',
        category: data.category || '',
        categoryColor: data.categoryColor || '#e5e7eb',
        contact: data.contact || null,
        body: body,
        archived: data.archived || false,
        isDecap: true
      };
    });
    
    return workshops;
  } catch (e) {
    console.error("Error fetching Decap workshops:", e);
    return [];
  }
}

export async function getDecapResources() {
  try {
    const modules = import.meta.glob('../../content/resources/*.md', { query: '?raw', import: 'default', eager: true });
    
    const resources = Object.entries(modules).map(([filepath, content]) => {
      const filename = filepath.split('/').pop()?.replace('.md', '') || '';
      
      const match = (content as string).match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
      const frontmatterRaw = match ? match[1] : '';
      
      const data = parse(frontmatterRaw) || {};
      
      return {
        _id: filename,
        title: data.title || filename,
        description: data.description || '',

        icon: data.icon || 'Link',
        url: data.url || '#',
        links: data.links || [],
        isPrivate: data.isPrivate || false,
        isDecap: true
      };
    });
    
    return resources;
  } catch (e) {
    console.error("Error fetching Decap resources:", e);
    return [];
  }
}
