import { withBase } from "@/lib/site-path";
import { getDecapPost, getDecapPosts } from "@/lib/decap.client";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkDirective from 'remark-directive';
import remarkCarousel from '@/lib/remark-carousel';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronUp, ChevronDown, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import SEO from "@/components/SEO";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from "@/components/ui/carousel";

interface BlogPostData {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage?: string;
  categories?: string[];
  publishedAt: string;
  body?: any;
}

function postDescription(post: BlogPostData): string {
  const text = typeof post.body === "string" ? post.body.replace(/[#*_>`\[\]()]/g, " ").replace(/\s+/g, " ").trim() : "";
  return (text || `Entrada do blog de Revolteira: ${post.title}.`).slice(0, 157).replace(/\s+\S*$/, "").trim() + "…";
}

export default function BlogPost() {
  const [match, params] = useRoute("/blog/:slug");
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(true);

  const GALICIAN_MONTH_LABELS = [
    "xaneiro", "febreiro", "marzo", "abril", "maio", "xuño",
    "xullo", "agosto", "setembro", "outubro", "novembro", "decembro",
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getDate()} de ${GALICIAN_MONTH_LABELS[date.getMonth()]} de ${date.getFullYear()}`;
  };

  useEffect(() => {
    if (!match || !params?.slug) return;

    const fetchPost = async () => {
      try {
        const postData = await getDecapPost(params.slug);
        setPost(postData);
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [match, params?.slug]);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        const decapPosts = await getDecapPosts();
        setAllPosts(decapPosts.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        ));
      } catch (error) {
        console.error("Error fetching posts list:", error);
      } finally {
        setLoadingList(false);
      }
    };

    fetchAllPosts();
  }, []);

  const currentIndex = allPosts.findIndex(item => item.slug?.current === post?.slug?.current);
  const previousPost = currentIndex >= 0 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  // Calcular a páxina na que se atopa o post (30 posts por páxina)
  const POSTS_PER_PAGE = 30;
  const postPage = currentIndex >= 0 ? Math.floor(currentIndex / POSTS_PER_PAGE) + 1 : 1;
  const backUrl = postPage > 1 ? `/blog/paxina/${postPage}` : "/blog";

  return (
    <div className="min-h-screen">
      {post && (
        <SEO 
          title={post.title} 
          description={postDescription(post)}
          image={post.mainImage} 
          type="article"
        />
      )}
      <section className="container py-12 md:py-16">
        <div className="flex flex-col md:flex-row gap-8 items-start w-full">
          <div className="flex flex-col gap-4 w-full md:w-40 flex-shrink-0 md:sticky md:top-24">
            <Link href={backUrl}>
              <Button 
                variant="outline" 
                className="border-2 w-full flex gap-2 justify-start"
              >
                <ChevronLeft size={16} /> Volver
              </Button>
            </Link>
            
            {!loadingList && (
              <div className="flex flex-col gap-2">
                <Link href={nextPost ? `/blog/${nextPost.slug.current}` : "#"}>
                  <Button 
                    variant="outline" 
                    className={`border-2 w-full flex gap-2 justify-start ${!nextPost ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!nextPost}
                  >
                    <ChevronUp size={16} /> Seguinte
                  </Button>
                </Link>
                <Link href={previousPost ? `/blog/${previousPost.slug.current}` : "#"}>
                  <Button 
                    variant="outline" 
                    className={`border-2 w-full flex gap-2 justify-start ${!previousPost ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!previousPost}
                  >
                    <ChevronDown size={16} /> Anterior
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="flex-grow w-full md:w-auto">
            {loading ? (
              <div className="text-center py-12"><p>Cargando entrada...</p></div>
            ) : !post ? (
              <div className="text-center py-12"><p>Non se atopou a entrada.</p></div>
            ) : (
              <article className="max-w-4xl">
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories && post.categories.length > 0 && post.categories.map(cat => (
                    <Badge key={cat} variant="secondary" className="border-2 border-foreground/20">
                      {cat === "comunicados" ? "Comunicados" : 
                       cat === "programacion-mensual" ? "Programación mensual" :
                       cat === "actividades" ? "Actividades" : cat}
                    </Badge>
                  ))}
                </div>

                <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{post.title}</h1>

                <div className="flex items-center gap-2 text-sm text-muted-foreground border-b border-border pb-6 mb-8">
                  <Calendar size={16} className="text-primary" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>

                <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:font-bold prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-img:max-w-full prose-img:h-auto">
                  {post.body && (
                    <ReactMarkdown 
                      rehypePlugins={[rehypeRaw]}
                      remarkPlugins={[remarkDirective, remarkCarousel]}
                      components={{
                        div: ({ node, className, children, ...props }) => {
                          if (className === 'custom-carousel') {
                            // Extraemos só as imaxes dos fillos
                            const extractImages = (children: any): any[] => {
                              let imgs: any[] = [];
                              if (Array.isArray(children)) {
                                children.forEach(child => {
                                  imgs = imgs.concat(extractImages(child));
                                });
                              } else if (children?.type === 'img' && children?.props?.src) {
                                // Elemento img de React
                                imgs.push(children.props);
                              } else if (children?.props?.src) {
                                // Pode ser un elemento con propiedade src
                                imgs.push(children.props);
                              } else if (children?.props?.children) {
                                // Buscar nos fillos
                                imgs = imgs.concat(extractImages(children.props.children));
                              }
                              return imgs;
                            };

                            const carouselImages = extractImages(children);

                            if (carouselImages.length === 0) return null;

                            // Calcular a altura máxima das imaxes cargadas
                            const [maxHeight, setMaxHeight] = useState(0);
                            const [maxWidth, setMaxWidth] = useState(896); // max-w-4xl por defecto
                            const [imageDimensions, setImageDimensions] = useState<{[key: number]: {width: number, height: number}}>({});
                            const [isMobile, setIsMobile] = useState(false);
                            const [maxViewportHeight, setMaxViewportHeight] = useState(0);

                            useEffect(() => {
                              const checkMobile = () => {
                                setIsMobile(window.innerWidth < 768);
                              };
                              checkMobile();
                              window.addEventListener('resize', checkMobile);
                              return () => window.removeEventListener('resize', checkMobile);
                            }, []);

                            useEffect(() => {
                              const calculateMaxHeight = () => {
                                if (isMobile) return;
                                // Obter a altura do encabezado (nav/header)
                                const header = document.querySelector('header') || document.querySelector('nav');
                                const headerHeight = header ? header.offsetHeight : 80; // Valor por defecto de 80px
                                // Altura máxima = altura da pantalla visible - altura do encabezado
                                const maxH = window.innerHeight - headerHeight;
                                setMaxViewportHeight(maxH);
                              };
                              calculateMaxHeight();
                              window.addEventListener('resize', calculateMaxHeight);
                              return () => window.removeEventListener('resize', calculateMaxHeight);
                            }, [isMobile]);

                            const handleImageLoad = (index: number, img: HTMLImageElement) => {
                              if (isMobile) return;

                              const newDimensions = {...imageDimensions};
                              newDimensions[index] = {width: img.naturalWidth, height: img.naturalHeight};
                              setImageDimensions(newDimensions);
                              
                              // O ancho do contedor estándar é max-w-4xl (896px)
                              const defaultContainerWidth = 896; 
                              const arrowsPadding = 128; // px-16 a cada lado
                              const defaultContentWidth = defaultContainerWidth - arrowsPadding;
                              
                              let maxH = 0;
                              let maxRatio = 0; // ratio height/width
                              
                              Object.values(newDimensions).forEach((dims: any) => {
                                const ratio = dims.height / dims.width;
                                if (ratio > maxRatio) maxRatio = ratio;
                                
                                const scaledHeight = ratio * defaultContentWidth;
                                if (scaledHeight > maxH) maxH = scaledHeight;
                              });
                              
                              // Se a altura máxima supera o viewport, reducimos o ancho
                              let finalContainerWidth = defaultContainerWidth;
                              if (maxViewportHeight > 0 && maxH > maxViewportHeight) {
                                maxH = maxViewportHeight;
                                // Recalcular o ancho necesario para que a imaxe máis alta caiba nesa altura
                                // contentWidth = height / ratio
                                const newContentWidth = maxH / maxRatio;
                                finalContainerWidth = newContentWidth + arrowsPadding;
                              }
                              
                              setMaxHeight(maxH);
                              setMaxWidth(finalContainerWidth);
                            };

                            return (
                              <div className="my-8">
                                <Carousel 
                                  className="w-full mx-auto relative"
                                  style={{ maxWidth: isMobile ? '100%' : `${maxWidth}px`, overflow: 'hidden' }}
                                  opts={{
                                    align: "start",
                                    loop: true,
                                    skipSnaps: false,
                                  }}
                                >
                                  <CarouselContent className={isMobile ? "-ml-2" : "-ml-2 md:-ml-4"}>
                                    {carouselImages.map((img, index) => (
                                      <CarouselItem key={`carousel-img-${index}`} className={isMobile ? "pl-2 basis-full" : "pl-2 md:pl-4 basis-full"}>
                                        <div 
                                          className={`flex items-center justify-center overflow-hidden rounded-lg ${isMobile ? '' : 'px-16'}`}
                                          style={{
                                            height: (!isMobile && maxHeight > 0) ? `${maxHeight}px` : 'auto',
                                            backgroundColor: 'transparent'
                                          }}
                                        >
                                          <img 
                                            src={withBase(img.src)}
                                            alt={img.alt || `Imaxe ${index + 1}`} 
                                            className={isMobile ? "w-full h-auto max-h-96 object-contain" : "w-full h-full object-contain"}
                                            style={isMobile ? { maxWidth: '100%', display: 'block' } : {}}
                                            onLoad={(e) => handleImageLoad(index, e.currentTarget)}
                                          />
                                        </div>
                                      </CarouselItem>
                                    ))}
                                  </CarouselContent>
                                  {/* Frechas laterais para escritorio */}
                                  {!isMobile && (
                                    <div className="hidden md:flex absolute pointer-events-none px-2 left-0 right-0" style={{
                                      top: maxHeight > 0 ? `${maxHeight / 2}px` : '50%',
                                      transform: 'translateY(-50%)',
                                      justifyContent: 'space-between'
                                    }}>
                                      <CarouselPrevious className="relative left-0 translate-x-0 pointer-events-auto" />
                                      <CarouselNext className="relative right-0 translate-x-0 pointer-events-auto" />
                                    </div>
                                  )}
                                  {/* Puntos indicadores */}
                                  <div className="flex justify-center" style={{marginTop: (!isMobile && maxHeight > 0) ? '1rem' : '1rem'}}>
                                    <CarouselDots />
                                  </div>
                                </Carousel>
                              </div>
                            );
                          }
                          return <div className={className} {...props}>{children}</div>;
                        }
                      }}
                    >
                      {post.body}
                    </ReactMarkdown>
                  )}
                </div>
              </article>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
