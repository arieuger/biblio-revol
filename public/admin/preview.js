const cmsSiteBase = new URL("../", window.location.href).pathname;
// CMS Preview Template para Decap CMS
const PostPreview = createClass({
  render: function() {
    const entry = this.props.entry;
    const title = entry.getIn(['data', 'title']);
    const date = entry.getIn(['data', 'publishedAt']);
    const image = entry.getIn(['data', 'image']);
    const body = entry.getIn(['data', 'body']);
    
    // Resolvemos a ruta da imaxe para a previsualización
    // Soportamos tanto imaxes publicadas (URLs) coma imaxes locais (blob:)
    let imageSrc = null;
    
    if (image) {
      try {
        // Primeiro intentamos usar getAsset (para imaxes publicadas)
        imageSrc = this.props.getAsset(image);
      } catch (e) {
        console.warn("Aviso ao cargar asset da imaxe:", e);
      }
      
      // Se getAsset non funcionou e a imaxe é un blob: ou unha ruta local, usámola directamente
      if (!imageSrc && typeof image === 'string') {
        // Se xa é un blob: ou unha URL completa, usámola directamente
        if (image.startsWith('blob:') || image.startsWith('http')) {
          imageSrc = image;
        } 
        // Se é unha ruta relativa, tentamos construír a URL
        else if (image.startsWith('/')) {
          imageSrc = image;
        }
      }
    }

    return h('div', { className: 'prose' },
      h('h1', {}, title),
      date ? h('div', { className: 'date' }, date.toString()) : null,
      imageSrc ? h('img', { 
        src: imageSrc.toString(),
        style: { 
          maxWidth: '100%', 
          height: 'auto', 
          display: 'block', 
          marginBottom: '1rem',
          border: '1px solid #ccc'
        },
        onError: function() {
          console.error("Erro ao cargar a imaxe:", imageSrc);
        }
      }) : null,
      h('div', {}, this.props.widgetFor('body'))
    );
  }
});

const WorkshopPreview = createClass({
  render: function() {
    const entry = this.props.entry;
    const title = entry.getIn(['data', 'title']);
    const description = entry.getIn(['data', 'description']);
    const image = entry.getIn(['data', 'image']);
    const body = entry.getIn(['data', 'body']);
    
    let imageSrc = null;
    
    if (image) {
      try {
        imageSrc = this.props.getAsset(image);
      } catch (e) {
        console.warn("Aviso ao cargar asset da imaxe:", e);
      }
      
      if (!imageSrc && typeof image === 'string') {
        if (image.startsWith('blob:') || image.startsWith('http') || image.startsWith('/')) {
          imageSrc = image;
        }
      }
    }

    return h('div', { className: 'prose' },
      h('h1', {}, title),
      h('p', {}, description),
      imageSrc ? h('img', { 
        src: imageSrc.toString(),
        style: { 
          maxWidth: '100%', 
          height: 'auto', 
          display: 'block', 
          marginBottom: '1rem',
          border: '1px solid #ccc'
        },
        onError: function() {
          console.error("Erro ao cargar a imaxe:", imageSrc);
        }
      }) : null,
      h('div', {}, this.props.widgetFor('body'))
    );
  }
});

CMS.registerPreviewTemplate("posts", PostPreview);
CMS.registerPreviewTemplate("workshops", WorkshopPreview);

// Editor visual para o ficheiro content/settings/library-composition.json.
// O iframe carga unha ruta da propia web e sincronízase mediante postMessage,
// polo que DecapCMS pode gardar o JSON normal no repositorio sen backend extra.
const LibraryCompositionControl = createClass({
  componentDidMount: function() {
    window.addEventListener("message", this.handleMessage);
  },
  componentWillUnmount: function() {
    window.removeEventListener("message", this.handleMessage);
  },
  componentDidUpdate: function() {
    this.sendComposition();
  },
  getComposition: function() {
    const value = this.props.value;
    return value && typeof value.toJS === "function" ? value.toJS() : (value || {});
  },
  sendComposition: function() {
    if (!this.frame || !this.frame.contentWindow) return;
    this.frame.contentWindow.postMessage({ type: "library-composition:load", composition: this.getComposition() }, window.location.origin);
  },
  handleMessage: function(event) {
    if (event.origin !== window.location.origin || !this.frame || event.source !== this.frame.contentWindow) return;
    if (event.data && event.data.type === "library-composition:ready") {
      this.sendComposition();
    }
    if (event.data && event.data.type === "library-composition:change" && event.data.composition) {
      this.props.onChange(event.data.composition);
    }
  },
  render: function() {
    return h("div", { className: this.props.classNameWrapper, style: { position: "relative", left: "calc(50% - 50vw)", width: "100vw", maxWidth: "100vw", boxSizing: "border-box", padding: "0 1rem" } },
      h("p", { style: { margin: "0 0 0.75rem", color: "#4b5563", lineHeight: "1.5" } }, "Edita o fondo e o mobiliario aquí. As correspondencias edítanse na entrada separada Táboa de correspondencias."),
      h("iframe", {
        title: "Editor da composición da Biblioteca",
        src: cmsSiteBase + "admin/composicion-biblioteca?embed=1",
        ref: function(frame) { this.frame = frame; }.bind(this),
        onLoad: this.sendComposition,
        style: { display: "block", width: "100%", minHeight: "940px", border: "1px solid #9ca3af", borderRadius: "6px", background: "#fff" }
      })
    );
  }
});

