// src/domain/ports/routing.ts
import type { LatLng, PlaceSuggestion, RouteResult, TravelProfile } from '../../types/route';

export interface DirectionsParams {
  profile: TravelProfile;
  from: LatLng;
  to: LatLng;
}

export interface RoutingService {
  geocodeSearch(query: string): Promise<PlaceSuggestion[]>;
  getDirections(params: DirectionsParams): Promise<RouteResult>;
}
