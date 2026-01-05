// src/services/ors.ts
import type { LatLng, TravelProfile } from '../types/route';

const ORS_BASE = 'https://api.openrouteservice.org';
const ORS_KEY = import.meta.env.VITE_ORS_API_KEY as string;

// true = request/response logs
const DEBUG_ORS = false;

if (!ORS_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[ORS] Missing VITE_ORS_API_KEY');
}

// ---------- Geocoding (raw) ----------

export type OrsGeocodeAutocompleteResponse = {
  features?: Array<{
    properties?: {
      id?: string;
      label?: string;
      name?: string;
    };
    geometry?: {
      // ORS returns [lon, lat]
      coordinates?: [number, number];
    };
  }>;
};

export async function geocodeAutocompleteRaw(query: string): Promise<OrsGeocodeAutocompleteResponse> {
  if (!query?.trim()) return { features: [] };

  const url = `${ORS_BASE}/geocode/autocomplete?api_key=${encodeURIComponent(
    ORS_KEY
  )}&text=${encodeURIComponent(query)}&size=5`;

  const res = await fetch(url);
  if (!res.ok) return { features: [] };

  return (await res.json()) as OrsGeocodeAutocompleteResponse;
}

// ---------- Directions (raw) ----------

export interface DirectionsParams {
  profile: TravelProfile;
  from: LatLng; // lat/lng
  to: LatLng; // lat/lng
}

export type OrsDirectionsResponse = {
  // GeoJSON 
  features?: Array<{
    geometry?: {
      coordinates?: [number, number][];
    };
    properties?: {
      summary?: {
        distance?: number; // meters
        duration?: number; // seconds
      };
    };
  }>;
  bbox?: [number, number, number, number];

  // Non-geojson legacy shape
  routes?: Array<{
    summary?: {
      distance?: number;
      duration?: number;
    };
    geometry?: {
      coordinates?: [number, number][];
    } | string;
  }>;

  metadata?: {
    summary?: {
      distance?: number;
      duration?: number;
    };
  };
};

export async function getDirectionsRaw({ profile, from, to }: DirectionsParams): Promise<OrsDirectionsResponse> {
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

  return (await res.json()) as OrsDirectionsResponse;
}
