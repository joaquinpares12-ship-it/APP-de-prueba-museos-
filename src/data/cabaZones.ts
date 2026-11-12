import type {OriginPoint} from '../types/museum';

/**
 * Geographic reference points across CABA neighborhoods so tourists can
 * explore nearest museums from their hotel or current district.
 */
export const CABA_STARTING_ZONES: OriginPoint[] = [
  {
    id: 'centro',
    label: 'Centro / Obelisco',
    subtitle: 'Av. 9 de Julio y Corrientes',
    lat: -34.603722,
    lng: -58.381592,
  },
  {
    id: 'recoleta',
    label: 'Recoleta',
    subtitle: 'Av. del Libertador y Pueyrredón',
    lat: -34.5875,
    lng: -58.3935,
  },
  {
    id: 'palermo',
    label: 'Palermo',
    subtitle: 'Av. del Libertador y Dorrego',
    lat: -34.5735,
    lng: -58.4195,
  },
  {
    id: 'san_telmo',
    label: 'San Telmo',
    subtitle: 'Plaza Dorrego y Defensa',
    lat: -34.6209,
    lng: -58.3717,
  },
  {
    id: 'la_boca',
    label: 'La Boca',
    subtitle: 'Caminito y Vuelta de Rocha',
    lat: -34.6394,
    lng: -58.3627,
  },
  {
    id: 'puerto_madero',
    label: 'Puerto Madero',
    subtitle: 'Puente de la Mujer',
    lat: -34.6083,
    lng: -58.3652,
  },
  {
    id: 'belgrano',
    label: 'Belgrano',
    subtitle: 'Barrancas de Belgrano',
    lat: -34.5608,
    lng: -58.4508,
  },
];

export const CABA_BOUNDS_RESTRICTION = {
  north: -34.52,
  south: -34.71,
  west: -58.54,
  east: -58.33,
};

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '—';
  if (meters < 1000) {
    return `${Math.round(meters / 10) * 10} m`;
  }
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function formatWalkEstimate(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / 78));
  if (minutes < 60) {
    return `${minutes} min a pie`;
  }
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem > 0 ? `${hrs} h ${rem} min a pie` : `${hrs} h a pie`;
}

export interface PricePresentation {
  label: string;
  detail: string;
  tierSymbol: string;
}

export function formatPriceLevel(priceLevel?: string | null): PricePresentation {
  switch (priceLevel) {
    case 'FREE':
      return {
        label: 'Entrada gratuita',
        detail: 'Acceso libre informado en Google Maps.',
        tierSymbol: 'Gratis',
      };
    case 'INEXPENSIVE':
      return {
        label: 'Entrada económica',
        detail: 'Nivel de tarifa accesible ($). Confirmá el valor vigente en ARS para turistas en la web del museo.',
        tierSymbol: '$',
      };
    case 'MODERATE':
      return {
        label: 'Entrada moderada',
        detail: 'Nivel de tarifa intermedia ($$). Consultá tarifas diferenciadas para residentes y extranjeros.',
        tierSymbol: '$$',
      };
    case 'EXPENSIVE':
      return {
        label: 'Entrada general arancelada',
        detail: 'Nivel de tarifa elevada ($$$). Revisá promociones o días gratuitos en el sitio oficial.',
        tierSymbol: '$$$',
      };
    case 'VERY_EXPENSIVE':
      return {
        label: 'Tarifa premium',
        detail: 'Nivel de tarifa alta ($$$$). Verificá pases y entradas anticipadas online.',
        tierSymbol: '$$$$',
      };
    default:
      return {
        label: 'Consultar tarifa oficial',
        detail: 'Los museos públicos y privados de CABA suelen diferenciar tarifa general, residentes y días gratuitos.',
        tierSymbol: 'Tarifa web',
      };
  }
}

export function formatDurationSeconds(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const obj = typeof error === 'object' ? (error as Record<string, unknown>) : null;
  const status = obj?.status ?? obj?.code;
  return (
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    status === 'OVER_QUERY_LIMIT' ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('OverQuotaMapError') ||
    msg.includes('QuotaExceededError') ||
    msg.includes('429')
  );
}

export function notifyQuotaExceeded(): void {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
}
