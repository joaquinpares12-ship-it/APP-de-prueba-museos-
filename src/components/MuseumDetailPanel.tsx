import {useEffect, useState} from 'react';
import {
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Navigation,
  Phone,
  Star,
  Ticket,
  X,
} from 'lucide-react';
import {
  formatDistance,
  formatPriceLevel,
  formatWalkEstimate,
} from '../data/cabaZones';
import type {MuseumItem, TravelModeOption} from '../types/museum';

const FALLBACK_GALLERY_IMG =
  '/src/assets/images/museum_fallback_gallery_1794511071648.jpg';

interface MuseumDetailPanelProps {
  museum: MuseumItem | null;
  isLoadingDetails: boolean;
  onClose: () => void;
  onRequestRoute: (museum: MuseumItem, mode: TravelModeOption) => void;
}

export function MuseumDetailPanel({
  museum,
  isLoadingDetails,
  onClose,
  onRequestRoute,
}: MuseumDetailPanelProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setActivePhotoIndex(0);
    setImgError(false);
  }, [museum?.id]);

  useEffect(() => {
    if (!museum) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [museum, onClose]);

  if (!museum) return null;

  const photos = museum.photos;
  const activePhoto = photos[activePhotoIndex];
  const heroUrl =
    !imgError && activePhoto?.url ? activePhoto.url : FALLBACK_GALLERY_IMG;
  const priceInfo = formatPriceLevel(museum.priceLevel);

  const accessibilityItems: string[] = [];
  if (museum.accessibilityOptions?.hasWheelchairAccessibleEntrance) {
    accessibilityItems.push('Entrada accesible para silla de ruedas');
  }
  if (museum.accessibilityOptions?.hasWheelchairAccessibleRestroom) {
    accessibilityItems.push('Baños accesibles');
  }
  if (museum.accessibilityOptions?.hasWheelchairAccessibleParking) {
    accessibilityItems.push('Estacionamiento accesible');
  }

  const paymentMethods: string[] = [];
  if (museum.paymentOptions?.acceptsCreditCards) paymentMethods.push('Crédito');
  if (museum.paymentOptions?.acceptsDebitCards) paymentMethods.push('Débito');
  if (museum.paymentOptions?.acceptsNfc) paymentMethods.push('Pago sin contacto');
  if (museum.paymentOptions?.acceptsCashOnly) paymentMethods.push('Solo efectivo');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="museum-detail-title"
      className="fixed inset-0 z-50 flex justify-end bg-[#141413]/45 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-[#F8F7F4] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#E5E1D8] bg-[#F8F7F4]/95 px-6 py-4 backdrop-blur-sm">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-[#57534E] truncate">
              {museum.primaryTypeDisplayName} · CABA
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha del museo"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8D3C8] bg-white text-[#141413] hover:bg-[#EBE8E0] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Photo viewer */}
          <div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-[#EBE8E0] border border-[#E5E1D8]">
              <img
                src={heroUrl}
                alt={museum.displayName}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            </div>

            {photos.length > 1 && (
              <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
                {photos.map((photo, idx) => (
                  <button
                    key={photo.url}
                    type="button"
                    onClick={() => {
                      setActivePhotoIndex(idx);
                      setImgError(false);
                    }}
                    className={`h-14 w-20 shrink-0 overflow-hidden rounded-md border transition-opacity cursor-pointer ${
                      idx === activePhotoIndex
                        ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/30 opacity-100'
                        : 'border-[#D8D3C8] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={`${museum.displayName} vista ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {!imgError && activePhoto?.attributions?.[0] && (
              <p className="mt-2 text-xs font-serif italic text-[#57534E]">
                Fotografía:{' '}
                {activePhoto.attributions[0].uri ? (
                  <a
                    href={activePhoto.attributions[0].uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-[#141413]"
                  >
                    {activePhoto.attributions[0].displayName}
                  </a>
                ) : (
                  activePhoto.attributions[0].displayName
                )}
              </p>
            )}
          </div>

          {/* Editorial Title & Summary */}
          <div className="border-b border-[#E5E1D8] pb-6">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#57534E]">
              <span className="font-mono font-medium text-[#1E3A8A] tabular-nums">
                A {formatDistance(museum.distanceMeters)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {formatWalkEstimate(museum.distanceMeters)}
              </span>
              {museum.rating != null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-[#141413] tabular-nums">
                    {museum.rating.toFixed(1).replace('.', ',')} ★ (
                    {(museum.userRatingCount ?? 0).toLocaleString('es-AR')}{' '}
                    opiniones)
                  </span>
                </>
              )}
              {museum.isOpenNow !== null && museum.isOpenNow !== undefined && (
                <>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      museum.isOpenNow
                        ? 'font-semibold text-[#14532D]'
                        : 'font-semibold text-[#9A3412]'
                    }
                  >
                    {museum.isOpenNow ? 'Abierto ahora' : 'Cerrado ahora'}
                  </span>
                </>
              )}
            </div>

            <h2
              id="museum-detail-title"
              className="mt-2 font-serif text-3xl font-semibold leading-tight text-[#141413] text-balance"
            >
              {museum.displayName}
            </h2>

            {isLoadingDetails ? (
              <p className="mt-4 text-sm text-[#78716C]">
                Cargando descripción curatorial, horarios y reseñas...
              </p>
            ) : (
              <div className="mt-4 space-y-3 max-w-prose">
                {museum.editorialSummary && (
                  <p className="text-base leading-relaxed text-[#292524]">
                    {museum.editorialSummary}
                  </p>
                )}
                {museum.generativeSummaryText &&
                  museum.generativeSummaryText !== museum.editorialSummary && (
                    <p className="text-sm leading-relaxed text-[#44403C]">
                      {museum.generativeSummaryText}
                    </p>
                  )}
                {!museum.editorialSummary && !museum.generativeSummaryText && (
                  <p className="text-sm leading-relaxed text-[#57534E]">
                    Institución cultural ubicada en {museum.formattedAddress}.
                    Consultá los horarios y enlaces oficiales abajo para conocer
                    sus exposiciones actuales y tarifas vigentes.
                  </p>
                )}
              </div>
            )}

            {/* Route Quick Actions */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onRequestRoute(museum, 'WALKING');
                  onClose();
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#172D6E] cursor-pointer"
              >
                <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Trazar ruta a pie</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onRequestRoute(museum, 'TRANSIT');
                  onClose();
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D8D3C8] bg-white px-4 py-2.5 text-xs font-semibold text-[#141413] hover:bg-[#EBE8E0] cursor-pointer"
              >
                <span>En Subte / Colectivo</span>
              </button>
              {museum.googleMapsURI && (
                <a
                  href={museum.googleMapsURI}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8D3C8] bg-white px-4 py-2.5 text-xs font-medium text-[#141413] hover:bg-[#EBE8E0]"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {/* Museum Accession / Visitor Metadata Grid (dl with hairline dividers) */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#57534E]">
              Información para el visitante
            </h3>

            <dl className="mt-3 divide-y divide-[#E5E1D8] border-y border-[#E5E1D8] bg-white rounded-xl px-5">
              {/* Tarifas & Nivel de Precio */}
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                  <Ticket className="h-3.5 w-3.5 text-[#1E3A8A]" aria-hidden="true" />
                  <span>Precios y acceso</span>
                </dt>
                <dd className="mt-1 sm:col-span-2 sm:mt-0 text-sm text-[#141413]">
                  <p className="font-semibold">
                    {priceInfo.label}{' '}
                    <span className="font-mono text-xs text-[#57534E]">
                      ({priceInfo.tierSymbol})
                    </span>
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
                    {priceInfo.detail}
                  </p>
                  {paymentMethods.length > 0 && (
                    <p className="mt-1.5 text-xs text-[#44403C]">
                      Medios de pago: {paymentMethods.join(' · ')}
                    </p>
                  )}
                  {museum.websiteURI && (
                    <a
                      href={museum.websiteURI}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1E3A8A] underline hover:text-[#172D6E]"
                    >
                      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Ver tarifas y entradas en el sitio oficial</span>
                    </a>
                  )}
                </dd>
              </div>

              {/* Horarios */}
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                  <Clock className="h-3.5 w-3.5 text-[#1E3A8A]" aria-hidden="true" />
                  <span>Horarios</span>
                </dt>
                <dd className="mt-1 sm:col-span-2 sm:mt-0 text-sm text-[#141413]">
                  {museum.weekdayDescriptions &&
                  museum.weekdayDescriptions.length > 0 ? (
                    <ul className="space-y-1 text-xs leading-relaxed text-[#292524] tabular-nums">
                      {museum.weekdayDescriptions.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#78716C]">
                      Horarios no informados en Google Maps. Consultá el sitio
                      oficial antes de asistir.
                    </p>
                  )}
                </dd>
              </div>

              {/* Dirección y contacto */}
              <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                  <MapPin className="h-3.5 w-3.5 text-[#1E3A8A]" aria-hidden="true" />
                  <span>Ubicación</span>
                </dt>
                <dd className="mt-1 sm:col-span-2 sm:mt-0 space-y-1.5 text-sm text-[#141413]">
                  <p>{museum.formattedAddress}</p>
                  {museum.phoneNumber && (
                    <p className="flex items-center gap-1.5 font-mono text-xs text-[#57534E] tabular-nums">
                      <Phone className="h-3 w-3" aria-hidden="true" />
                      <span>{museum.phoneNumber}</span>
                    </p>
                  )}
                </dd>
              </div>

              {/* Accesibilidad */}
              {accessibilityItems.length > 0 && (
                <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
                    Accesibilidad
                  </dt>
                  <dd className="mt-1 sm:col-span-2 sm:mt-0 text-xs text-[#292524]">
                    {accessibilityItems.join(' · ')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Visitor Reviews */}
          {museum.reviews.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#57534E]">
                Reseñas recientes de visitantes
              </h3>
              <div className="divide-y divide-[#E5E1D8] rounded-xl border border-[#E5E1D8] bg-white px-5">
                {museum.reviews.map((rev, idx) => (
                  <div key={`${rev.authorName}-${idx}`} className="py-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="font-semibold text-[#141413]">
                        {rev.authorUri ? (
                          <a
                            href={rev.authorUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {rev.authorName}
                          </a>
                        ) : (
                          rev.authorName
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[#57534E] tabular-nums">
                        {rev.rating != null && (
                          <span className="inline-flex items-center gap-0.5 font-medium text-[#141413]">
                            <Star className="h-3 w-3 fill-[#141413]" aria-hidden="true" />
                            {rev.rating}
                          </span>
                        )}
                        {rev.relativePublishTimeDescription && (
                          <span>· {rev.relativePublishTimeDescription}</span>
                        )}
                      </div>
                    </div>
                    {rev.text && (
                      <p className="mt-2 text-sm leading-relaxed text-[#44403C]">
                        {rev.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Place Attributions if present */}
          {museum.attributions.length > 0 && (
            <div className="border-t border-[#E5E1D8] pt-4 text-xs text-[#78716C]">
              <span>Fuente de datos: </span>
              {museum.attributions.map((attr, idx) => (
                <span key={`${attr.provider}-${idx}`}>
                  {idx > 0 && ', '}
                  {attr.providerURI ? (
                    <a
                      href={attr.providerURI}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {attr.provider}
                    </a>
                  ) : (
                    attr.provider
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
