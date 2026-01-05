// src/infra/serviceRegistry.ts
import type { RoutingService } from '../domain/ports/routing';
import type { FuelPricingService } from '../domain/ports/fuelPricing';

import { OpenRouteServiceAdapter } from './adapters/OpenRouteServiceAdapter';
import { SpainFuelPricingAdapter } from './adapters/SpainFuelPricingAdapter';

import { TripCostCalculator } from '../domain/cost/TripCostCalculator';
import { CarCostStrategy } from '../domain/cost/CarCostStrategy';
import { BikeCostStrategy } from '../domain/cost/BikeCostStrategy';
import { WalkCostStrategy } from '../domain/cost/WalkCostStrategy';

import { TripPlannerFacade } from '../domain/facades/TripPlannerFacade';

let routingService: RoutingService = new OpenRouteServiceAdapter();
let fuelPricingService: FuelPricingService = new SpainFuelPricingAdapter();

const costCalculator = new TripCostCalculator([
  new CarCostStrategy(),
  new BikeCostStrategy(),
  new WalkCostStrategy(),
]);

let tripPlannerFacade: TripPlannerFacade | null = null;

function rebuildFacade() {
  tripPlannerFacade = new TripPlannerFacade(routingService, fuelPricingService, costCalculator);
}

// setters
export function setRoutingService(next: RoutingService) {
  routingService = next;
  tripPlannerFacade = null;
}
export function getRoutingService(): RoutingService {
  return routingService;
}

export function setFuelPricingService(next: FuelPricingService) {
  fuelPricingService = next;
  tripPlannerFacade = null;
}
export function getFuelPricingService(): FuelPricingService {
  return fuelPricingService;
}

export function getTripPlannerFacade(): TripPlannerFacade {
  if (!tripPlannerFacade) rebuildFacade();
  return tripPlannerFacade!;
}
