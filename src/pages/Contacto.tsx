import { useState, useCallback } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import Captcha from "@/components/Captcha";

export default function Contacto() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCaptchaSuccess = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaError = useCallback(() => {
    setCaptchaToken(null);
    alert("Erro ao verificar o captcha. Por favor, intenta de novo.");
  }, []);

  const handleCaptchaExpire = useCallback(() => {
    setCaptchaToken(null);
  }, []);

  const handleInvalidMessage = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target.validity.valid) {
      if (target.id === "email") {
        if (target.validity.valueMissing) {
          target.setCustomValidity("Completa este campo para enviar o formulario");
        } else if (target.validity.typeMismatch) {
          target.setCustomValidity("Engade un enderezo de correo válido");
        }
      } else {
        if (target.validity.valueMissing) {
          target.setCustomValidity("Completa este campo para enviar o formulario");
        }
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    target.setCustomValidity("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Validation for all fields
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      alert("Mensaxe non enviada. É obrigatorio cubrir o nome, o correo electrónico e a mensaxe para completar o formulario.");
      return;
    }

    // hCaptcha validation
    if (!captchaToken) {
      alert("Por favor, completa o captcha de seguridade.");
      return;
    }

    setIsSubmitting(true);

    try {
      const finalName = formData.name.trim();
      const finalEmail = formData.email.trim();
      
      // Usamos FormData que é o máis fiable para Web3Forms
      const form = new FormData();
      const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
      if (!accessKey) {
        alert("Configuración incompleta: falta a clave de Web3Forms. Contacta co administrador.");
        setIsSubmitting(false);
        return;
      }
      form.append("access_key", accessKey);
      
      // Campos estándar
      form.append("name", finalName);
      form.append("email", finalEmail);
      form.append("message", formData.message);
      form.append("h-captcha-response", captchaToken);

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          name: "",
          email: "",
          message: "",
        });
        setCaptchaToken(null);
        alert("Mensaxe enviada correctamente. Grazas!");
      } else {
        alert(data.message || "Erro ao enviar a mensaxe. Por favor, intenta de novo.");
      }
    } catch (error) {
      alert("Erro de conexión. Por favor, intenta de novo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <section className="relative bg-muted/30 border-b-2 border-border py-12 md:pt-24 md:pb-16 overflow-hidden">
        <img 
          src="/assets/hedra.png" 
          alt="" 
          className="absolute top-0 left-0 w-full h-auto min-h-[40px] object-cover opacity-80 pointer-events-none"
          aria-hidden="true"
        />
        <div className="container relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Contacto</h1>
          <div className="text-lg text-muted-foreground max-w-3xl space-y-4">
            <p>
              Achégate ao local ou escríbenos a través das redes sociais ou, preferiblemente, ao correo electrónico (
              <a href="mailto:contacto@example.org" className="text-primary underline hover:text-primary/80 transition-colors">
                contacto@example.org
              </a>
              ) para todo aquilo que queiras consultar, ofrecer ou comunicarnos.
            </p>
            <p>
              Se queres propoñer algunha actividade ou contactar coa Comisión de Conflitos a continuación indícase como facelo.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-12 md:py-16">
        <Tabs defaultValue="propoñer" className="w-full max-w-5xl mx-auto">
          <div className="w-full overflow-x-auto md:overflow-x-visible pb-2 mb-8 scrollbar-hide">
            <TabsList className="!flex !w-max md:!w-full !h-auto !p-0 !bg-transparent !border-b !border-border !rounded-none !justify-start !gap-8 !min-w-full md:!min-w-0">
              <TabsTrigger 
                value="propoñer" 
                className="!py-3 !px-1 !text-base !font-bold !bg-transparent !text-muted-foreground data-[state=active]:!text-accent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!border-b-4 data-[state=active]:!border-accent !rounded-none !border-x-0 !border-t-0 !border-transparent !transition-all !whitespace-nowrap"
              >
                Propoñer actividade
              </TabsTrigger>
              <TabsTrigger 
                value="conflitos" 
                className="!py-3 !px-1 !text-base !font-bold !bg-transparent !text-muted-foreground data-[state=active]:!text-accent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none data-[state=active]:!border-b-4 data-[state=active]:!border-accent !rounded-none !border-x-0 !border-t-0 !border-transparent !transition-all !whitespace-nowrap"
              >
                Contactar coa Comisión de Conflitos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="propoñer" className="space-y-8 animate-in fade-in duration-500">
            <div className="prose prose-lg max-w-none prose-p:text-foreground prose-strong:text-foreground">
              <p>
                O noso espazo berra "dáme vida!", e iso implica darlle uso e agarimo. E nós o agarimo dámosllo desde o contacto presencial coas persoas que o habitan e facéndoas partícipes das decisións que se toman nas asembleas mensuais. Por iso, se queres empregar o espazo encantaríanos ter a ocasión de coñecérmonos: nós a ti e ti o funcionamento do espazo. Se é posible, ven propoñer a túa actividade á próxima asemblea mensual.
              </p>
              <p>
                En calquera caso, Revolteira só acolle actividades acordes aos seus principios, e iso implica que sexan abertas, gratuítas e sen retribución económica para quen as organiza. Precisamos coñecer os detalles da túa proposta para poder valorala, así que, independentemente de se te pasas pola asemblea ou non, sería desexable que cubras o seguinte formulario.
              </p>
              <p>
                Finalmente, agradecemos que nos avises con antelación, xa que, agás actividades inamovibles, programamos o mes seguinte na asemblea que celebramos arredor do día 20 do mes anterior, e uns poucos días despois deseñamos o cartel mensual.
              </p>
            </div>

            <div className="relative w-full rounded-xl border-2 border-border bg-[#f5f2eb] shadow-md overflow-hidden" style={{ height: "900px" }}>
              <iframe 
                src="https://cryptpad.fr/form/#/2/form/view/KjtHy-lkO-ddHRE3dctd8Nq56Ggnno14f04e8LxRCFk/embed/"
                className="absolute inset-0 w-full h-full border-none"
                title="Formulario de proposta de actividade"
                style={{ 
                  filter: "sepia(0.1) contrast(0.9) brightness(1.05)", 
                }}
              ></iframe>
            </div>
            <div className="text-center text-sm text-muted-foreground mt-4 italic">
              Se tes problemas para visualizar o formulario, podes abrilo directamente <a href="https://cryptpad.fr/form/#/2/form/view/KjtHy-lkO-ddHRE3dctd8Nq56Ggnno14f04e8LxRCFk/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">nesta ligazón</a>.
            </div>
          </TabsContent>

          <TabsContent value="conflitos" className="space-y-8 animate-in fade-in duration-500">
            <div className="prose prose-lg max-w-none prose-p:text-foreground prose-strong:text-foreground prose-h3:text-foreground prose-h3:font-bold prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3">
              <h3>Por que prestar atención á convivencia?</h3>
              <p>
                Consideramos fundamental facer da Revolteira un espazo amigable. Non se trata só de que a boa convivencia sexa unha condición de posibilidade para que o centro social sobreviva e as persoas que o habitan se sintan cómodas, senón que para nós os coidados e o apoio mutuo constitúen un compromiso coas realidades que queremos construír e como nos queremos vincular, nun contexto atravesado por lóxicas hexemónicas que implican violencias. Por iso, non podemos fialo todo á espontaneidade, e dedicamos un esforzo activo a reflexionar sobre a convivencia e dotarnos de ferramentas para facer da Revolteira un lugar no que coidármonos.
              </p>

              <h3>Quen xestiona a convivencia?</h3>
              <p>
                A convivencia require, polas súas características, involucrar ao conxunto do espazo. Na Revolteira constituímos un Grupo de Convivencia que se encarga de tarefas como a prevención, divulgación etc. A Comisión de Conflitos fai parte deste grupo, e está conformada por un grupo reducido de persoas. A principal misión desta comisión é a xestión dos conflitos que poidan xurdir co máximo respecto á confidencialidade que requira quen comunica unha situación. Só os membros que a integran teñen acceso ao correo do Grupo de Convivencia e comparten co grupo exclusivamente a información que teña ese propósito, sin detalles privados de conflitos concretos. É máis, se por unha cuestión de confianza queres transmitir e limitar unha información só a algúns membros desta comisión podes facelo. As persoas que integran a Comisión de Conflitos son coñecidas polas persoas asociadas á Revolteira: podes preguntar por correo ou achegarte ao centro social para solicitar esta información.
              </p>

              <h3>Que comunicar á Comisión de Conflitos?</h3>
              <p>
                Podes comunicar á Comisión de Conflitos calquera cuestión relacionada coa convivencia na Revolteira, desde propostas de mellora ata conflitos ou situacións de violencia das que teñas coñecemento, xa sexa exercida colectivamente ou por individuos concretos, cun propósito meramente informativo ou para requirir a intervención da Comisión de Conflitos.
              </p>

              <h3>Como intervén a Comisión de Conflitos?</h3>
              <p>
                Non interviremos nun conflito no que nos comuniques que recibiches algunha forma de violencia se non queres que o fagamos. As comunicacións con propósito informativo poden servir para detectar patróns de conduta, alertar de erros en materia preventiva, prestar atención para evitar que se repita etc.
              </p>
              <p>
                Desde unha perspectiva emancipatoria, valoramos positivamente que cando sexa posible os conflitos se resolvan entre as partes. Nestes casos pódese recorrer á Comisión de Conflitos con fins consultivos. Porén, hai situacións nas que as partes requiren unha intervención externa, para o cal podes solicitar á comisión a súa intervención directamente sobre o conflito. Nos casos nos que o conflito ten lugar fóra do espazo ou involucra persoas cunha participación moi esporádica no centro social a comisión avaliará ata que punto é factible a súa intervención en función das súas capacidades e competencias.
              </p>
              <p>
                O enfoque co que abordamos as violencias é antipunitivista. Se ben en certas circunstancias poden ser precisas medidas temporais preventivas e de protección de persoas que fosen violentadas, o noso propósito é extinguir as violencias, e non movelas para fóra do local. Rexeitamos a idea determinista de que os individuos son inmutables e actúan dun xeito por natureza. Sempre que haxa disposición polas partes implicadas, apostamos pola transformación dos individuos, pola mediación de conflitos e polos procesos de responsabilización de quen exerceu un dano e reparación a quen o sufriu, isto é, pola xustiza restaurativa.
              </p>

              <h3>Como contactar coa Comisión de Conflitos?</h3>
              
              <p>
                Podes escribir a <a href="mailto:convivenciahedreira@gmail.com" className="text-primary underline hover:text-primary/80 transition-colors">convivenciahedreira@gmail.com</a> (opción preferible) ou cubrir o seguinte formulario.
              </p>
            </div>

            <div className="w-full max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-base font-medium">
                    Nome
                  </Label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onInvalid={handleInvalidMessage}
                    onInput={handleInput}
                    required
                    className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="O teu nome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium">
                    Correo electrónico
                  </Label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onInvalid={handleInvalidMessage}
                    onInput={(e) => {
                      handleInput(e);
                      handleInvalidMessage(e);
                    }}
                    required
                    className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="o-teu-correo@exemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-base font-medium">
                    Mensaxe
                  </Label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    onInvalid={handleInvalidMessage}
                    onInput={handleInput}
                    required
                    className="w-full px-4 py-2 rounded-lg border-2 border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent transition-colors resize-none"
                    placeholder="Escribe a túa mensaxe..."
                    rows={6}
                  />
                </div>

                <Captcha 
                  onSuccess={handleCaptchaSuccess}
                  onError={handleCaptchaError}
                  onExpire={handleCaptchaExpire}
                />

                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar mensaxe"}
                  </button>
                </div>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
