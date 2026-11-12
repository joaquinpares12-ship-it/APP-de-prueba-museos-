import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  APILoadingStatus,
  APIProvider,
  useApiLoadingStatus,
} from '@vis.gl/react-google-maps';
import {AlertCircle, RefreshCw} from 'lucide-react';
import {Header} from './components/Header';
import {HeroSection} from './components/HeroSection';
import {MuseumCard} from './components/MuseumCard';
import {MuseumDetailPanel} from './components/MuseumDetailPanel';
import {MuseumMap} from './components/MuseumMap';
import {OriginSearchBar} from './components/OriginSearchBar';
import {VisitorGuideSection} from './components/VisitorGuideSection';
import {CABA_BOUNDS_RESTRICTION, CABA_STARTING_ZONES} from './data/cabaZones';
import {useCabaMuseums} from './hooks/useCabaMuseums';
import type {
  CategoryFilter,
  MuseumItem,
  OriginPoint,
  TravelModeOption,
} from './types/museum';

function getGoogleMapsApiKey(): string {
  const viteKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const definedKey =
    typeof __GOOGLE_MAPS_API_KEY__ !== 'undefined'
      ? __GOOGLE_MAPS_API_KEY__
      : '';
  return (viteKey || definedKey || '').trim();
}

function isInsideCabaMetro(lat: number, lng: number): boolean {
  return (
    lat >= CABA_BOUNDS_RESTRICTION.south - 0.05 &&
    lat <= CABA_BOUNDS_RESTRICTION.north + 0.05 &&
    lng >= CABA_BOUNDS_RESTRICTION.west - 0.05 &&
    lng <= CABA_BOUNDS_RESTRICTION.east + 0.05
  );
}

