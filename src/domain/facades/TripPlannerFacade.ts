// src/domain/facades/TripPlannerFacade.ts
import type { PlaceSuggestion, RouteResult, TravelProfile } from '../../types/route';
import type { FuelType, Vehicle } from '../../types/domain';
import type { RoutingService } from '../ports/routing';
import type { FuelPricingService } from '../ports/fuelPricing';
import type { CostResult } from '../cost/CostStrategy';
import { TripCostCalculator } from '../cost/TripCostCalculator';

export type PlanTripRequest = {
  origin: PlaceSuggestion;
  destination: PlaceSuggestion;
  profile: TravelProfile;

  vehicle?: Vehicle | null;

  fuelType?: FuelType;
  defaultConsumption: Record<FuelType, number>;
};

export type PlanTripResult = {
  route: RouteResult;
  cost: CostResult | null;
  costText: string | null;
  euroPerLiter: number | null;
};

export type EstimateCostRequest = {
  profile: TravelProfile;
  distanceKm: number;

  vehicle?: Vehicle | null;

  fuelType?: FuelType;
  defaultConsumption: Record<FuelType, number>;
};

export type EstimateCostResult = {
  cost: CostResult | null;
  costText: string | null;
  euroPerLiter: number | null;
};

type FuelCacheEntry = { value: number; ts: number };

export class TripPlannerFacade {
  private fuelCache = new Map<FuelType, FuelCacheEntry>();
  private readonly fuelTtlMs = 30 * 60 * 1000; // 30min
  private routing: RoutingService;
  private fuelPricing: FuelPricingService;
  private costCalculator: TripCostCalculator;

  constructor(routing: RoutingService, fuelPricing: FuelPricingService, costCalculator: TripCostCalculator) {
    this.routing = routing;
    this.fuelPricing = fuelPricing;
    this.costCalculator = costCalculator;
  }

  /**
   * Full flow: route + fuel price (if needed) + cost.
   */
  async planTrip(req: PlanTripRequest): Promise<PlanTripResult> {
    // 1) Route
    const route = await this.routing.getDirections({
      profile: req.profile,
      from: req.origin.position,
      to: req.destination.position,
    });

    // 2) Cost
    const costRes = await this.estimateCost({
      profile: req.profile,
      distanceKm: route.summary.distanceKm,
      vehicle: req.vehicle ?? null,
      fuelType: req.fuelType,
      defaultConsumption: req.defaultConsumption,
    });

    return {
      route,
      cost: costRes.cost,
      costText: costRes.costText,
      euroPerLiter: costRes.euroPerLiter,
    };
  }

  async estimateCost(req: EstimateCostRequest): Promise<EstimateCostResult> {
    const { effectiveFuelType, effectiveLitersPer100 } = this.resolveFuelInputs(req);

    // Fuel price (only for car)
    let euroPerLiter: number | null = null;
    if (req.profile === 'driving-car') {
      euroPerLiter = await this.getFuelPriceCached(effectiveFuelType);
    }

    // Cost (Strategy)
    const cost = await this.costCalculator.calculate(req.profile, {
      distanceKm: req.distanceKm,
      vehicle: req.vehicle ?? null,
      fallbackFuelType: effectiveFuelType,
      fallbackLitersPer100: effectiveLitersPer100,
      euroPerLiter,
    });

    // UI-friendly text
    const costText = this.formatCostText(req.profile, cost);

    return { cost, costText, euroPerLiter };
  }

  private resolveFuelInputs(req: { vehicle?: Vehicle | null; fuelType?: FuelType; defaultConsumption: Record<FuelType, number> }) {
    // Resolve fuel inputs (vehicle wins, else fallback, else default)
    const effectiveFuelType: FuelType = req.vehicle?.fuelType ?? req.fuelType ?? 'gasoline95';

    const effectiveLitersPer100 =
      req.vehicle?.litersPer100 ?? req.defaultConsumption[effectiveFuelType];

    return { effectiveFuelType, effectiveLitersPer100 };
  }

  private async getFuelPriceCached(type: FuelType): Promise<number | null> {
    const now = Date.now();
    const cached = this.fuelCache.get(type);
    if (cached && now - cached.ts < this.fuelTtlMs) return cached.value;

    try {
      const v = await this.fuelPricing.getEuroPerLiter(type);
      this.fuelCache.set(type, { value: v, ts: now });
      return v;
    } catch {
      return null;
    }
  }

  private formatCostText(profile: TravelProfile, cost: CostResult | null): string | null {
    if (!cost) return profile === 'driving-car' ? 'Fuel price unavailable.' : null;

    if (cost.kind === 'fuel') {
      const suffix = cost.source === 'default' ? ' (estimate)' : '';
      return `Fuel: ~€${cost.euros.toFixed(2)} (≈ ${cost.liters.toFixed(2)} L @ €${cost.euroPerLiter.toFixed(2)}/L)${suffix}`;
    }

    return `Energy: ~${cost.kcal} kcal`;
  }
}
