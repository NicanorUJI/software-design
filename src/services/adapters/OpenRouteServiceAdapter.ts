import type { RoutingService, DirectionsParams } from '../../domain/ports/routing';
import type { PlaceSuggestion, RouteResult } from '../../types/route';

// Reutiliza tu cliente actual de ORS
import { geocodeSearch, getDirections } from '../ors';

export class OpenRouteServiceAdapter implements RoutingService {
  geocodeSearch(query: string): Promise<PlaceSuggestion[]> {
    return geocodeSearch(query);
  }

  getDirections(params: DirectionsParams): Promise<RouteResult> {
    return getDirections(params);
  }
}
