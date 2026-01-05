import type { FuelPricingService } from '../../domain/ports/fuelPricing';
import type { FuelType } from '../../types/domain';
import { getEuroPerLiter } from '../fuel';

export class SpainFuelPricingAdapter implements FuelPricingService {
  getEuroPerLiter(type: FuelType): Promise<number> {
    return getEuroPerLiter(type);
  }
}
