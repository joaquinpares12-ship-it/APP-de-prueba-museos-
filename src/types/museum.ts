export type CategoryFilter = 'all' | 'museum' | 'art_gallery' | 'historical_landmark';

export type TravelModeOption = 'WALKING' | 'TRANSIT' | 'DRIVING';

export interface OriginPoint {
  id: string;
  label: string;
  subtitle: string;
  lat: number;
  lng: number;
  isUserLocation?: boolean;
}

export interface PhotoMeta {
  url: string;
  attributions: Array<{
    displayName: string;
    uri?: string | null;
  }>;
}

export interface ReviewMeta {
  authorName: string;
  authorUri?: string | null;
  authorPhotoUri?: string | null;
  rating?: number | null;
  text?: string | null;
  relativePublishTimeDescription?: string | null;
}

export interface RouteSummary {
  distanceMeters: number;
  durationText: string;
  travelMode: TravelModeOption;
  route: google.maps.routes.Route;
}

export interface MuseumItem {
  id: string;
  place: google.maps.places.Place;
  displayName: string;
  formattedAddress: string;
  primaryTypeDisplayName: string;
  location: google.maps.LatLngLiteral;
  distanceMeters: number;
  rating?: number | null;
  userRatingCount?: number | null;
  priceLevel?: string | null;
  editorialSummary?: string | null;
  generativeSummaryText?: string | null;
  googleMapsURI?: string | null;
  websiteURI?: string | null;
  phoneNumber?: string | null;
  isOpenNow?: boolean | null;
  weekdayDescriptions?: string[];
  photos: PhotoMeta[];
  reviews: ReviewMeta[];
  accessibilityOptions?: {
    hasWheelchairAccessibleEntrance?: boolean | null;
    hasWheelchairAccessibleRestroom?: boolean | null;
    hasWheelchairAccessibleParking?: boolean | null;
    hasWheelchairAccessibleSeating?: boolean | null;
  } | null;
  paymentOptions?: {
    acceptsCreditCards?: boolean | null;
    acceptsDebitCards?: boolean | null;
    acceptsCashOnly?: boolean | null;
    acceptsNfc?: boolean | null;
  } | null;
  attributions: Array<{
    provider: string;
    providerURI?: string | null;
  }>;
  detailsLoaded: boolean;
}
