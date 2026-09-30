import { withBase } from "@/lib/site-path";
/*
Design: Brutalismo Digital Suavizado
- Grid de obradoiros con información detallada
- Categorización por frecuencia (semanal/mensual)
- Integración con Decap CMS
*/

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Clock, Calendar, Phone, MessageCircle, Instagram, Mail, Info, ChevronDown, ChevronUp, X, ZoomIn } from "lucide-react";
import { useEffect, useState, lazy, Suspense } from "react";

import { getDecapWorkshops } from "@/lib/decap.client";
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SEO from "@/components/SEO";
import { Link } from "wouter";

// Carga diferida do compoñente de premio para non pesar no bundle inicial
const RetroPrize = lazy(() => import("@/components/RetroPrize"));

interface Obradoiro {
  _id: string;
  title: string;
  description: string;
  frequency: string;
  frequencyColor?: string;
  day: string;
  time: string;
  schedules?: { day: string; time: string }[];
  location?: string;
  capacity?: string;
  image?: string;
  category: string;
  categoryColor?: string;
  contact?: {
    text?: string;
    icon?: string;
  };
  body?: string;
  archived?: boolean;
  isDecap?: boolean;
}

export default function Obradoiros() {
  const [obradoiros, setObradoiros] = useState<Obradoiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchObradoiros = async () => {
      try {
        const decapData = await getDecapWorkshops();
        setObradoiros(decapData as any);
      } catch (error) {
        console.error("Error fetching workshops:", error);
        setObradoiros([]);
      } finally {
        setLoading(false);
      }
    };

    fetchObradoiros();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getContactIcon = (iconName?: string) => {
    switch (iconName) {
      case 'phone': return <Phone size={16} />;
      case 'message-circle': return <MessageCircle size={16} />;
      case 'instagram': return <Instagram size={16} />;
      case 'mail': return <Mail size={16} />;
      case 'link': return <LinkIcon size={16} />;
      default: return <Info size={16} />;
    }
  };

  // Función para determinar se o texto é escuro ou claro e escoller a cor do texto
  const getContrastYIQ = (hexcolor?: string) => {
    if (!hexcolor) return 'black';
    const r = parseInt(hexcolor.substring(1, 3), 16);
    const g = parseInt(hexcolor.substring(3, 5), 16);
    const b = parseInt(hexcolor.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  };

  // AVISO: Se modificas o texto da descrición dos obradoiros, 
  // lembra que tamén se utiliza como descrición para os Open Graphs (SEO).
  const obradoirosDescription = "Actividades periódicas nas que aportamos e recibimos coñecementos e tecemos redes. Todos os obradoiros son abertos, de balde e ninguén recibe retribución por eles: facémolos con moito amor desde os principios do compromiso social e a posta en común.";

  return (
    <div className="min-h-screen">
      <SEO title="Obradoiros" description={obradoirosDescription} />
      {/* Header */}
      <section className="relative bg-muted/30 border-b-2 border-border py-12 md:pt-24 md:pb-16 overflow-hidden">
        <img 
          src={withBase("/assets/hedra.png")}
          alt="" 
          className="absolute top-0 left-0 w-full h-auto min-h-[40px] object-cover opacity-80 pointer-events-none"
          aria-hidden="true"
        />
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Obradoiros</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {obradoirosDescription}
          </p>
        </div>
      </section>

      {/* Workshops Grid */}
      <section className="container py-12 md:py-16">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando obradoiros...</p>
          </div>
        ) : obradoiros.filter(o => !o.archived).length === 0 ? (
          <Suspense fallback={<div className="text-center py-12 text-muted-foreground italic">Preparando o teu premio...</div>}>
            <RetroPrize />
          </Suspense>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {obradoiros.filter(o => !o.archived).map((obradoiro) => (
              <Card key={obradoiro._id} className="border-2 border-border hover:shadow-lg transition-shadow overflow-hidden group flex flex-col h-fit">
                {obradoiro.image && (
                  <div 
                    className="relative aspect-square overflow-hidden cursor-zoom-in bg-muted"
                    onClick={() => setSelectedImage(obradoiro.image || null)}
                  >
                    <img 
                      src={withBase(obradoiro.image)}
                      alt={obradoiro.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
                    </div>
                  </div>
                )}
                <CardContent className="pt-5 flex flex-col flex-grow">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {obradoiro.category && (
                      <Badge 
                        variant="secondary" 
                        className="border-2"
                        style={{ 
                          backgroundColor: obradoiro.categoryColor || '#e5e7eb',
                          color: getContrastYIQ(obradoiro.categoryColor),
                          borderColor: 'rgba(0,0,0,0.1)'
                        }}
                      >
                        {obradoiro.category}
                      </Badge>
                    )}
                    <Badge 
                      variant="outline" 
                      className="border-2"
                      style={{ 
                        backgroundColor: obradoiro.frequencyColor || 'transparent',
                        color: getContrastYIQ(obradoiro.frequencyColor),
                        borderColor: obradoiro.frequencyColor ? 'rgba(0,0,0,0.1)' : 'currentColor'
                      }}
                    >
                      {obradoiro.frequency}
                    </Badge>
                  </div>
                  
                  <h3 className="font-display font-bold text-lg mb-2 leading-tight">
                    {obradoiro.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {obradoiro.description}
                  </p>

                  <div className="space-y-2 text-sm text-muted-foreground border-t border-border pt-3 mb-4">
                    {obradoiro.schedules && obradoiro.schedules.length > 0 ? (
                      obradoiro.schedules.map((schedule, index) => (
                        <div key={index} className={index > 0 ? "pt-2 border-t border-border/30" : ""}>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-primary flex-shrink-0" />
                            <span className="font-medium">{schedule.day}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={16} className="text-primary flex-shrink-0" />
                            <span>{schedule.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary flex-shrink-0" />
                          <span>{obradoiro.day}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-primary flex-shrink-0" />
                          <span>{obradoiro.time}</span>
                        </div>
                      </>
                    )}
                    
                    {/* Contacto Opcional */}
                    {obradoiro.contact && obradoiro.contact.text && (
                      <div className="flex items-start gap-2 pt-1 border-t border-border/50 mt-2">
                        <div className="text-primary mt-1 flex-shrink-0">
                          {getContactIcon(obradoiro.contact.icon)}
                        </div>
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-0 
                          prose-a:text-primary prose-a:underline prose-a:font-bold prose-a:decoration-2 
                          hover:prose-a:opacity-80 transition-opacity">
                          <ReactMarkdown>{obradoiro.contact.text}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>

			                  {/* Botón Saber máis (só se hai body) */}
			                  {obradoiro.body && obradoiro.body.trim().length > 0 && (
			                    <div className="mt-auto">
			                      <Button 
			                        onClick={() => toggleExpand(obradoiro._id)}
			                        className="w-full border-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
			                      >
			                        {expandedId === obradoiro._id ? (
			                          <>Ver menos <ChevronUp size={16} /></>
			                        ) : (
			                          <>Saber máis <ChevronDown size={16} /></>
			                        )}
			                      </Button>
		                      
		                      {expandedId === obradoiro._id && (
		                        <div className="mt-4 p-4 bg-muted/50 rounded-lg border-2 border-border animate-in fade-in slide-in-from-top-2 duration-300">
		                          <div className="prose prose-sm max-w-none dark:prose-invert">
		                            <ReactMarkdown>{obradoiro.body}</ReactMarkdown>
		                          </div>
		                        </div>
		                      )}
		                    </div>
		                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modal para ampliar imaxe */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">Imaxe ampliada</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X size={24} />
            </button>
            <img 
              src={withBase(selectedImage || '')}
              alt="Imaxe ampliada" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