function MuseumsExplorerContent() {
  const apiStatus = useApiLoadingStatus();

  const [origin, setOrigin] = useState<OriginPoint>(CABA_STARTING_ZONES[0]);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [radiusMeters, setRadiusMeters] = useState<number>(5000);
  const [openOnly, setOpenOnly] = useState<boolean>(false);
  const [museumQuery, setMuseumQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  const [selectedMuseumId, setSelectedMuseumId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);
  const [hoveredMuseumId, setHoveredMuseumId] = useState<string | null>(null);
  const [routeTargetId, setRouteTargetId] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelModeOption>('WALKING');

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationNotice, setLocationNotice] = useState<{
    message: string;
    pendingCoords?: {lat: number; lng: number};
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(museumQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [museumQuery]);

  const {museums, isLoading, error, loadingDetailsId, loadMuseumDetails, refetch} =
    useCabaMuseums(origin, category, radiusMeters, debouncedQuery);

  const visibleMuseums = useMemo(() => {
    if (!openOnly) return museums;
    return museums.filter((m) => m.isOpenNow === true);
  }, [museums, openOnly]);

  const selectedMuseum = useMemo(
    () => museums.find((m) => m.id === selectedMuseumId) ?? null,
    [museums, selectedMuseumId]
  );

  const routeTarget = useMemo(
    () => museums.find((m) => m.id === routeTargetId) ?? null,
    [museums, routeTargetId]
  );

  const handleSelectMuseum = useCallback(
    (museum: MuseumItem) => {
      setSelectedMuseumId(museum.id);
      setDetailOpen(true);
      void loadMuseumDetails(museum.id);
    },
    [loadMuseumDetails]
  );

  const handleRequestRoute = useCallback(
    (museum: MuseumItem, mode: TravelModeOption = 'WALKING') => {
      setSelectedMuseumId(museum.id);
      setTravelMode(mode);
      setRouteTargetId(museum.id);
      const mapEl = document.getElementById('mapa');
      if (mapEl && window.innerWidth < 1024) {
        mapEl.scrollIntoView({behavior: 'smooth'});
      }
    },
    []
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationNotice({
        message:
          'Tu navegador no admite geolocalización. Elegí tu barrio o ingresá una dirección en CABA.',
      });
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const {latitude, longitude} = pos.coords;
        if (isInsideCabaMetro(latitude, longitude)) {
          setOrigin({
            id: 'gps',
            label: 'Mi ubicación GPS',
            subtitle: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            lat: latitude,
            lng: longitude,
            isUserLocation: true,
          });
          setRouteTargetId(null);
        } else {
          setLocationNotice({
            message:
              'Detectamos que tu GPS está fuera de CABA. Mantenemos el punto de referencia en Buenos Aires, o podés buscar desde tu coordenada actual si preferís.',
            pendingCoords: {lat: latitude, lng: longitude},
          });
        }
      },
      () => {
        setIsLocating(false);
        setLocationNotice({
          message:
            'No pudimos acceder a tu ubicación. Podés seleccionar un barrio de CABA o escribir la dirección de tu hotel.',
        });
      },
      {enableHighAccuracy: true, timeout: 8000}
    );
  }, []);

  if (
    apiStatus === APILoadingStatus.FAILED ||
    apiStatus === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="rounded-xl border border-[#E5E1D8] bg-white p-8">
          <AlertCircle className="mx-auto h-8 w-8 text-[#9A3412]" />
          <h2 className="mt-3 font-serif text-2xl font-semibold text-[#141413]">
            No pudimos inicializar Google Maps Platform
          </h2>
          <p className="mt-2 text-sm text-[#57534E]">
            Verificá la conexión o la configuración de la clave de Google Maps
            para cargar el mapa y los museos cercanos de Buenos Aires.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header
        onUseCurrentLocation={handleUseCurrentLocation}
        isLocating={isLocating}
      />

      <main>
        <HeroSection
          onUseCurrentLocation={handleUseCurrentLocation}
          isLocating={isLocating}
          totalFound={visibleMuseums.length}
          originLabel={origin.label}
        />

        <OriginSearchBar
          origin={origin}
          onSelectOrigin={(pt) => {
            setOrigin(pt);
            setRouteTargetId(null);
            setLocationNotice(null);
          }}
          category={category}
          onChangeCategory={setCategory}
          radiusMeters={radiusMeters}
          onChangeRadius={setRadiusMeters}
          openOnly={openOnly}
          onToggleOpenOnly={() => setOpenOnly((v) => !v)}
          museumQuery={museumQuery}
          onChangeMuseumQuery={setMuseumQuery}
        />

        {locationNotice && (
          <div className="border-b border-[#E5E1D8] bg-[#F3EFE6] px-6 py-3">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 text-xs text-[#292524]">
              <span>{locationNotice.message}</span>
              <div className="flex items-center gap-3">
                {locationNotice.pendingCoords && (
                  <button
                    type="button"
                    onClick={() => {
                      const c = locationNotice.pendingCoords!;
                      setOrigin({
                        id: 'gps-outside',
                        label: 'Mi ubicación GPS',
                        subtitle: `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`,
                        lat: c.lat,
                        lng: c.lng,
                        isUserLocation: true,
                      });
                      setLocationNotice(null);
                    }}
                    className="font-semibold text-[#1E3A8A] underline cursor-pointer"
                  >
                    Usar GPS actual igualmente
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLocationNotice(null)}
                  className="text-[#57534E] hover:text-[#141413] cursor-pointer"
                >
                  Ocultar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main 2-column Explorer: Left List + Right Sticky Interactive Map */}
        <section
          id="explorador"
          aria-label="Listado y mapa de museos cercanos"
          className="mx-auto max-w-[1440px] px-6 py-8"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
            {/* Left Catalog Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-baseline justify-between gap-4 border-b border-[#E5E1D8] pb-3">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#141413]">
                    Museos más cercanos
                  </h2>
                  <p className="mt-0.5 text-xs text-[#57534E]">
                    Ordenados por cercanía desde{' '}
                    <span className="font-medium text-[#141413]">
                      {origin.label}
                    </span>
                    {origin.subtitle ? ` (${origin.subtitle})` : ''}
                  </p>
                </div>
                <span className="font-mono text-xs text-[#57534E] tabular-nums shrink-0">
                  {isLoading
                    ? 'Cargando...'
                    : `${visibleMuseums.length} lugares`}
                </span>
              </div>

              {isLoading && (
                <div className="space-y-4" aria-busy="true">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-xl border border-[#E5E1D8] bg-white p-5"
                    >
                      <div className="flex gap-4">
                        <div className="h-28 w-36 rounded-lg bg-[#EBE8E0]" />
                        <div className="flex-1 space-y-2.5">
                          <div className="h-3 w-32 rounded bg-[#EBE8E0]" />
                          <div className="h-5 w-3/4 rounded bg-[#EBE8E0]" />
                          <div className="h-3 w-1/2 rounded bg-[#EBE8E0]" />
                          <div className="h-8 w-full rounded bg-[#EBE8E0]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && error && (
                <div className="rounded-xl border border-[#E5E1D8] bg-white p-6">
                  <p className="text-sm text-[#9A3412]">{error}</p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#D8D3C8] px-3 py-1.5 text-xs font-medium text-[#141413] hover:bg-[#F8F7F4] cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Reintentar</span>
                  </button>
                </div>
              )}

              {!isLoading && !error && visibleMuseums.length === 0 && (
                <div className="rounded-xl border border-[#E5E1D8] bg-white p-8 text-center">
                  <h3 className="font-serif text-lg font-semibold text-[#141413]">
                    No encontramos espacios con estos filtros
                  </h3>
                  <p className="mt-1.5 text-sm text-[#57534E]">
                    Probá ampliar el radio de búsqueda a 10 km, desactivar el
                    filtro «Abiertos ahora» o elegir otro barrio de CABA.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    {openOnly && (
                      <button
                        type="button"
                        onClick={() => setOpenOnly(false)}
                        className="rounded-lg bg-[#141413] px-4 py-2 text-xs font-medium text-white cursor-pointer"
                      >
                        Mostrar todos los horarios
                      </button>
                    )}
                    {radiusMeters < 10000 && (
                      <button
                        type="button"
                        onClick={() => setRadiusMeters(10000)}
                        className="rounded-lg border border-[#D8D3C8] bg-white px-4 py-2 text-xs font-medium text-[#141413] cursor-pointer"
                      >
                        Ampliar a 10 km
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!isLoading && !error && visibleMuseums.length > 0 && (
                <div className="space-y-3.5">
                  {visibleMuseums.map((museum, idx) => (
                    <MuseumCard
                      key={museum.id}
                      museum={museum}
                      index={idx}
                      isSelected={selectedMuseumId === museum.id}
                      onSelect={handleSelectMuseum}
                      onRequestRoute={(m) => handleRequestRoute(m, 'WALKING')}
                      onHover={setHoveredMuseumId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Sticky Interactive Map Column */}
            <div className="lg:col-span-7 lg:sticky lg:top-[84px]">
              <MuseumMap
                origin={origin}
                museums={visibleMuseums}
                selectedMuseum={selectedMuseum}
                hoveredMuseumId={hoveredMuseumId}
                routeTarget={routeTarget}
                travelMode={travelMode}
                onChangeTravelMode={setTravelMode}
                onClearRoute={() => setRouteTargetId(null)}
                onSelectMuseum={handleSelectMuseum}
              />
            </div>
          </div>
        </section>

        <VisitorGuideSection />
      </main>

      <MuseumDetailPanel
        museum={detailOpen ? selectedMuseum : null}
        isLoadingDetails={
          Boolean(selectedMuseum && loadingDetailsId === selectedMuseum.id)
        }
        onClose={() => setDetailOpen(false)}
        onRequestRoute={handleRequestRoute}
      />
    </>
  );
}

export default function App() {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const apiKey = getGoogleMapsApiKey();

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#141413]">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {!apiKey ? (
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <div className="rounded-xl border border-[#E5E1D8] bg-white p-8">
            <h1 className="font-serif text-2xl font-semibold text-[#141413]">
              Museos CABA — Configuración requerida
            </h1>
            <p className="mt-3 text-sm text-[#57534E]">
              Para mostrar el mapa interactivo y los museos más cercanos de
              Buenos Aires, configurá la variable{' '}
              <code className="font-mono text-xs">
                VITE_GOOGLE_MAPS_API_KEY
              </code>{' '}
              desde la configuración de Google Maps Platform.
            </p>
          </div>
        </div>
      ) : (
        <APIProvider
          apiKey={apiKey}
          language="es"
          region="AR"
          libraries={['places', 'marker', 'geometry', 'routes']}
        >
          <MuseumsExplorerContent />
        </APIProvider>
      )}
    </div>
  );
}
