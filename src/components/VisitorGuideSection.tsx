export function VisitorGuideSection() {
  return (
    <section
      id="informacion"
      className="border-t border-[#E5E1D8] bg-white"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#57534E]">
            Información práctica para turistas
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold text-[#141413] sm:text-3xl text-balance">
            Consejos útiles antes de recorrer los museos de CABA
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 border-t border-[#E5E1D8] pt-8 md:grid-cols-3">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#141413]">
              01. Tarifas y días gratuitos
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#44403C]">
              En Buenos Aires conviven museos nacionales y municipales con
              acceso libre o bonos contribución, junto a fundaciones privadas con
              tarifas diferenciadas para turistas extranjeros y residentes.
              Verificá siempre la web oficial en cada ficha para confirmar el
              valor vigente en pesos argentinos (ARS).
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-[#141413]">
              02. Días habituales de cierre
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#44403C]">
              Una gran parte de los museos públicos y privados de la ciudad
              cierran los lunes o martes por mantenimiento de salas. Utilizá el
              filtro «Abiertos ahora» antes de trasladarte para confirmar la
              disponibilidad en tiempo real.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg font-semibold text-[#141413]">
              03. Cómo moverte en Subte y Bus
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#44403C]">
              Para utilizar la red de Subte y colectivos urbanos necesitás una
              tarjeta SUBE o medios de pago sin contacto habilitados en molinetes.
              Elegí «Subte / Bus» en el calculador de rutas para combinar
              estaciones cercanas a cada museo.
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-[#E5E1D8] bg-[#F8F7F4]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-6 py-6 text-xs text-[#57534E] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Museos CABA · Guía cultural interactiva para visitantes en Buenos
            Aires.
          </p>
          <p>
            Datos geográficos, horarios y reseñas proporcionados mediante Google
            Maps Platform. El uso de ubicación GPS requiere tu consentimiento
            explícito y puede revocarse desde el navegador.
          </p>
        </div>
      </footer>
    </section>
  );
}
