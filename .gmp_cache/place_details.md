# Return Detailed Information About a Specific Place

This sub-workflow explains how to retrieve detailed information about a specific
place using the `Place` class and its `fetchFields()` method in the Maps
JavaScript API.

## Prerequisites

-   **API Key & Places API (New)**: Ensure the **Places API (New)** is enabled
    in your Google Cloud project and the Maps JavaScript API is loaded using the
    Dynamic Library Import bootstrap script.
-   **Place Identifier**: You need either a **Place ID** (e.g.,
    `'ChIJyYB_SZVU2YARR-I1Jjf08F0'`), a **Place resource name** (the place ID
    prefixed with `'places/'`), or an existing `Place` object returned
    dynamically from Text Search, Nearby Search, or Place Autocomplete.
-   **Map ID (Optional)**: If you plan to display an `AdvancedMarkerElement` on
    a map, a `mapId` is required when initializing the `Map`.

--------------------------------------------------------------------------------

## Core Workflow: `Place` Class and `fetchFields()`

### 1. Import the Required Libraries

Use `google.maps.importLibrary()` to dynamically load the `places` library (and
`maps` or `marker` if rendering on a map).

```javascript
const { Place } = await google.maps.importLibrary('places');
```

### 2. Instantiate a `Place` Object

If you don't already have a `Place` instance from a search or autocomplete
result, create one using a Place ID or resource name:

```javascript
// Option A: Using a Place ID
const place = new Place({
  id: 'ChIJyYB_SZVU2YARR-I1Jjf08F0', // San Diego Zoo
  requestedLanguage: 'en', // optional
});

// Option B: Using a Place resource name
const placeFromResource = new Place({
  resourceName: 'places/ChIJyYB_SZVU2YARR-I1JRF08F0',
});
```

### 3. Call `fetchFields()` to Retrieve Data

Call `place.fetchFields()` and pass an array of
[place data fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields)
specified in **camelCase**. Only request the fields you need to control billing
costs (fields are grouped into Basic, Contact, and Atmosphere SKUs).

```javascript
await place.fetchFields({
  fields: [
    'displayName',
    'formattedAddress',
    'location',
    'googleMapsURI',
  ],
});

// Access the populated properties directly on the `place` instance
console.log(place.displayName);
console.log(place.formattedAddress);
```

--------------------------------------------------------------------------------

## Complete Example: Fetch Place Details and Display on a Map

The following example initializes a map, creates a `Place` instance from a Place
ID, fetches specific fields (`displayName`, `formattedAddress`, `location`,
`googleMapsURI`), places an `AdvancedMarkerElement`, and displays the details in
an `InfoWindow`.

```javascript
let map;
let infoWindow;

async function initMap() {
  const [{ Map, InfoWindow }, { Place }, { AdvancedMarkerElement }] =
    await Promise.all([
      google.maps.importLibrary('maps'),
      google.maps.importLibrary('places'),
      google.maps.importLibrary('marker'),
    ]);

  // Initialize the map with usage attribution and a Map ID for Advanced Markers
  map = new Map(document.getElementById('map'), {
    center: { lat: 32.7353, lng: -117.1490 },
    zoom: 14,
    mapId: 'DEMO_MAP_ID',
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  });

  infoWindow = new InfoWindow();

  await getPlaceDetails(Place, AdvancedMarkerElement);
}

async function getPlaceDetails(Place, AdvancedMarkerElement) {
  // 1. Use place ID to create a new Place instance.
  const place = new Place({
    id: 'ChIJyYB_SZVU2YARR-I1Jjf08F0', // San Diego Zoo
  });

  // 2. Call fetchFields, passing the desired data fields in camelCase.
  await place.fetchFields({
    fields: [
      'displayName',
      'formattedAddress',
      'location',
      'googleMapsURI',
    ],
  });

  // 3. Center the map and add an Advanced Marker.
  if (place.location) {
    map.setCenter(place.location);
  }

  const marker = new AdvancedMarkerElement({
    map: map,
    position: place.location,
    title: place.displayName,
  });

  // 4. Assemble the info window content safely using DOM methods.
  const content = document.createElement('div');
  const address = document.createElement('div');
  const placeId = document.createElement('div');
  address.textContent = place.formattedAddress || '';
  placeId.textContent = place.id;
  content.append(placeId, address);

  if (place.googleMapsURI) {
    const link = document.createElement('a');
    link.href = place.googleMapsURI;
    link.target = '_blank';
    link.textContent = 'View Details on Google Maps';
    content.appendChild(link);
  }

  // 5. Display the info window.
  infoWindow.setHeaderContent(place.displayName);
  infoWindow.setContent(content);
  infoWindow.open({
    map: map,
    anchor: marker,
  });
}

initMap();
```

--------------------------------------------------------------------------------

## Common Patterns & Rich Data Fields

### Fetching Place Photos and Attributions

When requesting the `photos` field, each element in `place.photos` allows you to
generate an image URI via `photo.getURI({ maxHeight, maxWidth })`. **You must
display the required `authorAttributions` alongside the photo.**

Source:
[samples/place-photos/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-photos/index.ts?utm_campaign=gmp_git_agentskills_v1)

