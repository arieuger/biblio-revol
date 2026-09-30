import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Calendar, Vote, ShieldCheck, Zap, Globe, Banknote, CreditCard, Wallet, CheckCircle2, Copy, Check, Coins, Smartphone, Bean, Sprout, Club } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function HazteSocio() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success("Copiado ao portapapeis");
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-primary text-primary-foreground border-b-2 border-foreground/20 py-12 md:py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Asóciate
            </h1>
            <p className="text-lg text-primary-foreground/90 leading-relaxed">
              A sustentabilidade económica da Revolteira depende exclusivamente das persoas que a habitan. O teu apoio fai isto posible.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container py-12 md:py-16">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Por un espazo aberto e independente */}
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Por un espazo aberto e independente
            </h2>
            <div className="prose prose-lg max-w-none prose-p:text-foreground prose-strong:text-foreground space-y-6">
              <p>
                Hai moitas maneiras de colaborar: participar das tarefas de mantemento, da xestión, doar material... Pero da colaboración económica depende poder facer fronte a gastos como o aluguer, a luz e a auga, é dicir, a viabilidade do centro social, de acordo cos seus principios: toda a nosa actividade é de acceso gratuíto e libre de barreiras económicas e temos autonomía con respecto a partidos políticos, institucións ou entes privados. Tampouco nos lucramos con isto. Só nos debemos ás persoas que sosteñen o centro social por compromiso político e cultural.
              </p>
              <p>
                Podes contribuír economicamente asociándote ou mediante achegas puntuais. Toda axuda é benvida, e se che resultan excesivas as cotas suxeridas podes decidir outra cantidade para axustala ás túas circunstancias. Cubre o seguinte formulario para asociarte:
              </p>
            </div>
          </div>

          {/* Opcións de Pago */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Cotas */}
            <Card className="border-2 border-border bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <Banknote className="text-primary-foreground" size={24} />
                </div>
                <h3 className="font-display font-bold text-xl">Cotas suxeridas</h3>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">10€</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">15€</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">20€</span>
                    <span className="text-muted-foreground">/mes</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ou a cantidade que se axuste ás túas circunstancias.
                </p>
              </CardContent>
            </Card>

            {/* Frecuencia */}
            <Card className="border-2 border-border bg-accent/5">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-4">
                  <Calendar className="text-accent-foreground" size={24} />
                </div>
                <h3 className="font-display font-bold text-xl">Frecuencia</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Bean className="text-accent" size={20} />
                    <span className="font-medium">Mensual</span>
                  </li>
                  <li className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Sprout className="text-accent" size={20} />
                      <span className="font-medium">Trimestral</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground ml-7 leading-tight">
                      (Pagos en xaneiro, abril, xullo e outubro)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Club className="text-accent" size={20} />
                    <span className="font-medium">Anual</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Ti decides como organizar os teus pagos.
                </p>
              </CardContent>
            </Card>

            {/* Métodos */}
            <Card className="border-2 border-border bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
                  <Wallet className="text-primary-foreground" size={24} />
                </div>
                <h3 className="font-display font-bold text-xl">Métodos de pago</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 font-medium">
                    <Coins className="text-primary" size={18} /> Ao contado
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <Smartphone className="text-primary" size={18} /> Bizum
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CreditCard className="text-primary" size={18} /> Transferencia
                    <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Preferible</span>
                  </li>
                </ul>
                <div className="bg-background/50 p-3 rounded-sm border border-border/50">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Recomendación</p>
                  <p className="text-xs text-muted-foreground">Programar as transferencias axúdanos moito na xestión!</p>
                </div>
                <div className="pt-2 border-t border-border/20 space-y-3">
                  <p className="text-sm font-bold">Doazóns puntuais</p>
                  <div className="text-xs space-y-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">IBAN:</span>
                      <div className="flex items-center justify-between bg-background/50 p-2 rounded border border-border/30 group">
                        <span className="font-mono truncate mr-2">ES29 3070 0032 9563 0923 8423</span>
                        <button 
                          onClick={() => copyToClipboard("ES29 3070 0032 9563 0923 8423", "iban")}
                          className="p-1 hover:bg-primary/10 rounded transition-colors text-primary"
                          title="Copiar IBAN"
                        >
                          {copiedField === "iban" ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-primary font-bold px-1">Titular: Revolteira</p>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase">Bizum:</span>
                      <div className="flex items-center justify-between bg-background/50 p-2 rounded border border-border/30 group">
                        <span className="font-mono">+34 659994248</span>
                        <button 
                          onClick={() => copyToClipboard("+34 659994248", "bizum")}
                          className="p-1 hover:bg-primary/10 rounded transition-colors text-primary"
                          title="Copiar Bizum"
                        >
                          {copiedField === "bizum" ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <p className="text-primary font-bold px-1">Concepto: Doazón Revolteira</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulario Cryptpad */}
          <div className="space-y-8">
            <div className="relative w-full rounded-xl border-2 border-border bg-[#f5f2eb] shadow-md overflow-hidden" style={{ height: "900px" }}>
              <iframe 
                src="https://cryptpad.fr/form/#/2/form/view/VKPAjOPEonp-SwsABqofUFDD4OgBnOy7Q4Ovv8hZdo0/embed/"
                className="absolute inset-0 w-full h-full border-none"
                title="Formulario para asociarse"
                style={{ 
                  filter: "sepia(0.1) contrast(0.9) brightness(1.05)", 
                }}
              ></iframe>
            </div>
            <div className="text-center text-sm text-muted-foreground mt-4 italic">
              Se tes problemas para visualizar o formulario, podes abrilo directamente <a href="https://cryptpad.fr/form/#/2/form/view/VKPAjOPEonp-SwsABqofUFDD4OgBnOy7Q4Ovv8hZdo0/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">nesta ligazón</a>.
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
