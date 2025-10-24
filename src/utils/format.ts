export function formatKm(km: number, digits = 1) {
  return `${km.toFixed(digits)} km`;
}

export function formatDuration(min: number) {
  const total = Math.round(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}