```javascript
async function fetchPlacePhotos() {
  const { Place } = await google.maps.importLibrary('places');

  const place = new Place({
    id: 'ChIJydSuSkkUkFQRsqhB-cEtYnw', // Woodland Park Zoo, Seattle WA
  });

  await place.fetchFields({
    fields: ['displayName', 'photos', 'editorialSummary'],
  });

  if (place.photos && place.photos.length > 0) {
    const firstPhoto = place.photos[0];

    // Generate the image element using getURI()
    const img = document.createElement('img');
    img.src = firstPhoto.getURI({ maxHeight: 380 });

    // Create required author attribution link
    const attribution = firstPhoto.authorAttributions[0];
    const attributionLink = document.createElement('a');
    if (attribution) {
      attributionLink.textContent = attribution.displayName;
      attributionLink.href = attribution.uri;
      attributionLink.target = '_blank';
    }

    const container = document.getElementById('photo-container');
    container.append(img, attributionLink);
  }
}
```

### Fetching Place Reviews

When requesting the `reviews` field, `place.reviews` returns an array of
`Review` objects containing `rating`, `text`, and `authorAttribution`.

Source:
[samples/place-reviews/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-reviews/index.ts?utm_campaign=gmp_git_agentskills_v1)

```javascript
async function fetchPlaceReviews() {
  const { Place } = await google.maps.importLibrary('places');

  const place = new Place({
    id: 'ChIJpyiwa4Zw44kRBQSGWKv4wgA', // Faneuil Hall Marketplace, Boston, MA
  });

  await place.fetchFields({
    fields: ['displayName', 'formattedAddress', 'location', 'reviews'],
  });

  if (place.reviews && place.reviews.length > 0) {
    const firstReview = place.reviews[0];
    const reviewRating = firstReview.rating;
    const reviewText = firstReview.text;
    const authorName = firstReview.authorAttribution?.displayName;
    const authorUri = firstReview.authorAttribution?.uri;

    console.log(`${place.displayName} - ${reviewRating} stars by ${authorName} (${authorUri}): ${reviewText}`);
  }
}
```

### Fetching Details from Place Autocomplete

When using `PlaceAutocompleteElement` (`gmp-place-autocomplete`) or
`AutocompleteSuggestion`, the selection event or prediction provides a `Place`
object directly. You can immediately call `place.fetchFields()` on it:

Source:
[samples/place-autocomplete-element/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-autocomplete-element/index.ts?utm_campaign=gmp_git_agentskills_v1)

```javascript
const { PlaceAutocompleteElement } = await google.maps.importLibrary('places');

const placeAutocomplete = new PlaceAutocompleteElement();
placeAutocomplete.setAttribute('internal-usage-attribution-ids', 'gmp_git_agentskills_v1');
document.body.appendChild(placeAutocomplete);

placeAutocomplete.addEventListener('gmp-placeselect', async ({ place }) => {
  await place.fetchFields({
    fields: ['displayName', 'formattedAddress', 'location'],
  });

  console.log(JSON.stringify(place.toJSON(), null, 2));
});
```

### Using Places UI Kit Web Components (`<gmp-place-details>`)

If you want to render a pre-built UI component for Place Details rather than
building custom HTML from `place.fetchFields()`, you can use the
`<gmp-place-details>` or `<gmp-place-details-compact>` web components.

Source:
[examples/places-ui-kit/src/components/place-details.tsx](https://github.com/visgl/react-google-maps/blob/HEAD/examples/places-ui-kit/src/components/place-details.tsx?utm_campaign=gmp_git_agentskills_v1)

```html
<gmp-place-details internal-usage-attribution-ids="gmp_git_agentskills_v1">
  <gmp-place-details-place-request place="ChIJyYB_SZVU2YARR-I1Jjf08F0"></gmp-place-details-place-request>
  <gmp-place-standard-content></gmp-place-standard-content>
</gmp-place-details>
```

--------------------------------------------------------------------------------

## Best Practices & Guardrails

1.  **Prefer `Place.fetchFields()` over Legacy `PlacesService.getDetails()`**:
    -   Use the modern `Place` class (`new Place({ id })` +
        `await place.fetchFields({ fields })`) rather than the legacy
        `google.maps.places.PlacesService(map).getDetails()` callback API.
    -   Note that the `Place` class uses **camelCase** field names (e.g.,
        `'displayName'`, `'formattedAddress'`, `'googleMapsURI'`), whereas the
        legacy `PlacesService` used snake_case (e.g., `'name'`,
        `'formatted_address'`, `'place_id'`). Do not mix them.
2.  **Always Specify Only Needed `fields`**:
    -   Never request all fields if you only need basic metadata like
        `displayName`, `formattedAddress`, and `location`. Field masks directly
        determine the billing tier of the `fetchFields` request.
3.  **Display Required Attributions**:
    -   When displaying Places data—especially photos
        (`photo.authorAttributions`), reviews (`review.authorAttribution`), or
        listing attributions (`place.attributions`)—you are required by the
        Google Maps Platform Terms of Service to render the attributions clearly
        to the user.
