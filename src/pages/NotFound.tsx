import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Home, AlertTriangle } from "lucide-react";
import SEO from "@/components/SEO";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center bg-background py-12 px-4">
      <SEO title="Páxina non atopada" description="A páxina que buscas non existe ou foi movida." />
      
      <div className="max-w-md w-full text-center">
        {/* Icona Brutalista */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 translate-x-2 translate-y-2 rounded-sm border-2 border-primary"></div>
            <div className="relative bg-card border-2 border-primary p-6 rounded-sm shadow-sm">
              <AlertTriangle className="h-16 w-16 text-accent" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Texto en Galego */}
        <h1 className="text-6xl font-display font-bold text-foreground mb-2 tracking-tighter">404</h1>
        <h2 className="text-2xl font-display font-bold text-foreground mb-4">
          Páxina non atopada
        </h2>
        
        <p className="text-muted-foreground mb-10 leading-relaxed text-lg">
          Sentímolo, a páxina que buscas non existe. 
          Pode que fose movida, eliminada ou que o enderezo estea mal escrito.
        </p>

        {/* Botón de Retorno */}
        <div className="flex justify-center">
          <Link href="/">
            <Button
              size="lg"
              className="font-bold border-2 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all px-8 py-6 text-lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Volver ao inicio
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
