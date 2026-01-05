import type { FuelType } from '../../types/domain';

export interface FuelPricingService {
  getEuroPerLiter(type: FuelType): Promise<number>;
}
