import type { TravelProfile } from '../../types/route';
import type { FuelType, Vehicle } from '../../types/domain';

export type FuelCostResult = {
  kind: 'fuel';
  euros: number;
  liters: number;
  euroPerLiter: number;
  litersPer100: number;
  fuelType: FuelType;
  source: 'vehicle' | 'default';
};

export type EnergyCostResult = {
  kind: 'energy';
  kcal: number;
  mode: 'cycling' | 'walking';
};

export type CostResult = FuelCostResult | EnergyCostResult;

export type CostInput = {
  profile: TravelProfile;
  distanceKm: number;

  vehicle?: Vehicle | null;

  fallbackFuelType?: FuelType;
  fallbackLitersPer100?: number;

  euroPerLiter?: number | null;
};

export interface CostStrategy {
  supports(profile: TravelProfile): boolean;
  calculate(input: CostInput): Promise<CostResult | null>;
}
