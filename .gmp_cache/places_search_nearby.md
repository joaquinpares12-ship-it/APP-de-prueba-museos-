# Return a list of places and place details near a specific location

Use Nearby Search (New) in the Maps JavaScript API (`Place.searchNearby()`) to
return a list of `Place` objects and their requested data fields within a
specified circular region (`locationRestriction`), optionally filtered by place
types.

## Prerequisites & Setup

1.  **Enable APIs**: You must enable **Maps JavaScript API** and **Places API
    (New)** on your Google Cloud project.
2.  **Map ID**: If displaying results with `AdvancedMarkerElement`, your map
    requires a `mapId` (e.g., `DEMO_MAP_ID` for testing or a configured Map ID
    from the Google Cloud Console).
3.  **Dynamic Library Import**: Load the Maps JavaScript API using the dynamic
    library import bootstrap script and import the `places` library via
    `google.maps.importLibrary('places')`.

--------------------------------------------------------------------------------

## Core Workflow: `Place.searchNearby()`

### 1. Import Required Libraries

Import `Place` and `SearchNearbyRankPreference` from the `places` library. If
you are computing search radii dynamically from map bounds or rendering markers,
also import `geometry`, `maps`, `marker`, and `core`.

```javascript
const [
    { Place, SearchNearbyRankPreference },
    { AdvancedMarkerElement },
    { spherical },
    { LatLngBounds }
] = await Promise.all([
    google.maps.importLibrary('places'),
    google.maps.importLibrary('marker'),
    google.maps.importLibrary('geometry'),
    google.maps.importLibrary('core'),
]);
```

### 2. Construct the `SearchNearbyRequest`

Define a request object containing required `fields` and `locationRestriction`,
plus any optional filtering or ranking parameters.

```javascript
const request = {
    // Required parameters
    fields: [
        'displayName',
        'location',
        'formattedAddress',
        'businessStatus',
        'googleMapsURI',
    ],
    locationRestriction: {
        center: { lat: 52.369358, lng: 4.889258 },
        radius: 500, // Radius in meters (maximum 50,000)
    },
    // Optional parameters
    includedPrimaryTypes: ['restaurant'],
    maxResultCount: 5,
    rankPreference: SearchNearbyRankPreference.POPULARITY,
    language: 'en-US',
    region: 'us',
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
};
```

#### Key Request Parameters

