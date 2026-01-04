import type { RoutingService } from '../domain/ports/routing';
import { OpenRouteServiceAdapter } from './adapters/OpenRouteServiceAdapter';

let routingService: RoutingService = new OpenRouteServiceAdapter();

export function setRoutingService(next: RoutingService) {
  routingService = next;
}

export function getRoutingService(): RoutingService {
  return routingService;
}
