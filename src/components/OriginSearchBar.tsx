import {useEffect, useRef, useState} from 'react';
import {useMapsLibrary} from '@vis.gl/react-google-maps';
import {MapPin, Search, X} from 'lucide-react';
import {
  CABA_BOUNDS_RESTRICTION,
  CABA_STARTING_ZONES,
  isQuotaError,
  notifyQuotaExceeded,
} from '../data/cabaZones';
import type {CategoryFilter, OriginPoint} from '../types/museum';

interface OriginSearchBarProps {
  origin: OriginPoint;
  onSelectOrigin: (point: OriginPoint) => void;
  category: CategoryFilter;
  onChangeCategory: (category: CategoryFilter) => void;
  radiusMeters: number;
  onChangeRadius: (meters: number) => void;
  openOnly: boolean;
  onToggleOpenOnly: () => void;
  museumQuery: string;
  onChangeMuseumQuery: (q: string) => void;
}

interface AddressSuggestion {
  id: string;
  mainText: string;
  secondaryText: string;
  prediction: google.maps.places.PlacePrediction;
}

export function OriginSearchBar({
  origin,
  onSelectOrigin,
  category,
  onChangeCategory,
  radiusMeters,
  onChangeRadius,
  openOnly,
  onToggleOpenOnly,
  museumQuery,
  onChangeMuseumQuery,
}: OriginSearchBarProps) {
  const placesLib = useMapsLibrary('places');
  const [addressInput, setAddressInput] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = addressInput.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        const {suggestions: raw} =
          await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: trimmed,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ['ar'],
            locationRestriction: CABA_BOUNDS_RESTRICTION,
            language: 'es',
            region: 'ar',
          });

        const parsed: AddressSuggestion[] = [];
        for (const s of raw ?? []) {
          const pred = s.placePrediction;
          if (!pred) continue;
          parsed.push({
            id: pred.placeId,
            mainText: pred.mainText?.text || pred.text?.text || '',
            secondaryText: pred.secondaryText?.text || 'Buenos Aires',
            prediction: pred,
          });
        }
        setSuggestions(parsed);
        setIsDropdownOpen(parsed.length > 0);
      } catch (err) {
        if (isQuotaError(err)) {
          notifyQuotaExceeded();
        }
        setSuggestions([]);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [addressInput, placesLib]);

  const handleSelectSuggestion = async (item: AddressSuggestion) => {
    try {
      const place = item.prediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'],
      });
      if (place.location) {
        onSelectOrigin({
          id: `custom-${place.id}`,
          label: item.mainText || place.displayName || 'Punto seleccionado',
          subtitle: place.formattedAddress || item.secondaryText,
          lat: place.location.lat(),
          lng: place.location.lng(),
        });
      }
      setAddressInput('');
      setSuggestions([]);
      setIsDropdownOpen(false);
      sessionTokenRef.current = null;
    } catch (err) {
      if (isQuotaError(err)) {
        notifyQuotaExceeded();
      }
    }
  };

  const categories: Array<{value: CategoryFilter; label: string}> = [
    {value: 'all', label: 'Todos'},
    {value: 'museum', label: 'Museos'},
    {value: 'art_gallery', label: 'Galerías de Arte'},
    {value: 'historical_landmark', label: 'Sitios Históricos'},
  ];

  const radii = [
    {value: 2000, label: '2 km'},
    {value: 5000, label: '5 km'},
    {value: 10000, label: '10 km'},
  ];

  return (
    <section
      id="barrios"
      aria-label="Filtros y punto de partida en CABA"
      className="border-b border-[#E5E1D8] bg-white"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-5 space-y-4">
        {/* Row 1: Origin selector + CABA address autocomplete + museum name search */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5" ref={containerRef}>
            <label
              htmlFor="origin-autocomplete"
              className="block text-xs font-medium text-[#57534E] mb-1.5"
            >
              Tu punto de partida en Buenos Aires
            </label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1E3A8A]"
                aria-hidden="true"
              />
              <input
                id="origin-autocomplete"
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setIsDropdownOpen(true);
                }}
                placeholder={`Actual: ${origin.label} — buscá tu hotel o calle en CABA`}
                className="w-full rounded-lg border border-[#D8D3C8] bg-[#F8F7F4] py-2.5 pl-9 pr-9 text-sm text-[#141413] placeholder:text-[#78716C] focus:border-[#1E3A8A] focus:bg-white focus:outline-none"
              />
              {addressInput && (
                <button
                  type="button"
                  onClick={() => {
                    setAddressInput('');
                    setSuggestions([]);
                  }}
                  aria-label="Limpiar dirección"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#78716C] hover:text-[#141413] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {isDropdownOpen && suggestions.length > 0 && (
                <ul
                  role="listbox"
                  className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-y-auto rounded-lg border border-[#D8D3C8] bg-white shadow-lg divide-y divide-[#F1EFEA]"
                >
                  {suggestions.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => void handleSelectSuggestion(item)}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-[#F8F7F4] transition-colors cursor-pointer"
                      >
                        <div className="text-sm font-medium text-[#141413]">
                          {item.mainText}
                        </div>
                        <div className="text-xs text-[#78716C]">
                          {item.secondaryText}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <label
              htmlFor="museum-keyword"
              className="block text-xs font-medium text-[#57534E] mb-1.5"
            >
              Buscar museo específico
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716C]"
                aria-hidden="true"
              />
              <input
                id="museum-keyword"
                type="text"
                value={museumQuery}
                onChange={(e) => onChangeMuseumQuery(e.target.value)}
                placeholder="Ej. MALBA, Bellas Artes, Evita, Histórico..."
                className="w-full rounded-lg border border-[#D8D3C8] bg-[#F8F7F4] py-2.5 pl-9 pr-9 text-sm text-[#141413] placeholder:text-[#78716C] focus:border-[#1E3A8A] focus:bg-white focus:outline-none"
              />
              {museumQuery && (
                <button
                  type="button"
                  onClick={() => onChangeMuseumQuery('')}
                  aria-label="Limpiar búsqueda de museo"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#78716C] hover:text-[#141413] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col justify-end">
            <span className="block text-xs font-medium text-[#57534E] mb-1.5">
              Radio y disponibilidad
            </span>
            <div className="flex items-center gap-2">
              <div
                role="group"
                aria-label="Radio de búsqueda"
                className="inline-flex rounded-lg bg-[#F3F1EC] p-1"
              >
                {radii.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => onChangeRadius(r.value)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      radiusMeters === r.value
                        ? 'bg-white text-[#141413] shadow-sm'
                        : 'text-[#57534E] hover:text-[#141413]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-pressed={openOnly}
                onClick={onToggleOpenOnly}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  openOnly
                    ? 'border-[#1E3A8A] bg-[#1E3A8A] text-white'
                    : 'border-[#D8D3C8] bg-white text-[#141413] hover:bg-[#F8F7F4]'
                }`}
              >
                Abiertos ahora
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: CABA quick neighborhood origins + category tabs */}
        <div className="flex flex-col gap-3 pt-2 border-t border-[#F1EFEA] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-medium text-[#78716C] mr-1.5 whitespace-nowrap shrink-0">
              Barrios:
            </span>
            {CABA_STARTING_ZONES.map((zone) => {
              const active = origin.id === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => onSelectOrigin(zone)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#141413] text-white'
                      : 'bg-[#F3F1EC] text-[#57534E] hover:bg-[#E7E3DA] hover:text-[#141413]'
                  }`}
                >
                  {zone.label}
                </button>
              );
            })}
          </div>

          <div
            role="tablist"
            aria-label="Categoría cultural"
            className="inline-flex items-center gap-1 rounded-lg bg-[#F3F1EC] p-1 self-start lg:self-auto"
          >
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                role="tab"
                aria-selected={category === cat.value}
                onClick={() => onChangeCategory(cat.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  category === cat.value
                    ? 'bg-white text-[#141413] shadow-sm'
                    : 'text-[#57534E] hover:text-[#141413]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
