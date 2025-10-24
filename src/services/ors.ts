// src/services/ors.ts
import type { LatLng, PlaceSuggestion, RouteResult, TravelProfile } from '../types/route';

const ORS_BASE = 'https://api.openrouteservice.org';
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY as string;

// Flip to true if you want request/response logs in the console
const DEBUG_ORS = false;

if (!ORS_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[ORS] Missing VITE_ORS_API_KEY');
}

// ---------- Geocoding ----------
export async function geocodeSearch(query: string): Promise<PlaceSuggestion[]> {
  if (!query?.trim()) return [];
  const url = `${ORS_BASE}/geocode/autocomplete?api_key=${encodeURIComponent(
    ORS_KEY
  )}&text=${encodeURIComponent(query)}&size=5`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const feats = data.features ?? [];
  return feats.map((f: any, idx: number) => ({
    id: f.properties?.id ?? String(idx),
    label: f.properties?.label ?? f.properties?.name ?? 'Unknown',
    position: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] },
  }));
}

// ---------- Directions ----------
export interface DirectionsParams {
  profile: TravelProfile;
  from: LatLng; // lat/lng
  to: LatLng;   // lat/lng
}

export async function getDirections({ profile, from, to }: DirectionsParams): Promise<RouteResult> {
  const url = `${ORS_BASE}/v2/directions/${profile}?api_key=${encodeURIComponent(ORS_KEY)}`;

  // ORS expects [lon, lat]
  const coords: [number, number][] = [
    [from.lng, from.lat],
    [to.lng, to.lat],
  ];

  const payload = {
    coordinates: coords,
    format: 'geojson',
    instructions: false,
  };

  if (DEBUG_ORS) console.log('[ORS] POST', url, payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    if (DEBUG_ORS) console.error('[ORS] !res.ok', res.status, text);
    throw new Error(`ORS directions failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  if (DEBUG_ORS) console.log('[ORS] response keys:', Object.keys(data));

  // Case A: GeoJSON FeatureCollection
  if (Array.isArray(data.features) && data.features.length > 0) {
    const feature = data.features[0];
    const coordinates: [number, number][] = feature.geometry.coordinates;
    const points = coordinates.map(([lon, lat]) => ({ lat, lng: lon }));

    const summary = feature.properties.summary ?? data.metadata?.summary;
    const distanceKm = (summary.distance as number) / 1000;
    const durationMin = (summary.duration as number) / 60;
    const bbox = data.bbox as [number, number, number, number] | undefined;

    return {
      summary: { distanceKm, durationMin },
      geometry: { points },
      bbox,
    };
  }

  // Case B: Default JSON with routes[]
  if (Array.isArray(data.routes) && data.routes.length > 0) {
    const route0 = data.routes[0];

    let points: LatLng[] = [];
    if (route0.geometry?.coordinates) {
      points = route0.geometry.coordinates.map(
        ([lon, lat]: [number, number]) => ({ lat, lng: lon })
      );
    } else if (typeof route0.geometry === 'string') {
      // Encoded polyline fallback
      points = decodePolyline(route0.geometry);
    }

    const distanceKm = (route0.summary?.distance as number) / 1000;
    const durationMin = (route0.summary?.duration as number) / 60;

    return {
      summary: { distanceKm, durationMin },
      geometry: { points },
    };
  }

  // If neither shape matched, surface a helpful error
  throw new Error(`ORS directions: unexpected response shape (keys: ${Object.keys(data).join(', ')})`);
}

// Minimal polyline decoder for ORS polyline5 (only used as fallback)
function decodePolyline(str: string): LatLng[] {
  let index = 0, lat = 0, lng = 0;
  const coordinates: LatLng[] = [];

  const shiftAndMask = () => {
    let result = 0, shift = 0, b: number;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return (result & 1) ? ~(result >> 1) : (result >> 1);
  };

  while (index < str.length) {
    lat += shiftAndMask();
    lng += shiftAndMask();
    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coordinates;
}
