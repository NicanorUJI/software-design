import type { TravelProfile } from '../../types/route';
import { calculateCalories } from '../../utils/cost';
import type { CostInput, CostResult, CostStrategy } from './CostStrategy';

export class WalkCostStrategy implements CostStrategy {
  supports(profile: TravelProfile): boolean {
    return profile === 'foot-walking';
  }

  async calculate(input: CostInput): Promise<CostResult | null> {
    if (input.profile !== 'foot-walking') return null;
    const kcal = calculateCalories(input.distanceKm, 'walking');
    return { kind: 'energy', kcal, mode: 'walking' };
  }
}
