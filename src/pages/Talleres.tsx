import { withBase } from "@/lib/site-path";
/*
Design: Brutalismo Digital Suavizado
- Grid de talleres con información detallada
- Categorización por frecuencia (semanal/mensual)
*/

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Taller {
  id: number;
  title: string;
  description: string;
  frequency: "Semanal" | "Mensual";
  day: string;
  time: string;
  location: string;
  capacity: string;
  image: string;
  category: string;
}

const talleres: Taller[] = [
  {
    id: 1,
    title: "Horta Urbana Comunitaria",
    description: "Aprende técnicas de cultivo ecolóxico, compostaxe e permacultura. Cultivamos xuntos un espazo verde no barrio.",
    frequency: "Semanal",
    day: "Sábados",
    time: "10:00 - 13:00",
    location: "Huerto del Centro",
    capacity: "15 personas",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80",
    category: "Sostenibilidad"
  },
  {
    id: 2,
    title: "Taller de Serigrafía",
    description: "Técnicas de impresión artesanal para crear carteis, camisetas e materiais gráficos. Arte e activismo unidos.",
    frequency: "Mensual",
    day: "Primeiro domingo",
    time: "11:00 - 14:00",
    location: "Sala de Arte",
    capacity: "12 personas",
    image: "https://private-us-east-1.manuscdn.com/sessionFile/KNTpSa0xaRG5nnEcLNY6sJ/sandbox/cqcO7kPCIbEsbWbd3TBMrj-img-2_1770918460000_na1fn_d29ya3Nob3BzLWNyZWF0aXZl.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvS05UcFNhMHhhUkc1bm5FY0xOWTZzSi9zYW5kYm94L2NxY083a1BDSWJFc2JXYmQzVEJNcmotaW1nLTJfMTc3MDkxODQ2MDAwMF9uYTFmbl9kMjl5YTNOb2IzQnpMV055WldGMGFYWmwucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=oEVbuuNQ-74N0Z6P~yj2QdRafp02HqeHg7Jky67muMpy9rGL6c0hXwvxxagc2bIN4UvoA7YwDQUesE32Jsp4h8Tqam~Uf6~BmBEkmilgIPYr8KJ1Kzu89AnwJ5fZwekak9iA7quk5ZF2l7GVE2YqTdm5x60y-k8NMO7c7i6Pu112nIlIXqJ3wNvjNAQjJqj-UDfk8Z03I26qTt-Sk8YenyNBc0GourneJg5fHd-Xx1D1S~U0H9bESNakQSLsgq3ZmiFBvPtmSEgICPMdzw7CiaUKRk~33ES~o1i2PSDdRveW6Ib09qY3G2HRBcfQL26r6pXEx8HGZYy6oTx4VlOCYw__",
    category: "Arte"
  },
  {
    id: 3,
    title: "Costura e Reparación Textil",
    description: "Aprende a reparar a túa roupa, alargar a súa vida útil e reducir o consumo. Técnicas básicas de costura a man e máquina.",
    frequency: "Semanal",
    day: "Mércores",
    time: "18:00 - 20:00",
    location: "Sala Polivalente",
    capacity: "10 personas",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    category: "Sostenibilidad"
  },
  {
    id: 4,
    title: "Reparación de Bicicletas",
    description: "Taller de mecánica básica de bicicletas. Aprende a manter e reparar a túa bici de forma autónoma.",
    frequency: "Semanal",
    day: "Venres",
    time: "17:00 - 19:00",
    location: "Patio exterior",
    capacity: "8 personas",
    image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80",
    category: "Autogestión"
  },
  {
    id: 5,
    title: "Grupo de Lectura Feminista",
    description: "Espazo de lectura e debate sobre teoría feminista, xénero e luchas sociais. Cada mes un libro diferente.",
    frequency: "Mensual",
    day: "Terceiro xoves",
    time: "19:00 - 21:00",
    location: "Biblioteca",
    capacity: "20 personas",
    image: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80",
    category: "Formación"
  },
  {
    id: 6,
    title: "Yoga Comunitario",
    description: "Sesiones de yoga accesibles para todos os niveis. Donativo consciente para sostener o espazo.",
    frequency: "Semanal",
    day: "Martes e Xoves",
    time: "19:30 - 20:45",
    location: "Sala Grande",
    capacity: "15 personas",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    category: "Bienestar"
  }
];

