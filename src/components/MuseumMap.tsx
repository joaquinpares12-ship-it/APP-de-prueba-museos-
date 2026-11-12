import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  formatDistance,
  formatDurationSeconds,
  formatPriceLevel,
  isQuotaError,
  notifyQuotaExceeded,
} from '../data/cabaZones';
import type {
  MuseumItem,
  OriginPoint,
  RouteSummary,
  TravelModeOption,
} from '../types/museum';

const ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

interface MuseumMapProps {
  origin: OriginPoint;
  museums: MuseumItem[];
  selectedMuseum: MuseumItem | null;
  hoveredMuseumId: string | null;
  routeTarget: MuseumItem | null;
  travelMode: TravelModeOption;
  onChangeTravelMode: (mode: TravelModeOption) => void;
  onClearRoute: () => void;
  onSelectMuseum: (museum: MuseumItem) => void;
}

interface MarkerWithPopupProps {
  museum: MuseumItem;
  rankIndex: number;
  isSelected: boolean;
  isHovered: boolean;
  zIndex: number;
  isInfoOpen: boolean;
  onMarkerClick: (
    museum: MuseumItem,
    marker: google.maps.marker.AdvancedMarkerElement
  ) => void;
}

function MuseumMarkerItem({
  museum,
  rankIndex,
  isSelected,
  isHovered,
  zIndex,
  onMarkerClick,
}: MarkerWithPopupProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <AdvancedMarker
      ref={markerRef}
      position={museum.location}
      zIndex={zIndex}
      title={museum.displayName}
      onClick={() => {
        if (marker) {
          onMarkerClick(museum, marker);
        }
      }}
    >
      <div
        className={`flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs font-semibold shadow-sm transition-transform duration-150 tabular-nums ${
          isSelected
            ? 'scale-110 border-white bg-[#1E3A8A] text-white shadow-md'
            : isHovered
              ? 'scale-105 border-[#1E3A8A] bg-[#141413] text-white'
              : 'border-[#141413]/20 bg-white text-[#141413] hover:border-[#1E3A8A]'
        }`}
      >
        <span>{String(rankIndex + 1).padStart(2, '0')}</span>
      </div>
    </AdvancedMarker>
  );
}

