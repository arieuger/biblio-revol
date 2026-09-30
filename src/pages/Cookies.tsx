export default function Cookies() {
  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-display font-bold mb-8">Política de Cookies</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
          <p>
            Nesta web utilizamos unicamente as cookies estritamente necesarias para o seu correcto funcionamento, seguridade e rendemento. Non utilizamos cookies de seguimento publicitario nin de análise de terceiros que requiran o consentimento previo do usuario segundo a normativa vixente.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-foreground">Que son as cookies?</h2>
            <p>
              Unha cookie é un pequeno ficheiro de texto que se garda no seu navegador cando visita case calquera páxina web. A súa utilidade é que a web sexa capaz de lembrar a súa visita cando volva navegar por esa páxina.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">Cookies utilizadas nesta web</h2>
            <p>Este sitio web utiliza as seguintes cookies técnicas e necesarias:</p>
            <ul className="list-disc pl-6 space-y-4">
              <li>
                <strong>Cloudflare:</strong> Empréganse cookies técnicas necesarias para a seguridade do sitio (detección de bots e ataques) e para optimizar o rendemento da entrega de contidos. Estas cookies non almacenan información persoal identificable.
              </li>
              <li>
                <strong>hCaptcha (Intuition Machines, Inc.):</strong> O formulario da Comisión de Conflitos utiliza hCaptcha para protexer o sitio contra spam e abusos. hCaptcha pode instalar cookies técnicas necesarias para a verificación de seguridade e a detección de comportamentos automatizados. Estas cookies non se utilizan para o seguimento publicitario nin para a elaboración de perfís de usuario.
              </li>
              <li>
                <strong>Cryptpad:</strong> Os formularios integrados de Cryptpad utilizan cookies de sesión estritamente necesarias para que o formulario funcione correctamente e permita o envío da información de forma segura.
              </li>
            </ul>
          </section>



          <section>
            <h2 className="text-2xl font-bold text-foreground">Xestión de cookies</h2>
            <p>
              Ao tratarse de cookies técnicas e estritamente necesarias para a prestación do servizo solicitado polo usuario, non requiren de consentimento segundo o artigo 22.2 da Lei 34/2002 (LSSI).
            </p>
            <p>
              Non obstante, vostede pode restrinxir, bloquear ou borrar as cookies de calquera sitio web utilizando o seu navegador. En cada navegador a operativa é diferente:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Chrome:</strong> Configuración - Privacidade e seguridade - Cookies e outros datos de sitios.</li>
              <li><strong>Firefox:</strong> Axustes - Privacidade e seguridade - Cookies e datos do sitio.</li>
              <li><strong>Safari:</strong> Preferencias - Privacidade - Cookies e datos do sitio web.</li>
              <li><strong>Edge:</strong> Configuración - Cookies e permisos do sitio.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
