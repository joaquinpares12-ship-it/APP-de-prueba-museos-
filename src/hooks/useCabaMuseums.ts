import {useCallback, useEffect, useRef, useState} from 'react';
import {useMapsLibrary} from '@vis.gl/react-google-maps';
import {isQuotaError, notifyQuotaExceeded} from '../data/cabaZones';
import type {
  CategoryFilter,
  MuseumItem,
  OriginPoint,
  PhotoMeta,
  ReviewMeta,
} from '../types/museum';

const ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

/**
 * Computes whether a place is currently open in Buenos Aires (America/Argentina/Buenos_Aires)
 * using its regularOpeningHours periods, ensuring compatibility on the weekly channel.
 */
function computeIsOpenInCaba(
  regularOpeningHours?: google.maps.places.OpeningHours | null
): boolean | null {
  if (!regularOpeningHours?.periods || regularOpeningHours.periods.length === 0) {
    return null;
  }

  // Handle 24/7 case (single period with day 0, hour 0, minute 0 and no close)
  if (
    regularOpeningHours.periods.length === 1 &&
    regularOpeningHours.periods[0].open.day === 0 &&
    regularOpeningHours.periods[0].open.hour === 0 &&
    regularOpeningHours.periods[0].open.minute === 0 &&
    !regularOpeningHours.periods[0].close
  ) {
    return true;
  }

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? '';
    const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
    const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '0';

    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const currentDay = dayMap[weekdayStr];
    if (currentDay === undefined) return null;

    const currentHour = parseInt(hourStr, 10) % 24;
    const currentMinute = parseInt(minuteStr, 10);
    const nowMinutesOfWeek = currentDay * 1440 + currentHour * 60 + currentMinute;
    const weekTotal = 7 * 1440;

    for (const period of regularOpeningHours.periods) {
      const openMinutes =
        period.open.day * 1440 + period.open.hour * 60 + period.open.minute;
      if (!period.close) {
        return true;
      }
      let closeMinutes =
        period.close.day * 1440 + period.close.hour * 60 + period.close.minute;

      if (closeMinutes <= openMinutes) {
        closeMinutes += weekTotal;
      }

      if (
        (nowMinutesOfWeek >= openMinutes && nowMinutesOfWeek < closeMinutes) ||
        (nowMinutesOfWeek + weekTotal >= openMinutes &&
          nowMinutesOfWeek + weekTotal < closeMinutes)
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return null;
  }
}

function extractPhotos(place: google.maps.places.Place, maxPhotos = 4): PhotoMeta[] {
  if (!place.photos || place.photos.length === 0) return [];
  return place.photos.slice(0, maxPhotos).map((photo) => ({
    url: photo.getURI({maxWidth: 960}),
    attributions: (photo.authorAttributions ?? []).map((a) => ({
      displayName: a.displayName || 'Contribuyente de Google Maps',
      uri: a.uri,
    })),
  }));
}

function extractReviews(place: google.maps.places.Place): ReviewMeta[] {
  if (!place.reviews || place.reviews.length === 0) return [];
  return place.reviews.slice(0, 5).map((r) => ({
    authorName: r.authorAttribution?.displayName || 'Visitante',
    authorUri: r.authorAttribution?.uri,
    authorPhotoUri: r.authorAttribution?.photoURI,
    rating: r.rating,
    text: r.text || r.originalText,
    relativePublishTimeDescription: r.relativePublishTimeDescription,
  }));
}

function toLatLngLiteral(
  loc: google.maps.LatLng | null | undefined
): google.maps.LatLngLiteral | null {
  if (!loc) return null;
  return {lat: loc.lat(), lng: loc.lng()};
}

function mapPlaceToMuseum(
  place: google.maps.places.Place,
  origin: OriginPoint,
  spherical: typeof google.maps.geometry.spherical | undefined,
  detailsLoaded = false
): MuseumItem | null {
  const coords = toLatLngLiteral(place.location);
  if (!coords) return null;

  let distanceMeters = 0;
  if (spherical && place.location) {
    distanceMeters = spherical.computeDistanceBetween(
      new google.maps.LatLng(origin.lat, origin.lng),
      place.location
    );
  }

  const rawAttributions =
    (place as unknown as {attributions?: google.maps.places.Attribution[]})
      .attributions ?? [];

  return {
    id: place.id,
    place,
    displayName: place.displayName || 'Espacio cultural en CABA',
    formattedAddress: place.formattedAddress || 'Ciudad Autónoma de Buenos Aires',
    primaryTypeDisplayName: place.primaryTypeDisplayName || 'Museo',
    location: coords,
    distanceMeters,
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    priceLevel: place.priceLevel,
    editorialSummary: place.editorialSummary,
    generativeSummaryText: place.generativeSummary?.overview ?? null,
    googleMapsURI: place.googleMapsURI,
    websiteURI: place.websiteURI,
    phoneNumber: place.internationalPhoneNumber || place.nationalPhoneNumber,
    isOpenNow: computeIsOpenInCaba(place.regularOpeningHours),
    weekdayDescriptions: place.regularOpeningHours?.weekdayDescriptions ?? [],
    photos: extractPhotos(place, detailsLoaded ? 5 : 1),
    reviews: detailsLoaded ? extractReviews(place) : [],
    accessibilityOptions: place.accessibilityOptions
      ? {
          hasWheelchairAccessibleEntrance:
            place.accessibilityOptions.hasWheelchairAccessibleEntrance,
          hasWheelchairAccessibleRestroom:
            place.accessibilityOptions.hasWheelchairAccessibleRestroom,
          hasWheelchairAccessibleParking:
            place.accessibilityOptions.hasWheelchairAccessibleParking,
          hasWheelchairAccessibleSeating:
            place.accessibilityOptions.hasWheelchairAccessibleSeating,
        }
      : null,
    paymentOptions: place.paymentOptions
      ? {
          acceptsCreditCards: place.paymentOptions.acceptsCreditCards,
          acceptsDebitCards: place.paymentOptions.acceptsDebitCards,
          acceptsCashOnly: place.paymentOptions.acceptsCashOnly,
          acceptsNfc: place.paymentOptions.acceptsNFC,
        }
      : null,
    attributions: rawAttributions.map((a) => ({
      provider: a.provider || 'Google Maps',
      providerURI: a.providerURI,
    })),
    detailsLoaded,
  };
}

export function useCabaMuseums(
  origin: OriginPoint,
  category: CategoryFilter,
  radiusMeters: number,
  searchText: string
) {
  const placesLib = useMapsLibrary('places');
  const geometryLib = useMapsLibrary('geometry');
  const [museums, setMuseums] = useState<MuseumItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  const fetchNearbyMuseums = useCallback(async () => {
    if (!placesLib || !geometryLib) return;

    const seq = ++requestSeqRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const {Place, SearchNearbyRankPreference} = placesLib;
      const clampedRadius = Math.min(Math.max(radiusMeters, 1000), 50000);

      const baseFields = [
        'id',
        'displayName',
        'location',
        'formattedAddress',
        'primaryTypeDisplayName',
        'rating',
        'userRatingCount',
        'regularOpeningHours',
        'photos',
        'businessStatus',
        'googleMapsURI',
        'priceLevel',
        'editorialSummary',
      ];

      let places: google.maps.places.Place[] = [];

      const trimmedQuery = searchText.trim();
      if (trimmedQuery.length >= 2) {
        const res = await Place.searchByText({
          textQuery: `${trimmedQuery} museo Buenos Aires`,
          fields: baseFields,
          locationBias: {
            center: {lat: origin.lat, lng: origin.lng},
            radius: clampedRadius,
          },
          maxResultCount: 20,
          language: 'es',
          region: 'ar',
          internalUsageAttributionIds: [ATTRIBUTION_ID],
        });
        places = res?.places ?? [];
      } else {
        const includedPrimaryTypes =
          category === 'all'
            ? ['museum', 'art_gallery']
            : [category];

        const res = await Place.searchNearby({
          fields: baseFields,
          locationRestriction: {
            center: {lat: origin.lat, lng: origin.lng},
            radius: clampedRadius,
          },
          includedPrimaryTypes,
          maxResultCount: 20,
          rankPreference: SearchNearbyRankPreference.DISTANCE,
          language: 'es',
          region: 'ar',
          internalUsageAttributionIds: [ATTRIBUTION_ID],
        });
        places = res?.places ?? [];
      }

      if (seq !== requestSeqRef.current) return;

      const mapped = places
        .filter((p) => p.businessStatus !== 'CLOSED_PERMANENTLY')
        .map((p) => mapPlaceToMuseum(p, origin, geometryLib.spherical, false))
        .filter((item): item is MuseumItem => item !== null)
        .sort((a, b) => a.distanceMeters - b.distanceMeters);

      setMuseums(mapped);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      if (isQuotaError(err)) {
        notifyQuotaExceeded();
      }
      setError(
        'No se pudieron cargar los museos cercanos en este momento. Intentá nuevamente o probá otro radio de búsqueda.'
      );
      setMuseums([]);
    } finally {
      if (seq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [placesLib, geometryLib, origin.lat, origin.lng, category, radiusMeters, searchText]);

  useEffect(() => {
    void fetchNearbyMuseums();
  }, [fetchNearbyMuseums]);

  const loadMuseumDetails = useCallback(
    async (museumId: string): Promise<MuseumItem | null> => {
      const target = museums.find((m) => m.id === museumId);
      if (!target) return null;
      if (target.detailsLoaded) return target;

      setLoadingDetailsId(museumId);
      try {
        await target.place.fetchFields({
          fields: [
            'editorialSummary',
            'generativeSummary',
            'regularOpeningHours',
            'websiteURI',
            'internationalPhoneNumber',
            'nationalPhoneNumber',
            'accessibilityOptions',
            'paymentOptions',
            'reviews',
            'photos',
            'priceLevel',
            'googleMapsURI',
          ],
        });

        const updated = mapPlaceToMuseum(
          target.place,
          origin,
          geometryLib?.spherical,
          true
        );

        if (updated) {
          setMuseums((prev) =>
            prev.map((m) => (m.id === museumId ? updated : m))
          );
        }
        return updated;
      } catch (err) {
        if (isQuotaError(err)) {
          notifyQuotaExceeded();
        }
        return target;
      } finally {
        setLoadingDetailsId((prev) => (prev === museumId ? null : prev));
      }
    },
    [museums, origin, geometryLib]
  );

  return {
    museums,
    isLoading,
    error,
    loadingDetailsId,
    loadMuseumDetails,
    refetch: fetchNearbyMuseums,
  };
}