| Parameter              | Requirement  | Description                                                                                   |
| :--------------------- | :----------- | :-------------------------------------------------------------------------------------------- |
| `fields`               | **Required** | Array of [Place class data                                                                    |
:                        :              : fields](https\://developers.google.com/maps/documentation/javascript/place-class-data-fields) :
:                        :              : to return (e.g., `'displayName'`, `'location'`, `'formattedAddress'`, `'googleMapsURI'`,      :
:                        :              : `'businessStatus'`). Only requested fields are populated and billed.                          :
| `locationRestriction`  | **Required** | Circular area defined by `{ center: LatLng \| LatLngLiteral, radius: number }`. The `radius`  |
:                        :              : is in meters and **cannot exceed `50000` (50 km)**.                                           :
| `includedPrimaryTypes` | Optional     | Array of [place                                                                               |
:                        :              : types](https\://developers.google.com/maps/documentation/javascript/place-types) to match     :
:                        :              : against the place's primary type (e.g., `['restaurant']`, `['cafe']`, `['museum']`).          :
| `maxResultCount`       | Optional     | Maximum number of results to return (between 1 and 20).                                       |
| `rankPreference`       | Optional     | `SearchNearbyRankPreference.POPULARITY` (default) or `SearchNearbyRankPreference.DISTANCE`.   |
| `language` / `region`  | Optional     | Language code (e.g., `'en-US'`) and region code (e.g., `'us'`) for formatting results.        |

### 3. Execute the Search and Process Results

Call `Place.searchNearby(request)`. It returns a promise resolving to
`{ places }`, which is an array of `Place` instances with your requested fields
pre-populated.

```javascript
const { places } = await Place.searchNearby(request);

if (places.length) {
    places.forEach((place) => {
        console.log(place.displayName, place.formattedAddress, place.location);
    });
} else {
    console.log('No results');
}
```

--------------------------------------------------------------------------------

## Complete Implementation Patterns

### Pattern A: Using `<gmp-map>` Web Component with Dynamic Viewport Radius

This pattern calculates the search radius dynamically from the current map
bounds (clamped to the 50,000-meter maximum), clears previous markers, renders
clickable `AdvancedMarkerElement` instances, and displays place details inside
an `InfoWindow` using safe DOM manipulation.

#### HTML

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Nearby Search</title>
        <style>
            html, body {
                height: 100%;
                margin: 0;
                padding: 0;
            }
            gmp-map {
                height: 100%;
            }
            .type-select {
                width: 400px;
                height: 32px;
                border: 1px solid #000;
                border-radius: 10px;
                padding: 0 10px;
                margin-left: 10px;
                margin-top: 10px;
                background: white;
            }
        </style>
        <script type="module" src="./index.js"></script>
        <script>
            (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
                key: "YOUR_API_KEY"
            });
        </script>
    </head>
    <body>
        <gmp-map
            center="45.438646,12.327573"
            zoom="14"
            map-id="DEMO_MAP_ID"
            internal-usage-attribution-ids="gmp_git_agentskills_v1"
        >
            <div id="controls" slot="control-inline-start-block-start">
                <select name="types" class="type-select">
                    <option value="cafe" selected>Cafe</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="museum">Museum</option>
                    <option value="monument">Monument</option>
                    <option value="park">Park</option>
                </select>
            </div>
        </gmp-map>
    </body>
</html>
```

#### JavaScript (`index.js`)

```javascript
const mapElement = document.querySelector('gmp-map');
let innerMap;
let center;
let typeSelect;
let infoWindow;

async function init() {
    const [{ InfoWindow }, { event }] = await Promise.all([
        google.maps.importLibrary('maps'),
        google.maps.importLibrary('core'),
    ]);

    innerMap = mapElement.innerMap;
    innerMap.setOptions({
        mapTypeControl: false,
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });

    typeSelect = document.querySelector('.type-select');
    typeSelect.addEventListener('change', () => {
        void nearbySearch();
    });

    infoWindow = new InfoWindow();

    // Kick off an initial search once map has loaded and bounds are available.
    event.addListenerOnce(innerMap, 'idle', () => {
        void nearbySearch();
    });
}

async function nearbySearch() {
    const [
        { Place, SearchNearbyRankPreference },
        { AdvancedMarkerElement },
        { spherical },
    ] = await Promise.all([
        google.maps.importLibrary('places'),
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('geometry'),
    ]);

    // Get bounds and radius to constrain search.
    center = mapElement.center;
    const ne = innerMap.getBounds().getNorthEast();
    const sw = innerMap.getBounds().getSouthWest();
    const diameter = spherical.computeDistanceBetween(ne, sw);
    const radius = Math.min(diameter / 2, 50000); // Radius cannot be more than 50000.

    const request = {
        // required parameters
        fields: [
            'displayName',
            'location',
            'formattedAddress',
            'googleMapsURI',
        ],
        locationRestriction: {
            center,
            radius,
        },
        // optional parameters
        includedPrimaryTypes: [typeSelect.value],
        maxResultCount: 5,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    };

    const { places } = await Place.searchNearby(request);

    if (places.length) {
        const { LatLngBounds } = await google.maps.importLibrary('core');
        const bounds = new LatLngBounds();

        // First remove all existing markers.
        for (const marker of mapElement.querySelectorAll('gmp-advanced-marker')) {
            marker.remove();
        }

        // Loop through and render all the results.
        places.forEach((place) => {
            if (!place.location) return;
            bounds.extend(place.location);

            const marker = new AdvancedMarkerElement({
                map: innerMap,
                position: place.location,
                title: place.displayName,
                gmpClickable: true,
            });

            // Build the content of the InfoWindow safely using DOM elements.
            const content = document.createElement('div');
            const address = document.createElement('div');
            address.textContent = place.formattedAddress || '';
            const placeId = document.createElement('div');
            placeId.textContent = place.id;
            content.append(address, placeId);

            if (place.googleMapsURI) {
                const link = document.createElement('a');
                link.href = place.googleMapsURI;
                link.target = '_blank';
                link.textContent = 'View Details on Google Maps';
                content.appendChild(link);
            }

            marker.addEventListener('gmp-click', () => {
                innerMap.panTo(place.location);
                updateInfoWindow(place.displayName, content, marker);
            });
        });

        innerMap.fitBounds(bounds, 100);
    } else {
        console.log('No results');
    }
}

function updateInfoWindow(title, content, anchor) {
    infoWindow.setContent(content);
    infoWindow.setHeaderContent(title);
    infoWindow.open({
        anchor,
    });
}

void init();
```

--------------------------------------------------------------------------------

### Pattern B: Programmatic `google.maps.Map` with Fixed Radius

Adapted from
[samples/place-nearby-search/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-nearby-search/index.ts?utm_campaign=gmp_git_agentskills_v1),
this pattern initializes a standard `<div id="map">` container and runs a
fixed-radius nearby search.

```typescript
let map: google.maps.Map;

async function initMap() {
    const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;

    const center = new google.maps.LatLng(52.369358, 4.889258);

    map = new Map(document.getElementById('map') as HTMLElement, {
        center: center,
        zoom: 11,
        mapId: 'DEMO_MAP_ID',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });

    await nearbySearch();
}

async function nearbySearch() {
    const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
    const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

    const center = new google.maps.LatLng(52.369358, 4.889258);

    const request = {
        // required parameters
        fields: ['displayName', 'location', 'businessStatus'],
        locationRestriction: {
            center: center,
            radius: 500,
        },
        // optional parameters
        includedPrimaryTypes: ['restaurant'],
        maxResultCount: 5,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
        language: 'en-US',
        region: 'us',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    };

    const { places } = await Place.searchNearby(request);

    if (places.length) {
        const { LatLngBounds } = await google.maps.importLibrary('core') as google.maps.CoreLibrary;
        const bounds = new LatLngBounds();

        places.forEach((place) => {
            if (!place.location) return;

            new AdvancedMarkerElement({
                map,
                position: place.location,
                title: place.displayName,
            });

            bounds.extend(place.location as google.maps.LatLng);
        });

        map.fitBounds(bounds);
    } else {
        console.log('No results');
    }
}

initMap();
```

--------------------------------------------------------------------------------

## Fetching Additional Place Details on Demand (Photos, Reviews, etc.)

While `Place.searchNearby()` populates the `fields` specified in its initial
request for every returned `Place`, you can defer fetching heavier fields (such
as `photos`, `reviews`, or `editorialSummary`) until a user clicks on a specific
`Place` marker. Call `place.fetchFields()` on the individual `Place` instance
(or instantiate `new Place({ id })` directly):

*Source references:
[samples/place-class/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-class/index.ts?utm_campaign=gmp_git_agentskills_v1),
[samples/place-photos/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-photos/index.ts?utm_campaign=gmp_git_agentskills_v1),
[samples/place-reviews/index.ts](https://github.com/googlemaps/js-samples/blob/HEAD/samples/place-reviews/index.ts?utm_campaign=gmp_git_agentskills_v1)*

```javascript
// Fetch additional details for a specific Place object returned by searchNearby()
await place.fetchFields({
    fields: ['editorialSummary', 'photos', 'reviews'],
});

// Accessing Photos
if (place.photos && place.photos.length > 0) {
    const photoUri = place.photos[0].getURI({ maxHeight: 380 });
    const attributions = place.photos[0].authorAttributions; // Always display required attributions
}

// Accessing Reviews
if (place.reviews && place.reviews.length > 0) {
    const firstReview = place.reviews[0];
    console.log(firstReview.rating, firstReview.text, firstReview.authorAttribution?.displayName);
}
```

--------------------------------------------------------------------------------

## Best Practices & Pitfalls

1.  **Enforce the 50,000m Radius Limit**: `locationRestriction.radius` cannot
    exceed `50000` meters. When computing radius dynamically from map bounds
    (`spherical.computeDistanceBetween(ne, sw) / 2`), always clamp the value
    with `Math.min(diameter / 2, 50000)`.
2.  **Wait for Map `idle` Before Reading Bounds**: `innerMap.getBounds()` is
    `undefined` until the map finishes its initial projection. Use
    `event.addListenerOnce(innerMap, 'idle', () => { ... })` before calling
    `getBounds()`.
3.  **Prefer `Place.searchNearby()` Over Legacy
    `PlacesService.nearbySearch()`**: Use the promise-based
    `Place.searchNearby()` API from `google.maps.importLibrary('places')` rather
    than the legacy callback-based `google.maps.places.PlacesService`.
4.  **Request Only Needed Fields**: `fields` is a required parameter in
    `Place.searchNearby()`. Specify only the fields your UI consumes to minimize
    latency and avoid unnecessary Place Data SKU charges.
5.  **Clean Up Markers Between Searches**: Before rendering markers for a new
    search, remove existing `gmp-advanced-marker` elements (`marker.remove()` or
    `marker.map = null`) so stale results do not remain on the map.
