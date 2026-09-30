import { useCookies } from "@/contexts/CookieContext";
import { Button } from "./ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "wouter";

export default function CookieBanner() {
  const { consent, acceptCookies, rejectCookies } = useCookies();

  if (consent !== 'undecided') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 bg-background border-t-4 border-primary shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
              <Cookie size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-lg">Uso de cookies técnicas</h4>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Esta web utiliza unicamente cookies técnicas necesarias para o seu correcto funcionamento, seguridade e rendemento. Consulta a nosa <Link href="/cookies"><a className="underline hover:text-primary">Política de Cookies</a></Link>.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 shrink-0 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={rejectCookies}
              className="flex-1 md:flex-none border-2"
            >
              Rexeitar
            </Button>
            <Button 
              onClick={acceptCookies}
              className="flex-1 md:flex-none font-bold"
            >
              Aceptar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
