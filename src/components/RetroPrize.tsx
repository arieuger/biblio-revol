
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function RetroPrize() {
  return (
    <div className="flex flex-col items-center justify-center py-6 md:py-12 px-3 sm:px-4 border-4 border-dashed border-yellow-400 bg-yellow-50/30 rounded-xl space-y-6 md:space-y-8 overflow-hidden relative shadow-xl my-4 md:my-8">
      {/* Elementos flotantes retro */}
      <div className="absolute top-2 left-2 md:top-4 md:left-4 animate-bounce text-2xl md:text-5xl drop-shadow-md select-none pointer-events-none">🎁</div>
      <div className="absolute top-8 right-4 md:top-12 md:right-8 animate-bounce text-2xl md:text-5xl drop-shadow-md select-none pointer-events-none" style={{ animationDelay: '0.2s' }}>🎊</div>
      <div className="absolute bottom-16 left-4 md:bottom-12 md:left-8 animate-bounce text-2xl md:text-5xl drop-shadow-md select-none pointer-events-none" style={{ animationDelay: '0.4s' }}>⭐</div>
      <div className="absolute bottom-4 right-2 md:bottom-4 md:right-4 animate-bounce text-2xl md:text-5xl drop-shadow-md select-none pointer-events-none" style={{ animationDelay: '0.6s' }}>🔥</div>

      <div className="bg-red-600 text-white font-black px-4 md:px-8 py-2 md:py-3 transform -rotate-2 border-4 border-yellow-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] animate-pulse z-10">
        <span className="text-lg sm:text-2xl md:text-5xl tracking-tighter italic uppercase">!!! PREMIO !!!</span>
      </div>

      <div className="text-center z-10 space-y-3 md:space-y-4 w-full px-1">
        <h2 className="text-base sm:text-xl md:text-4xl font-black text-blue-600 leading-tight animate-rainbow drop-shadow-sm break-words mx-auto max-w-[95%]">
          ES A PERSOA QUE VISITA ESTA HUMILDE PÁXINA NÚMERO
        </h2>
        <div className="inline-block relative mt-2 w-full max-w-[300px] sm:max-w-none">
          <div className="bg-black text-yellow-400 px-2 sm:px-6 py-3 md:py-4 font-mono border-4 border-red-500 shadow-[0px_0px_15px_rgba(255,0,0,0.5)] flex items-center justify-center">
             <span className="text-2xl sm:text-5xl md:text-9xl leading-none tracking-tighter whitespace-nowrap">
              100.000.000
            </span>
          </div>
          <div className="absolute -top-3 -right-1 md:-top-4 md:-right-4 bg-yellow-400 text-black text-[10px] md:text-xs font-bold px-2 py-0.5 md:py-1 border-2 border-black rotate-12 animate-blink whitespace-nowrap z-20 shadow-sm">
            SI, TI!
          </div>
        </div>
      </div>

      <div className="max-w-2xl w-full text-center space-y-6 z-10 px-1">
        <div className="bg-white/90 p-4 md:p-6 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] backdrop-blur-sm mx-auto">
          <p className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900 leading-snug md:leading-relaxed">
            Parabéns! Acabas de gañar como agasallo un encarecido convite a organizar ti un obradoiro na Revolteira.
          </p>
          <p className="mt-2 md:mt-4 text-red-600 font-black text-base sm:text-xl md:text-2xl animate-blink uppercase tracking-tight">
            NON PERDAS ESTA OPORTUNIDADE ÚNICA!
          </p>
        </div>
        
        <div className="w-full flex justify-center pt-2 px-2">
          <Link href="/contacto" className="w-full sm:w-auto block">
            <Button 
              size="lg"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-black text-lg sm:text-xl md:text-2xl py-6 md:py-10 px-4 md:px-16 rounded-none border-b-4 md:border-b-8 border-r-4 md:border-r-8 border-green-800 active:border-0 active:translate-x-1 active:translate-y-1 transition-all uppercase tracking-tight md:tracking-widest shadow-xl h-auto min-h-[64px] flex items-center justify-center text-center leading-tight break-words"
            >
              Reclamar Premio Agora
            </Button>
          </Link>
        </div>
      </div>

      {/* Marquee inferior */}
      <div className="w-full bg-blue-900 py-2 md:py-3 overflow-hidden whitespace-nowrap border-y-4 border-yellow-400 z-10 mt-4">
        <div className="animate-marquee inline-block">
          <span className="text-yellow-300 font-mono font-bold text-xs md:text-xl px-4">
            CONTACTA CON NÓS • ENVÍA A TÚA PROPOSTA • A HEDREIRA • CENTRO SOCIAL • NON HAI OBRADOIROS DISPOÑIBLES • O TEU PODE SER O PRIMEIRO • 
          </span>
          <span className="text-yellow-300 font-mono font-bold text-xs md:text-xl px-4">
            CONTACTA CON NÓS • ENVÍA A TÚA PROPOSTA • A HEDREIRA • CENTRO SOCIAL • NON HAI OBRADOIROS DISPOÑIBLES • O TEU PODE SER O PRIMEIRO • 
          </span>
        </div>
      </div>
    </div>
  );
}
