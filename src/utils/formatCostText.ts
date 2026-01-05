import type { TravelProfile } from '../types/route';
import type { CostResult } from '../domain/cost/CostStrategy';

// UI formatting for cost/energy
export function formatCostText(profile: TravelProfile, cost: CostResult | null): string | null {
  if (!cost) return profile === 'driving-car' ? 'Fuel price unavailable.' : null;

  if (cost.kind === 'fuel') {
    const suffix = cost.source === 'default' ? ' (estimate)' : '';
    return `Fuel: ~€${cost.euros.toFixed(2)} (≈ ${cost.liters.toFixed(2)} L @ €${cost.euroPerLiter.toFixed(2)}/L)${suffix}`;
  }

  return `Energy: ~${cost.kcal} kcal`;
}
