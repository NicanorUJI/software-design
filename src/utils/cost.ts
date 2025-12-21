// src/utils/cost.ts
export function calculateFuelCost(distanceKm: number, litersPer100: number, euroPerLiter: number) {
  const liters = (distanceKm / 100) * litersPer100;
  const euros = liters * euroPerLiter;
  return { liters, euros };
}

const KCAL_PER_KM: Record<'walking' | 'cycling', number> = {
  walking: 55,
  cycling: 30,
};

export function calculateCalories(distanceKm: number, mode: 'walking' | 'cycling') {
  const kcal = distanceKm * (KCAL_PER_KM[mode] ?? 0);
  return Math.round(kcal);
}