export function MuseumMap({
  origin,
  museums,
  selectedMuseum,
  hoveredMuseumId,
  routeTarget,
  travelMode,
  onChangeTravelMode,
  onClearRoute,
  onSelectMuseum,
}: MuseumMapProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const coreLib = useMapsLibrary('core');

  const [infoMuseum, setInfoMuseum] = useState<MuseumItem | null>(null);
  const [infoAnchor, setInfoAnchor] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const activePolylinesRef = useRef<google.maps.Polyline[]>([]);

  const clearPolylines = useCallback(() => {
    for (const poly of activePolylinesRef.current) {
      poly.setMap(null);
    }
    activePolylinesRef.current = [];
  }, []);

  // Re-center map smoothly when origin changes and no active route is shown
  useEffect(() => {
    if (!map || routeTarget) return;
    map.panTo({lat: origin.lat, lng: origin.lng});
  }, [map, origin.lat, origin.lng, routeTarget]);

  // Fit bounds to show origin + top nearby museums when museum list updates
  useEffect(() => {
    if (!map || !coreLib || routeTarget || museums.length === 0) return;
    const bounds = new coreLib.LatLngBounds();
    bounds.extend({lat: origin.lat, lng: origin.lng});
    museums.slice(0, 8).forEach((m) => bounds.extend(m.location));
    map.fitBounds(bounds, {top: 48, right: 48, bottom: 48, left: 48});
  }, [map, coreLib, museums, origin.lat, origin.lng, routeTarget]);

  // Compute route using modern Routes API SDK (Route.computeRoutes)
  useEffect(() => {
    if (!routeTarget) {
      clearPolylines();
      setRouteSummary(null);
      setRouteError(null);
      return;
    }

    if (!routesLib || !map) return;

    let cancelled = false;
    setIsRouting(true);
    setRouteError(null);
    clearPolylines();

    const runRoute = async () => {
      try {
        const request: google.maps.routes.ComputeRoutesRequest = {
          origin: {lat: origin.lat, lng: origin.lng},
          destination: routeTarget.location,
          travelMode: travelMode as google.maps.TravelModeString,
          fields: [
            'path',
            'legs',
            'distanceMeters',
            'durationMillis',
            'localizedValues',
            'viewport',
          ],
          language: 'es',
          region: 'ar',
          internalUsageAttributionIds: [ATTRIBUTION_ID],
        };

        const response = await routesLib.Route.computeRoutes(request);
        if (cancelled) return;

        const computed = response.routes?.[0];
        if (!computed) {
          setRouteError(
            'No se encontró una ruta disponible para este medio de transporte.'
          );
          setRouteSummary(null);
          return;
        }

        const polylines = computed.createPolylines({
          polylineOptions: {
            strokeColor: '#1E3A8A',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          },
        });
        polylines.forEach((p) => p.setMap(map));
        activePolylinesRef.current = polylines;

        if (computed.viewport) {
          map.fitBounds(computed.viewport, {
            top: 72,
            right: 48,
            bottom: 48,
            left: 48,
          });
        }

        const durationSec = computed.durationMillis
          ? computed.durationMillis / 1000
          : 0;
        const durationText =
          computed.localizedValues?.duration ||
          (durationSec > 0 ? formatDurationSeconds(durationSec) : '—');

        setRouteSummary({
          distanceMeters: computed.distanceMeters ?? routeTarget.distanceMeters,
          durationText,
          travelMode,
          route: computed,
        });
      } catch (err) {
        if (cancelled) return;
        if (isQuotaError(err)) {
          notifyQuotaExceeded();
        }
        setRouteError(
          'No se pudo calcular la ruta en este momento. Probá otro modo de viaje.'
        );
      } finally {
        if (!cancelled) {
          setIsRouting(false);
        }
      }
    };

    void runRoute();

    return () => {
      cancelled = true;
      clearPolylines();
    };
  }, [
    routeTarget,
    travelMode,
    origin.lat,
    origin.lng,
    routesLib,
    map,
    clearPolylines,
  ]);

  // Sort markers by latitude descending so southern pins render above northern ones
  const sortedWithRank = useMemo(() => {
    const rankLookup: Record<string, number> = {};
    museums.forEach((m, i) => {
      rankLookup[m.id] = i;
    });
    return [...museums]
      .sort((a, b) => b.location.lat - a.location.lat)
      .map((museum, idx) => ({
        museum,
        rankIndex: rankLookup[museum.id] ?? idx,
        baseZIndex: idx + 1,
      }));
  }, [museums]);

  const handleMarkerClick = useCallback(
    (
      museum: MuseumItem,
      marker: google.maps.marker.AdvancedMarkerElement
    ) => {
      setInfoMuseum(museum);
      setInfoAnchor(marker);
      onSelectMuseum(museum);
    },
    [onSelectMuseum]
  );

  const travelModes: Array<{value: TravelModeOption; label: string}> = [
    {value: 'WALKING', label: 'A pie'},
    {value: 'TRANSIT', label: 'Subte / Bus'},
    {value: 'DRIVING', label: 'Auto / Taxi'},
  ];

  return (
    <div
      id="mapa"
      className="relative h-[520px] w-full overflow-hidden rounded-xl border border-[#E5E1D8] bg-[#EBE8E0] lg:h-[calc(100vh-140px)] lg:min-h-[580px]"
    >
      <GoogleMap
        mapId="DEMO_MAP_ID"
        defaultCenter={{lat: origin.lat, lng: origin.lng}}
        defaultZoom={14}
        gestureHandling="greedy"
        streetViewControl={false}
        mapTypeControl={false}
        clickableIcons={false}
        internalUsageAttributionIds={[ATTRIBUTION_ID]}
        onClick={() => {
          setInfoMuseum(null);
          setInfoAnchor(null);
        }}
        className="h-full w-full"
      >
        {/* Origin marker */}
        <AdvancedMarker
          position={{lat: origin.lat, lng: origin.lng}}
          zIndex={1100}
          title={`Tu partida: ${origin.label}`}
        >
          <div className="flex flex-col items-center">
            <div className="rounded-md border border-white bg-[#141413] px-2.5 py-1 text-[11px] font-semibold text-white shadow-md whitespace-nowrap">
              Partida: {origin.label}
            </div>
            <div className="mt-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#1E3A8A] shadow" />
          </div>
        </AdvancedMarker>

        {/* Museum markers */}
        {sortedWithRank.map(({museum, rankIndex, baseZIndex}) => {
          const isSelected = selectedMuseum?.id === museum.id;
          const isHovered = hoveredMuseumId === museum.id;
          const zIndex = isSelected ? 1000 : isHovered ? 999 : baseZIndex;

          return (
            <MuseumMarkerItem
              key={museum.id}
              museum={museum}
              rankIndex={rankIndex}
              isSelected={isSelected}
              isHovered={isHovered}
              zIndex={zIndex}
              isInfoOpen={infoMuseum?.id === museum.id}
              onMarkerClick={handleMarkerClick}
            />
          );
        })}

        {/* Anchored InfoWindow */}
        {infoMuseum && infoAnchor && (
          <InfoWindow
            anchor={infoAnchor}
            maxWidth={270}
            onCloseClick={() => {
              setInfoMuseum(null);
              setInfoAnchor(null);
            }}
          >
            <div className="p-1 font-sans text-[#141413]">
              <p className="font-serif text-sm font-semibold leading-snug">
                {infoMuseum.displayName}
              </p>
              <p className="mt-1 text-xs text-[#57534E]">
                {formatDistance(infoMuseum.distanceMeters)} ·{' '}
                {formatPriceLevel(infoMuseum.priceLevel).label}
              </p>
              <p className="mt-1 text-xs text-[#78716C]">
                {infoMuseum.formattedAddress}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Active Route Overlay Panel */}
      {routeTarget && (
        <div className="absolute left-3 right-3 top-3 z-20 rounded-xl border border-[#E5E1D8] bg-white/95 p-3.5 shadow-md backdrop-blur-sm sm:left-4 sm:right-auto sm:max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[#57534E]">
                Ruta recomendada
              </p>
              <h4 className="truncate font-serif text-base font-semibold text-[#141413]">
                Hacia {routeTarget.displayName}
              </h4>
            </div>
            <button
              type="button"
              onClick={onClearRoute}
              className="rounded-md px-2 py-1 text-xs font-medium text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#141413] cursor-pointer whitespace-nowrap shrink-0"
            >
              Cerrar ruta
            </button>
          </div>

          <div className="mt-2.5 flex items-center gap-1 rounded-lg bg-[#F3F1EC] p-1">
            {travelModes.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onChangeTravelMode(m.value)}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  travelMode === m.value
                    ? 'bg-white text-[#141413] shadow-sm'
                    : 'text-[#57534E] hover:text-[#141413]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="mt-2.5 text-xs text-[#44403C]">
            {isRouting && <span>Calculando recorrido óptimo en CABA...</span>}
            {!isRouting && routeError && (
              <span className="text-[#9A3412]">{routeError}</span>
            )}
            {!isRouting && routeSummary && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono font-medium text-[#141413] tabular-nums">
                  {routeSummary.durationText} ·{' '}
                  {formatDistance(routeSummary.distanceMeters)}
                </div>
                {routeTarget.googleMapsURI && (
                  <a
                    href={routeTarget.googleMapsURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#1E3A8A] underline hover:text-[#172D6E]"
                  >
                    Abrir en Google Maps
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
