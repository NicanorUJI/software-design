import type { TravelProfile } from '../../types/route';
import type { CostInput, CostResult, CostStrategy } from './CostStrategy';

export class TripCostCalculator {
  private readonly strategies: CostStrategy[];
  
  constructor(strategies: CostStrategy[]) {
    this.strategies = strategies;
  }

  async calculate(profile: TravelProfile, input: Omit<CostInput, 'profile'>): Promise<CostResult | null> {
    const strategy = this.strategies.find((s) => s.supports(profile));
    if (!strategy) return null;
    return strategy.calculate({ ...input, profile });
  }
}
