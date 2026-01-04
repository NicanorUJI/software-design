// src/services/adapters/OrsRoutingAdapter.ts
import type { RoutingService, DirectionsParams } from '../../domain/ports/routing';
import type { PlaceSuggestion, RouteResult } from '../../types/route';

// Reutilizamos lo que ya tienes en src/services/ors.ts
import { geocodeSearch as orsGeocodeSearch, getDirections as orsGetDirections } from '../ors';

export class OrsRoutingAdapter implements RoutingService {
  geocodeSearch(query: string): Promise<PlaceSuggestion[]> {
    return orsGeocodeSearch(query);
  }

  getDirections(params: DirectionsParams): Promise<RouteResult> {
    return orsGetDirections(params);
  }
}
