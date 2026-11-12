import {LocateFixed} from 'lucide-react';

interface HeaderProps {
  onUseCurrentLocation: () => void;
  isLocating: boolean;
}

export function Header({onUseCurrentLocation, isLocating}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E1D8] bg-[#F8F7F4]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#inicio"
          className="font-serif text-xl font-semibold tracking-tight text-[#141413] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1E3A8A]"
        >
          Museos CABA
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534E]"
        >
          <a
            href="#explorador"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#141413] hover:underline underline-offset-4"
          >
            Cercanos
          </a>
          <a
            href="#mapa"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#141413] hover:underline underline-offset-4"
          >
            Explorar Mapa
          </a>
          <a
            href="#barrios"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#141413] hover:underline underline-offset-4"
          >
            Barrios
          </a>
          <a
            href="#informacion"
            className="whitespace-nowrap shrink-0 transition-colors hover:text-[#141413] hover:underline underline-offset-4"
          >
            Información
          </a>
        </nav>

        {/* Zone 3: 1 primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#172D6E] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
          >
            <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isLocating ? 'Ubicando...' : 'Mi ubicación'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
