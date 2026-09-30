import { withBase } from "@/lib/site-path";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getDecapPosts } from "@/lib/decap.client";
import { Link, useRoute, useLocation } from "wouter";
import SEO from "@/components/SEO";

interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage?: string;
  categories?: string[];
  publishedAt: string;
  body?: any;
}

const POSTS_PER_PAGE = 30;

const GALICIAN_MONTH_LABELS = [
  "Xaneiro", "Febreiro", "Marzo", "Abril", "Maio", "Xuño",
  "Xullo", "Agosto", "Setembro", "Outubro", "Novembro", "Decembro"
];

const GALICIAN_MONTH_LABELS_LOWERCASE = [
  "xaneiro", "febreiro", "marzo", "abril", "maio", "xuño",
  "xullo", "agosto", "setembro", "outubro", "novembro", "decembro"
];

const GALICIAN_DAY_LABELS = ["D", "L", "M", "Me", "X", "V", "S"];

const formatGalicianDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const month = GALICIAN_MONTH_LABELS_LOWERCASE[date.getMonth()] || "";
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
};

const formatDateForInput = (date: Date | undefined) => {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDateInput = (value: string): Date | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
  return new Date(year, month - 1, day);
};

const CATEGORIES = [
  { value: "todas", label: "Todas" },
  { value: "comunicados", label: "Comunicados" },
  { value: "programacion-mensual", label: "Programación mensual" },
  { value: "actividades", label: "Actividades" },
];

