import { withBase } from "@/lib/site-path";
/*
Design: Brutalismo Digital Suavizado
- Sección de recursos públicos e privados
- Integración con Decap CMS
*/

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Video, FolderOpen, Link as LinkIcon, Lock, Leaf, Soup, Mic, Users, Landmark, PiggyBank, Calculator, Heart, House, ChartLine } from "lucide-react";
import { useEffect, useState } from "react";
import { getDecapResources } from "@/lib/decap.client";
import { toast } from "sonner";

interface RecursoLink {
  label?: string;
  url: string;
  subtext?: string;
}

interface Recurso {
  _id: string;
  title: string;
  description: string;
  url: string;
  links?: RecursoLink[];
  isPrivate: boolean;
  icon?: string;
}

const iconMap: Record<string, any> = {
  FileText: FileText,
  BookOpen: BookOpen,
  Video: Video,
  FolderOpen: FolderOpen,
  Link: LinkIcon,
  Leaf: Leaf,
  Soup: Soup,
  Mic: Mic,
  Users: Users,
  Landmark: Landmark,
  PiggyBank: PiggyBank,
  Calculator: Calculator,
  Heart: Heart,
  House: House,
  ChartLine: ChartLine,
};

export default function Recursos() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchRecursos = async () => {
      try {
        const data = await getDecapResources();
        setRecursos(data);
      } catch (error) {
        console.error("Error fetching resources:", error);
        setRecursos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecursos();
  }, []);

  const handleAccessResource = (title: string, url: string, isPrivate: boolean) => {
    if (url === "#") {
      toast.info(`O recurso "${title}" estará dispoñible pronto.`);
      return;
    }
    window.open(url, '_blank');
    toast.success(`Accedendo a "${title}"...`);
  };

  const publicRecursos = recursos.filter(r => !r.isPrivate);
  const privateRecursos = recursos.filter(r => r.isPrivate);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative bg-muted/30 border-b-2 border-border py-12 md:pt-24 md:pb-16 overflow-hidden">
        <img 
          src={withBase("/assets/hedra.png")}
          alt="" 
          className="absolute top-0 left-0 w-full h-auto min-h-[40px] object-cover opacity-80 pointer-events-none"
          aria-hidden="true"
        />
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Recursos</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Material de interese colectivo. Algúns recursos están reservados para quen fai parte da Revolteira.
          </p>
        </div>
      </section>

      {/* Resources */}
      <section className="container py-12 md:py-16">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Cargando recursos...</p>
          </div>
        ) : (
          <>
            {/* Public Resources */}
            {publicRecursos.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-display font-bold mb-6">Recursos públicos</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {publicRecursos.map((recurso) => {
                    const IconComponent = iconMap[recurso.icon || 'Link'] || LinkIcon;
                    return (
                      <Card key={recurso._id} className="border-2 border-border hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary rounded-sm flex items-center justify-center flex-shrink-0">
                              <IconComponent className="text-primary-foreground" size={24} />
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-display font-bold text-lg">{recurso.title}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground mb-4">
                                {recurso.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {recurso.links && recurso.links.length > 0 ? (
                                  recurso.links.map((link, idx) => (
                                    <div key={idx} className="flex-1 min-w-[120px] flex flex-col gap-1">
                                      <Button 
                                        asChild
                                        className="w-full bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90"
                                      >
                                        <a 
                                          href={link.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          onClick={(e) => {
                                            if (link.url === "#") {
                                              e.preventDefault();
                                              toast.info(`O recurso "${recurso.title}" estará dispoñible pronto.`);
                                            } else {
                                              toast.success(`Accedendo a "${recurso.title}"...`);
                                            }
                                          }}
                                        >
                                          {link.label || "Acceder"}
                                        </a>
                                      </Button>
                                      {link.subtext && (
                                        <span className="text-[10px] text-muted-foreground text-center leading-tight">
                                          {link.subtext}
                                        </span>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <Button 
                                    asChild
                                    className="w-full bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90"
                                  >
                                    <a 
                                      href={recurso.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      onClick={(e) => {
                                        if (recurso.url === "#") {
                                          e.preventDefault();
                                          toast.info(`O recurso "${recurso.title}" estará dispoñible pronto.`);
                                        } else {
                                          toast.success(`Accedendo a "${recurso.title}"...`);
                                        }
                                      }}
                                    >
                                      Acceder
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Private Resources */}
            {privateRecursos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold">Recursos protexidos</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {privateRecursos.map((recurso) => {
                    const IconComponent = iconMap[recurso.icon || 'Link'] || LinkIcon;
                    return (
                      <Card key={recurso._id} className="border-2 border-border hover:shadow-lg transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-accent rounded-sm flex items-center justify-center flex-shrink-0">
                              <IconComponent className="text-accent-foreground" size={24} />
                            </div>
                            <div className="flex-grow">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-display font-bold text-lg">{recurso.title}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground mb-4">
                                {recurso.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {recurso.links && recurso.links.length > 0 ? (
                                  recurso.links.map((link, idx) => (
                                    <div key={idx} className="flex-1 min-w-[120px] flex flex-col gap-1">
                                      <Button 
                                        asChild
                                        className="w-full bg-accent text-accent-foreground border-2 border-accent hover:bg-accent/90"
                                      >
                                        <a 
                                          href={link.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          onClick={(e) => {
                                            if (link.url === "#") {
                                              e.preventDefault();
                                              toast.info(`O recurso "${recurso.title}" estará dispoñible pronto.`);
                                            } else {
                                              toast.success(`Accedendo a "${recurso.title}"...`);
                                            }
                                          }}
                                        >
                                          {link.label || "Acceder"}
                                        </a>
                                      </Button>
                                      {link.subtext && (
                                        <span className="text-[10px] text-muted-foreground text-center leading-tight">
                                          {link.subtext}
                                        </span>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <Button 
                                    asChild
                                    className="w-full bg-accent text-accent-foreground border-2 border-accent hover:bg-accent/90"
                                  >
                                    <a 
                                      href={recurso.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      onClick={(e) => {
                                        if (recurso.url === "#") {
                                          e.preventDefault();
                                          toast.info(`O recurso "${recurso.title}" estará dispoñible pronto.`);
                                        } else {
                                          toast.success(`Accedendo a "${recurso.title}"...`);
                                        }
                                      }}
                                    >
                                      Acceder
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {publicRecursos.length === 0 && privateRecursos.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Aínda non hai recursos dispoñibles. Volve máis tarde!</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
