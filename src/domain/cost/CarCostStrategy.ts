import type { TravelProfile } from '../../types/route';
import { calculateFuelCost } from '../../utils/cost';
import type { CostInput, CostResult, CostStrategy } from './CostStrategy';

export class CarCostStrategy implements CostStrategy {
  supports(profile: TravelProfile): boolean {
    return profile === 'driving-car';
  }

  async calculate(input: CostInput): Promise<CostResult | null> {
    if (input.profile !== 'driving-car') return null;

    const euroPerLiter = input.euroPerLiter;
    if (euroPerLiter == null) return null;

    const distanceKm = input.distanceKm;

    // Prefer the selected vehicle, fallback to defaults
    const litersPer100 =
      input.vehicle?.litersPer100 ?? input.fallbackLitersPer100 ?? null;

    const fuelType =
      input.vehicle?.fuelType ?? input.fallbackFuelType ?? null;

    if (litersPer100 == null || fuelType == null) return null;

    const source = input.vehicle ? 'vehicle' : 'default';

    const { liters, euros } = calculateFuelCost(distanceKm, litersPer100, euroPerLiter);

    return {
      kind: 'fuel',
      euros,
      liters,
      euroPerLiter,
      litersPer100,
      fuelType,
      source,
    };
  }
}
