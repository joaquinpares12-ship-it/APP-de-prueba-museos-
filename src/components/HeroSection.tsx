import {LocateFixed} from 'lucide-react';

const HERO_IMAGE = '/src/assets/images/caba_museum_hero_1794511071042.jpg';

interface HeroSectionProps {
  onUseCurrentLocation: () => void;
  isLocating: boolean;
  totalFound: number;
  originLabel: string;
}

export function HeroSection({
  onUseCurrentLocation,
  isLocating,
  totalFound,
  originLabel,
}: HeroSectionProps) {
  return (
    <section
      id="inicio"
      className="border-b border-[#E5E1D8] bg-[#F8F7F4]"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-8 lg:py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
          {/* Editorial Left Column */}
          <div className="flex flex-col justify-between lg:col-span-6 lg:py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#57534E]">
                Ciudad Autónoma de Buenos Aires · Guía Cultural
              </p>

              <h1 className="mt-3 font-serif text-4xl font-semibold leading-[1.12] tracking-tight text-[#141413] sm:text-5xl text-balance">
                Los museos más cercanos a tu recorrido porteño
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#44403C]">
                Entrá y descubrí al instante los museos, galerías y espacios
                patrimoniales más próximos a tu ubicación en Buenos Aires, con
                descripciones curatoriales, horarios en vivo, nivel de precios y
                rutas a pie o en Subte.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#explorador"
                  className="inline-flex items-center justify-center rounded-lg bg-[#141413] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E3A8A] whitespace-nowrap shrink-0"
                >
                  Explorar museos cercanos
                </a>
                <button
                  type="button"
                  onClick={onUseCurrentLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#D8D3C8] bg-white px-4 py-3 text-sm font-medium text-[#141413] transition-colors hover:bg-[#EBE8E0] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LocateFixed className="h-4 w-4 text-[#1E3A8A]" aria-hidden="true" />
                  <span>
                    {isLocating
                      ? 'Detectando ubicación...'
                      : 'Ordenar desde mi GPS'}
                  </span>
                </button>
              </div>
            </div>

            {/* Quiet operational summary */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-[#E5E1D8] pt-5">
              <div>
                <p className="text-xs text-[#78716C]">Punto activo</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-[#141413]">
                  {originLabel}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#78716C]">Espacios cercanos</p>
                <p className="mt-0.5 font-mono text-sm font-semibold text-[#141413] tabular-nums">
                  {totalFound > 0 ? `${totalFound} resultados` : 'Buscando...'}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#78716C]">Cobertura</p>
                <p className="mt-0.5 text-sm font-semibold text-[#141413]">
                  Toda CABA
                </p>
              </div>
            </div>
          </div>

          {/* Right Media Column */}
          <div className="lg:col-span-6">
            <div className="relative h-64 w-full overflow-hidden rounded-xl border border-[#E5E1D8] bg-[#EBE8E0] sm:h-80 lg:h-full lg:min-h-[360px]">
              <img
                src={HERO_IMAGE}
                alt="Fachada neoclásica de museo porteño rodeada de jacarandás en Buenos Aires"
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
              />
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <p className="font-serif text-lg font-medium leading-snug">
                  Circuito de Arte, Historia y Arquitectura en Buenos Aires
                </p>
                <p className="mt-1 text-xs text-white/85">
                  Recoleta · Centro · San Telmo · Palermo · La Boca · Puerto Madero
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
