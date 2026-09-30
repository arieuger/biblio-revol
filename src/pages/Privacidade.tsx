export default function Privacidade() {
  return (
    <div className="min-h-screen py-12 md:py-20">
      <div className="container max-w-4xl">
        <h1 className="text-4xl font-display font-bold mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground/90">
          <p>
            <strong>ASOCIACIÓN A HEDREIRA</strong>, con CIF <strong>G67822551</strong>, é o responsable do tratamento dos datos persoais dos nosos/as usuarios/as. Estes datos serán tratados de conformidade co disposto nas normativas vixentes sobre protección de datos persoais, o Regulamento (UE) 2016/679 do 27 de abril de 2016 (GDPR) relativo á protección das persoas físicas no que respecta ao tratamento de datos persoais e á libre circulación destes datos.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-foreground">Responsable do Tratamento</h2>
            <ul className="list-none pl-0">
              <li><strong>Nome:</strong> Asociación Revolteira</li>
              <li><strong>CIF:</strong> G67822551</li>
              <li><strong>Enderezo:</strong> Rúa Catasol, 17 baixo, 27002 – Lugo (LUGO)</li>
              <li><strong>Email:</strong> contacto@example.org</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">Finalidade e Seguridade</h2>
            <p>
              Os datos persoais facilitados de forma voluntaria a través dos nosos medios de recollida de información serán incorporados a tratamentos automatizados e/ou manuais. A HEDREIRA comprométese ao cumprimento da súa obrigación de segredo dos datos e adoptará as medidas necesarias para evitar a súa alteración, perda, tratamento ou acceso non autorizado.
            </p>
            <p>
              Os datos transmítense de forma cifrada mediante o protocolo <strong>SSL</strong> para garantir a seguridade na comunicación entre o usuario e o servidor.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">Destinatarios e Servizos de Terceiros</h2>
            <p>
              Para o funcionamento desta web e a xestión dos seus servizos, utilizamos os seguintes provedores:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cloudflare Pages (Cloudflare Inc.):</strong> Provedor de aloxamento (hosting) e seguridade. Os seus servidores poden estar localizados fóra do Espazo Económico Europeo, contando coas garantías de seguridade necesarias para o cumprimento do RXPD.</li>
              <li><strong>Cryptpad:</strong> Utilizado para a xestión de formularios de contacto e inscrición de forma segura e privada.</li>
              <li><strong>Web3Forms:</strong> Servizo utilizado para o procesamento e envío de formularios de contacto (formulario da Comisión de Conflitos). Os datos do formulario son procesados por Web3Forms unicamente para xestionar o contacto e enviar as mensaxes ao correo electrónico especificado. Web3Forms non almacena datos de forma permanente nin utiliza cookies de seguimento.</li>
              <li><strong>Decap CMS:</strong> Xestor de contidos utilizado para a actualización da información da web.</li>

            </ul>
            <p>
              Os datos non se cederán a outros terceiros salvo nos casos en que exista unha obrigación legal. No caso específico do formulario da Comisión de Conflitos, os datos son procesados por Web3Forms como procesador de datos en nome da Asociación Revolteira, unicamente para o envío de mensaxes ao correo electrónico de contacto.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">Conservación dos Datos</h2>
            <p>
              Os datos serán conservados mentres dure a relación que xera o tratamento ou durante os anos necesarios para cumprir coas obrigacións legais. Unha vez finalizada a relación, os datos serán bloqueados e, transcorrido o prazo legal, eliminados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground">Dereitos do Usuario</h2>
            <p>A normativa de protección de datos confírelle os seguintes dereitos:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dereito a revogar calquera consentimento prestado previamente.</li>
              <li>Dereito de acceso: Coñecer que datos están a tratarse.</li>
              <li>Dereito de rectificación: Solicitar a modificación de datos inexactos.</li>
              <li>Dereito de portabilidade: Obter unha copia dos datos en formato interoperable.</li>
              <li>Dereito á limitación do tratamento.</li>
              <li>Dereito de cancelación/supresión: Solicitar o cesamento do tratamento e a eliminación dos datos.</li>
            </ul>
            <p>
              Pode exercer estes dereitos dirixíndose por escrito á Asociación Revolteira no enderezo postal indicado ou a través do correo electrónico <strong>contacto@example.org</strong>, achegando documentación que acredite a súa identidade.
            </p>
            <p>
              Tamén ten dereito a solicitar a protección dos seus dereitos ante a Axencia Española de Protección de Datos (AEPD).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