// Custom Galician Calendar Component
function GalicianCalendar({ 
  selected, 
  onSelect,
  onOpenChange
}: { 
  selected: Date | undefined; 
  onSelect: (date: Date | undefined) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => selected || new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handleYearPrev = () => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year - 1);
    setCurrentMonth(newDate);
  };

  const handleYearNext = () => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(year + 1);
    setCurrentMonth(newDate);
  };

  const handleMonthPrev = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(month - 1);
    setCurrentMonth(newDate);
  };

  const handleMonthNext = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(month + 1);
    setCurrentMonth(newDate);
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(year, month, day);
    onSelect(newDate);
    onOpenChange?.(false);
  };

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust so Monday = 0

  const days: (number | null)[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const isSelected = (day: number) => {
    if (!selected) return false;
    return selected.getDate() === day && 
           selected.getMonth() === month && 
           selected.getFullYear() === year;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  return (
    <div className="p-3 w-[280px] min-h-[360px]">
      {/* Year selector */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleYearPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold text-sm">
          {year}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleYearNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleMonthPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="font-semibold text-sm">
          {GALICIAN_MONTH_LABELS[month]}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleMonthNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {GALICIAN_DAY_LABELS.map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-muted-foreground h-8 flex items-center justify-center">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-8" />;
          }

          const selected = isSelected(day);
          const today = isToday(day);

          return (
            <Button
              key={day}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 font-normal ${
                selected ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''
              } ${
                today && !selected ? 'bg-accent' : ''
              }`}
              onClick={() => handleDayClick(day)}
            >
              {day}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

export default function Blog() {
  const [match, params] = useRoute("/blog/paxina/:page");
  const [, setLocation] = useLocation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Sincronizar a páxina da URL co estado local
  useEffect(() => {
    if (match && params?.page) {
      const p = parseInt(params.page);
      if (!isNaN(p) && p > 0) {
        setPage(p);
      }
    } else {
      setPage(1);
    }
  }, [match, params?.page]);

  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedTag, setSelectedTag] = useState("todas");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const decapPosts = await getDecapPosts();
        setPosts(decapPosts.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        ));
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Sync calendar selection with input
  useEffect(() => {
    if (dateFrom) {
      setDateFromInput(formatDateForInput(dateFrom));
    }
  }, [dateFrom]);

  useEffect(() => {
    if (dateTo) {
      setDateToInput(formatDateForInput(dateTo));
    }
  }, [dateTo]);

  // Parse input when user types
  const handleDateFromInputChange = (value: string) => {
    setDateFromInput(value);
    const parsed = parseDateInput(value);
    if (parsed) {
      setDateFrom(parsed);
      setLocation("/blog");
    } else if (value === "") {
      setDateFrom(undefined);
      setLocation("/blog");
    }
  };

  const handleDateToInputChange = (value: string) => {
    setDateToInput(value);
    const parsed = parseDateInput(value);
    if (parsed) {
      setDateTo(parsed);
      setLocation("/blog");
    } else if (value === "") {
      setDateTo(undefined);
      setLocation("/blog");
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const date = new Date(post.publishedAt);
      
      // Normalizar as datas para comparar só o día (sen horas)
      const postDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      let afterFrom = true;
      if (dateFrom) {
        const fromDateNormalized = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
        afterFrom = postDate >= fromDateNormalized;
      }

      let beforeTo = true;
      if (dateTo) {
        const toDateNormalized = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());
        beforeTo = postDate <= toDateNormalized;
      }

      let matchesTag = true;
      if (selectedTag !== "todas") {
        matchesTag = post.categories?.includes(selectedTag) || false;
      }

      return afterFrom && beforeTo && matchesTag;
    });
  }, [posts, dateFrom, dateTo, selectedTag]);

  const currentPosts = filteredPosts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);

  const handleClearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setDateFromInput("");
    setDateToInput("");
    setSelectedTag("todas");
    setLocation("/blog");
  };

  const hasActiveFilters = dateFrom || dateTo || selectedTag !== "todas";

  // AVISO: Se modificas o texto da descrición do blog, 
  // lembra que tamén se utiliza como descrición para os Open Graphs (SEO).
  const blogDescription = "Novidades, actividades, crónicas e comunicados da Revolteira.";

  return (
    <div className="min-h-screen">
      <SEO title="Blog" description={blogDescription} />
      <section className="relative bg-muted/30 border-b-2 border-border py-12 md:pt-24 md:pb-16 overflow-hidden">
        <img 
          src={withBase("/assets/hedra.png")}
          alt="" 
          className="absolute top-0 left-0 w-full h-auto min-h-[40px] object-cover opacity-80 pointer-events-none"
          aria-hidden="true"
        />
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {blogDescription}
          </p>
        </div>
      </section>

      <section className="container py-12 md:py-16 space-y-12">
        {/* Listado de posts */}
        {loading ? (
          <div className="text-center py-12"><p>Cargando entradas...</p></div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg mb-4">Non se atoparon entradas cos filtros seleccionados.</p>
            {hasActiveFilters && (
              <Button variant="outline" className="border-2" onClick={handleClearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Paginación Superior */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mb-8">
                <Link href={page > 2 ? `/blog/paxina/${page - 1}` : "/blog"}>
                  <Button
                    variant="outline"
                    className="border-2 px-3 md:px-4"
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} /> <span className="hidden sm:inline ml-2">Anterior</span>
                  </Button>
                </Link>
                <div className="flex items-center px-2 md:px-4 text-sm font-medium whitespace-nowrap">
                  Páxina {page} de {totalPages}
                </div>
                <Link href={page < totalPages ? `/blog/paxina/${page + 1}` : "#"}>
                  <Button
                    variant="outline"
                    className="border-2 px-3 md:px-4"
                    disabled={page === totalPages}
                  >
                    <span className="hidden sm:inline mr-2">Seguinte</span> <ChevronRight size={16} />
                  </Button>
                </Link>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPosts.map(post => (
                <Link key={post._id} href={`/blog/${post.slug.current}`}>
                  <Card className="h-full cursor-pointer gap-0 overflow-hidden border-2 border-border transition-shadow hover:shadow-lg">
                    <div className="aspect-video overflow-hidden border-b-2 border-border bg-muted">
                      <img 
                        src={withBase(post.mainImage || '/images/default-post.png')}
                        alt={post.title} 
                        className="w-full h-full object-cover max-w-full" 
                      />
                    </div>
                    <CardContent className="flex flex-1 flex-col space-y-3 p-6">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {post.categories && post.categories.length > 0 && post.categories.map(cat => (
                            <Badge key={cat} variant="secondary" className="border border-border">
                              {cat === "comunicados" ? "Comunicados" : 
                               cat === "programacion-mensual" ? "Programación mensual" :
                               cat === "actividades" ? "Actividades" : cat}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">{formatGalicianDate(post.publishedAt)}</p>
                        <h3 className="text-xl font-bold leading-tight">{post.title}</h3>
                      </div>
                      
	                      {/* Extracto do post */}
	                      {post.body && (
	                        <div className="text-sm text-muted-foreground overflow-hidden line-clamp-3 break-words">
	                          {typeof post.body === 'string' 
	                            ? post.body
	                                .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '') // Eliminar enlaces HTML (incluíndo imaxes dentro)
	                                .replace(/<img\b[^>]*>/gi, '')              // Eliminar etiquetas img HTML
	                                .replace(/<[^>]*>/g, '')                    // Eliminar calquera outra etiqueta HTML
                                .replace(/!\[.*?\]\(.*?\)/g, '')            // Eliminar imaxes Markdown ![alt](url)
                                .replace(/\[.*?\]\(.*?\)/g, '')             // Eliminar enlaces Markdown [texto](url)
                                .replace(/::\:\w+\n([\s\S]*?)\n:::/g, '')     // Eliminar bloques de directivas (:::carousel :::, etc)
                                .replace(/[#*`>]/g, '')                     // Eliminar caracteres de formato MD
	                                .replace(/\s+/g, ' ')                       // Normalizar espazos
	                                .trim()
	                                .slice(0, 300)
	                            : "Ver entrada para ler o contido"}
	                        </div>
	                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Paginación Inferior */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Link href={page > 2 ? `/blog/paxina/${page - 1}` : "/blog"}>
                  <Button
                    variant="outline"
                    className="border-2 px-3 md:px-4"
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} /> <span className="hidden sm:inline ml-2">Anterior</span>
                  </Button>
                </Link>
                <div className="flex items-center px-2 md:px-4 text-sm font-medium whitespace-nowrap">
                  Páxina {page} de {totalPages}
                </div>
                <Link href={page < totalPages ? `/blog/paxina/${page + 1}` : "#"}>
                  <Button
                    variant="outline"
                    className="border-2 px-3 md:px-4"
                    disabled={page === totalPages}
                  >
                    <span className="hidden sm:inline mr-2">Seguinte</span> <ChevronRight size={16} />
                  </Button>
                </Link>
              </div>
            )}

            {/* Filtros ao final da páxina */}
            <div className="space-y-6 p-6 border-2 border-border rounded-sm bg-card mt-12">
              <h3 className="font-bold text-lg">Filtrar resultados</h3>
              
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Filtros por data (esquerda) */}
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-3">Filtrar por data</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Data desde */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Desde</label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="dd/mm/aaaa"
                          value={dateFromInput}
                          onChange={(e) => handleDateFromInputChange(e.target.value)}
                          className="border-2"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-2 flex-shrink-0"
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <GalicianCalendar
                              selected={dateFrom}
                              onSelect={(date) => {
                                setDateFrom(date);
                                setLocation("/blog");
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <p className="text-xs text-muted-foreground">Formato: dd/mm/aaaa</p>
                    </div>

                    {/* Data ata */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ata</label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="dd/mm/aaaa"
                          value={dateToInput}
                          onChange={(e) => handleDateToInputChange(e.target.value)}
                          className="border-2"
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="border-2 flex-shrink-0"
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <GalicianCalendar
                              selected={dateTo}
                              onSelect={(date) => {
                                setDateTo(date);
                                setLocation("/blog");
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <p className="text-xs text-muted-foreground">Formato: dd/mm/aaaa</p>
                    </div>
                  </div>
                </div>

                {/* Filtro por etiqueta (dereita) */}
                <div className="lg:w-64">
                  <h4 className="text-sm font-medium mb-3">Filtrar por etiqueta</h4>
                  <div className="space-y-2">
                    <label htmlFor="category-select" className="text-sm font-medium">Etiqueta</label>
                    <select
                      id="category-select"
                      value={selectedTag}
                      onChange={(e) => {
                        setSelectedTag(e.target.value);
                        setLocation("/blog");
                      }}
                      className="w-full h-10 px-3 border-2 border-input rounded-md bg-background text-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 focus:outline-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Botón limpar filtros e contador */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-border pt-4">
                <div className="text-sm text-muted-foreground">
                  Amosando {filteredPosts.length} {filteredPosts.length === 1 ? "entrada" : "entradas"}
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    className="border-2"
                    onClick={handleClearFilters}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