export default function Talleres() {
  const handleJoinWorkshop = (title: string) => {
    toast.success(`Interés rexistrado en: ${title}`, {
      description: "Contactaremos pronto con máis información."
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section 
        className="relative h-[400px] overflow-hidden border-b-2 border-border"
        style={{
          backgroundImage: `url('https://private-us-east-1.manuscdn.com/sessionFile/KNTpSa0xaRG5nnEcLNY6sJ/sandbox/cqcO7kPCIbEsbWbd3TBMrj-img-2_1770918460000_na1fn_d29ya3Nob3BzLWNyZWF0aXZl.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvS05UcFNhMHhhUkc1bm5FY0xOWTZzSi9zYW5kYm94L2NxY083a1BDSWJFc2JXYmQzVEJNcmotaW1nLTJfMTc3MDkxODQ2MDAwMF9uYTFmbl9kMjl5YTNOb2IzQnpMV055WldGMGFYWmwucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvS05UcFNhMHhhUkc1bm5FY0xOWTZzSi9zYW5kYm94L2NxY083a1BDSWJFc2JXYmQzVEJNcmotaW1nLTJfMTc3MDkxODQ2MDAwMF9uYTFmbl9kMjl5YTNOb2IzQnpMV055WldGMGFYWmwucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=oEVbuuNQ-74N0Z6P~yj2QdRafp02HqeHg7Jky67muMpy9rGL6c0hXwvxxagc2bIN4UvoA7YwDQUesE32Jsp4h8Tqam~Uf6~BmBEkmilgIPYr8KJ1Kzu89AnwJ5fZwekak9iA7quk5ZF2l7GVE2YqTdm5x60y-k8NMO7c7i6Pu112nIlIXqJ3wNvjNAQjJqj-UDfk8Z03I26qTt-Sk8YenyNBc0GourneJg5fHd-Xx1D1S~U0H9bESNakQSLsgq3ZmiFBvPtmSEgICPMdzw7CiaUKRk~33ES~o1i2PSDdRveW6Ib09qY3G2HRBcfQL26r6pXEx8HGZYy6oTx4VlOCYw__')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background"></div>
        <div className="relative container h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-foreground">Talleres</h1>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Espacios de aprendizaxe colectiva onde compartimos coñecementos, 
              desenvolvemos habilidades e construímos comunidade.
            </p>
          </div>
        </div>
      </section>

      {/* Talleres Grid */}
      <section className="container py-12 md:py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {talleres.map((taller) => (
            <Card key={taller.id} className="border-2 border-border hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={withBase(taller.image)}
                  alt={taller.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge className={`${taller.frequency === "Semanal" ? "bg-primary" : "bg-accent"} text-primary-foreground border-2 border-foreground/20`}>
                    {taller.frequency}
                  </Badge>
                  <Badge variant="secondary" className="border-2 border-foreground/20">
                    {taller.category}
                  </Badge>
                </div>
              </div>
              <CardContent className="pt-5 flex-1 flex flex-col">
                <h3 className="font-display font-bold text-xl mb-3 leading-tight">
                  {taller.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-1">
                  {taller.description}
                </p>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar size={16} className="text-primary" />
                    <span><span className="font-medium text-foreground">{taller.day}</span> · {taller.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={16} className="text-primary" />
                    <span>{taller.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users size={16} className="text-primary" />
                    <span>Máx. {taller.capacity}</span>
                  </div>
                </div>

                <Button 
                  className="w-full font-semibold border-2 border-foreground/20"
                  onClick={() => handleJoinWorkshop(taller.title)}
                >
                  Mé interesa
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-muted/30 border-y-2 border-border py-12 md:py-16">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-display font-bold mb-6 text-center">Como participar</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Todos os talleres están abertos á participación de calquera persoa interesada, 
              sexas ou non socia do Centro Social. Funcionamos con aportación consciente para cubrir 
              os gastos de materiais.
            </p>
            <p>
              Para inscribirte ou resolver dúbidas, podes pasar polo Centro Social en horario de 
              apertura, escribirnos a <span className="font-medium text-foreground">talleres@centrosocial.org</span> ou 
              contactarnos nas nosas redes sociais.
            </p>
            <p>
              Se tiéns coñecementos que queiras compartir e che gustaría propoer un novo taller, 
              ¡te animamos a facelo! O Centro Social é un espazo de construción colectiva.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
