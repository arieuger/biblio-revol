export default function AvisoLegal() {
  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-display font-bold mb-8">Aviso Legal</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-2xl font-bold text-foreground">1. Información Xeral</h2>
            <p>
              En cumprimento do deber de información recollido no artigo 10 da Lei 34/2002, do 11 de xullo, de Servizos da Sociedade da Información e do Comercio Electrónico (LSSI-CE), fásense públicos os seguintes datos de información xeral deste sitio web:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Titular:</strong> Asociación Revolteira</li>
              <li><strong>CIF:</strong> G67822551</li>
              <li><strong>Enderezo:</strong> Rúa Catasol, 17 baixo, 27002 – Lugo (LUGO)</li>
              <li><strong>Enderezo electrónico:</strong> contacto@example.org</li>
              <li><strong>Número de inscrición:</strong> 2022/24947-1</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">2. Propiedade Intelectual e Industrial</h2>
            <p>
              Este sitio web e os seus contidos réxense por unha política de <strong>Copyleft</strong>. Isto significa que se permite a copia, distribución e comunicación pública dos contidos, así como a creación de obras derivadas, sempre que se recoñeza a autoría e se manteñan os mesmos termos de licenza para as obras resultantes, salvo que se indique o contrario de forma expresa nalgún contido específico.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">3. Responsabilidade</h2>
            <p>
              A Asociación Revolteira non se fai responsable dos danos e prexuízos que puideran derivarse de interferencias, omisións, interrupcións, virus informáticos, avarías telefónicas ou desconexións no funcionamento operativo do sistema electrónico, motivados por causas alleas á Asociación.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">4. Lexislación Aplicable e Xurisdición</h2>
            <p>
              Para a resolución de todas as controversias ou cuestións relacionadas co presente sitio web ou das actividades nel desenvolvidas, será de aplicación a lexislación española, á que se someten expresamente as partes, sendo competentes para a resolución de todos os conflitos derivados ou relacionados co seu uso os Xulgados e Tribunais de Lugo.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
