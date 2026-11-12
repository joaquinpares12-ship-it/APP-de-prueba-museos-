import {useState} from 'react';
import {ArrowUpRight, Navigation} from 'lucide-react';
import {
  formatDistance,
  formatPriceLevel,
  formatWalkEstimate,
} from '../data/cabaZones';
import type {MuseumItem} from '../types/museum';

const FALLBACK_GALLERY_IMG =
  '/src/assets/images/museum_fallback_gallery_1794511071648.jpg';

interface MuseumCardProps {
  museum: MuseumItem;
  index: number;
  isSelected: boolean;
  onSelect: (museum: MuseumItem) => void;
  onRequestRoute: (museum: MuseumItem) => void;
  onHover: (museumId: string | null) => void;
}

export function MuseumCard({
  museum,
  index,
  isSelected,
  onSelect,
  onRequestRoute,
  onHover,
}: MuseumCardProps) {
  const [imgError, setImgError] = useState(false);
  const primaryPhoto = museum.photos[0];
  const imageSrc =
    !imgError && primaryPhoto?.url ? primaryPhoto.url : FALLBACK_GALLERY_IMG;
  const priceInfo = formatPriceLevel(museum.priceLevel);

  const statusText =
    museum.isOpenNow === true
      ? 'Abierto ahora'
      : museum.isOpenNow === false
        ? 'Cerrado ahora'
        : 'Horario no informado';

  return (
    <article
      onMouseEnter={() => onHover(museum.id)}
      onMouseLeave={() => onHover(null)}
      className={`group rounded-xl border bg-white transition-colors duration-150 ${
        isSelected
          ? 'border-[#1E3A8A] ring-1 ring-[#1E3A8A]'
          : 'border-[#E5E1D8] hover:border-[#C5BFB2]'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Thumbnail */}
          <button
            type="button"
            onClick={() => onSelect(museum)}
            className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg bg-[#EBE8E0] sm:h-32 sm:w-40 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
            aria-label={`Ver detalles de ${museum.displayName}`}
          >
            <img
              src={imageSrc}
              alt={museum.displayName}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
            <span className="absolute left-2.5 top-2.5 rounded bg-[#141413]/85 px-2 py-0.5 font-mono text-[11px] font-medium text-white tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
          </button>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              {/* Zero-pill quiet metadata line */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#57534E]">
                <span className="font-mono font-medium text-[#1E3A8A] tabular-nums">
                  {formatDistance(museum.distanceMeters)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {formatWalkEstimate(museum.distanceMeters)}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    museum.isOpenNow === true
                      ? 'font-medium text-[#14532D]'
                      : museum.isOpenNow === false
                        ? 'font-medium text-[#9A3412]'
                        : 'text-[#78716C]'
                  }
                >
                  {statusText}
                </span>
              </div>

              <h3 className="mt-1.5 font-serif text-lg font-semibold leading-snug text-[#141413]">
                <button
                  type="button"
                  onClick={() => onSelect(museum)}
                  className="text-left hover:text-[#1E3A8A] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E3A8A]"
                >
                  {museum.displayName}
                </button>
              </h3>

              {/* Secondary metadata: category · rating · price tier */}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#57534E]">
                <span>{museum.primaryTypeDisplayName}</span>
                {museum.rating != null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums font-medium text-[#141413]">
                      {museum.rating.toFixed(1).replace('.', ',')} ★
                      {museum.userRatingCount
                        ? ` (${museum.userRatingCount.toLocaleString('es-AR')})`
                        : ''}
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#141413]">
                  {priceInfo.label}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#44403C]">
                {museum.editorialSummary ||
                  museum.formattedAddress}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#F1EFEA]">
              <span className="truncate text-xs text-[#78716C] max-w-[210px]">
                {museum.formattedAddress}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onRequestRoute(museum)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#D8D3C8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#141413] transition-colors hover:bg-[#F8F7F4] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Navigation className="h-3.5 w-3.5 text-[#1E3A8A]" aria-hidden="true" />
                  <span>Cómo llegar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(museum)}
                  className="inline-flex items-center gap-1 rounded-md bg-[#141413] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1E3A8A] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Ficha completa</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Required photo attribution if Google Places photo is displayed */}
        {!imgError && primaryPhoto?.attributions?.[0] && (
          <p className="mt-2 text-[11px] text-[#78716C]">
            Foto:{' '}
            {primaryPhoto.attributions[0].uri ? (
              <a
                href={primaryPhoto.attributions[0].uri}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[#141413]"
              >
                {primaryPhoto.attributions[0].displayName}
              </a>
            ) : (
              primaryPhoto.attributions[0].displayName
            )}
          </p>
        )}
      </div>
    </article>
  );
}
