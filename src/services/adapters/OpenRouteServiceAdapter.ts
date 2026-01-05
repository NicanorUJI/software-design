import type { DirectionsParams, RoutingService } from '../../domain/ports/routing';
import type { LatLng, PlaceSuggestion, RouteResult } from '../../types/route';

import {
  geocodeAutocompleteRaw,
  getDirectionsRaw,
  type OrsDirectionsResponse,
  type OrsGeocodeAutocompleteResponse,
} from '../ors';

export class OpenRouteServiceAdapter implements RoutingService {
  async geocodeSearch(query: string): Promise<PlaceSuggestion[]> {
    const data: OrsGeocodeAutocompleteResponse = await geocodeAutocompleteRaw(query);
    const feats = data.features ?? [];

    return feats
      .map((f, idx) => {
        const coords = f.geometry?.coordinates;
        if (!coords) return null;

        return {
          id: f.properties?.id ?? String(idx),
          label: f.properties?.label ?? f.properties?.name ?? 'Unknown',
          position: { lat: coords[1], lng: coords[0] },
        } as PlaceSuggestion;
      })
      .filter((x): x is PlaceSuggestion => !!x);
  }

  async getDirections(params: DirectionsParams): Promise<RouteResult> {
    const data: OrsDirectionsResponse = await getDirectionsRaw(params);
    return this.mapDirectionsToRouteResult(data);
  }

  private mapDirectionsToRouteResult(data: OrsDirectionsResponse): RouteResult {
    if (Array.isArray(data.features) && data.features.length > 0) {
      const feature = data.features[0];
      const coordinates = feature.geometry?.coordinates ?? [];
      const points = coordinates.map(([lon, lat]) => ({ lat, lng: lon }));

      const summary = feature.properties?.summary ?? data.metadata?.summary;
      const distanceKm = ((summary?.distance ?? 0) as number) / 1000;
      const durationMin = ((summary?.duration ?? 0) as number) / 60;

      return {
        summary: { distanceKm, durationMin },
        geometry: { points },
        bbox: data.bbox,
      };
    }

    if (Array.isArray(data.routes) && data.routes.length > 0) {
      const route0 = data.routes[0];

      let points: LatLng[] = [];
      if (typeof route0.geometry === 'string') {
        points = decodePolyline(route0.geometry);
      } else if (route0.geometry?.coordinates) {
        points = route0.geometry.coordinates.map(([lon, lat]) => ({ lat, lng: lon }));
      }

      const distanceKm = ((route0.summary?.distance ?? 0) as number) / 1000;
      const durationMin = ((route0.summary?.duration ?? 0) as number) / 60;

      return {
        summary: { distanceKm, durationMin },
        geometry: { points },
      };
    }

    throw new Error(
      `ORS directions: unexpected response shape (keys: ${Object.keys(data as any).join(', ')})`
    );
  }
}

function decodePolyline(str: string): LatLng[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLng[] = [];

  const shiftAndMask = () => {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };

  while (index < str.length) {
    lat += shiftAndMask();
    lng += shiftAndMask();
    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return coordinates;
}