CMS.registerWidget("library-composition", LibraryCompositionControl);

const LibraryShelfMappingsControl = createClass({
  componentDidMount: function() { window.addEventListener("message", this.handleMessage); },
  componentWillUnmount: function() { window.removeEventListener("message", this.handleMessage); },
  getMappings: function() { const value = this.props.value; return value && typeof value.toJS === "function" ? value.toJS() : (value || []); },
  sendMappings: function() { if (this.frame?.contentWindow) this.frame.contentWindow.postMessage({ type: "library-mappings:load", mappings: this.getMappings() }, window.location.origin); },
  handleMessage: function(event) {
    if (event.origin !== window.location.origin || !this.frame || event.source !== this.frame.contentWindow) return;
    if (event.data?.type === "library-mappings:ready") this.sendMappings();
    if (event.data?.type === "library-mappings:change" && Array.isArray(event.data.mappings)) this.props.onChange(event.data.mappings);
  },
  render: function() {
    return h("div", { className: this.props.classNameWrapper, style: { position: "relative", left: "calc(50% - 50vw)", width: "100vw", maxWidth: "100vw", boxSizing: "border-box", padding: "0 1rem" } },
      h("iframe", { title: "Táboa de correspondencias da Biblioteca", src: cmsSiteBase + "admin/correspondencias-biblioteca?embed=1", ref: function(frame) { this.frame = frame; }.bind(this), onLoad: this.sendMappings, style: { display: "block", width: "100%", minHeight: "760px", border: "1px solid #9ca3af", borderRadius: "6px", background: "#fff" } })
    );
  }
});
CMS.registerWidget("library-shelf-mappings", LibraryShelfMappingsControl);

// Compoñente de editor para o carrusel
CMS.registerEditorComponent({
  id: "carousel",
  label: "Carrusel de Fotos",
  fields: [
    {
      label: "Imaxes",
      name: "images",
      widget: "list",
      summary: "{{fields.image}}",
      fields: [{ label: "Imaxe", name: "image", widget: "image" }]
    }
  ],
  pattern: /^:::\s*carousel\s*\n([\s\S]*?)\n\s*:::$/m,
  fromBlock: function(match) {
    const imagesContent = match[1];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images = [];
    let imgMatch;
    
    while ((imgMatch = imageRegex.exec(imagesContent)) !== null) {
      if (imgMatch[2] && imgMatch[2].trim() !== '') {
        images.push({ image: imgMatch[2].trim() });
      }
    }
    
    return {
      images: images.length > 0 ? images : []
    };
  },
  toBlock: function(obj) {
    if (!obj.images || !Array.isArray(obj.images) || obj.images.length === 0) return "";
    
    const imagesMarkdown = obj.images
      .filter(img => img && img.image)
      .map(img => `![Imaxe](${img.image})`)
      .join("\n");
      
    if (!imagesMarkdown) return "";
    return `:::carousel\n${imagesMarkdown}\n:::`;
  },
  toPreview: function(obj) {
    if (!obj.images || !Array.isArray(obj.images) || obj.images.length === 0) return "";
    
    const validImages = obj.images.filter(img => img && img.image);
    if (validImages.length === 0) return "";
    
    const imagePreview = validImages
      .slice(0, 3)
      .map(img => `<img src="${img.image}" style="max-width: 60px; height: 60px; object-fit: cover; border-radius: 0.25rem; margin: 0 0.25rem;" />`)
      .join("");
    
    return `
      <div style="background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; text-align: center; border: 2px dashed #d1d5db;">
        <p style="margin: 0; font-weight: bold;">Carrusel de Fotos</p>
        <div style="margin: 0.5rem 0; display: flex; justify-content: center; align-items: center;">${imagePreview}</div>
        <p style="margin: 0.5rem 0 0; font-size: 0.875rem; color: #6b7280;">${validImages.length} imaxes</p>
      </div>
    `;
  }
});
