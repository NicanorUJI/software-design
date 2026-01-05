import type { TravelProfile } from '../../types/route';
import { calculateCalories } from '../../utils/cost';
import type { CostInput, CostResult, CostStrategy } from './CostStrategy';

export class BikeCostStrategy implements CostStrategy {
  supports(profile: TravelProfile): boolean {
    return profile === 'cycling-regular';
  }

  async calculate(input: CostInput): Promise<CostResult | null> {
    if (input.profile !== 'cycling-regular') return null;
    const kcal = calculateCalories(input.distanceKm, 'cycling');
    return { kind: 'energy', kcal, mode: 'cycling' };
  }
}
