// src/services/fuel.ts
// Fetches average fuel price in Spain.

export type FuelType = 'gasoline95' | 'gasoline98' | 'diesel';

function pickField(type: FuelType): string {
  switch (type) {
    case 'gasoline95': return 'Precio Gasolina 95 E5';
    case 'gasoline98': return 'Precio Gasolina 98 E5';
    case 'diesel':     return 'Precio Gasoleo A';
    default:           return 'Precio Gasolina 95 E5';
  }
}

export async function getEuroPerLiter(type: FuelType): Promise<number> {
  const ES_API = 'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';
  const res = await fetch(ES_API);
  if (!res.ok) throw new Error(`Fuel ES API failed: ${res.status}`);
  const data = await res.json();
  const items: any[] = data?.ListaEESSPrecio ?? [];
  const field = pickField(type);

  let sum = 0, count = 0;
  for (const it of items) {
    const raw = it[field];
    if (!raw) continue;
    const v = parseFloat(String(raw).replace(',', '.'));
    if (!isNaN(v) && v > 0.5 && v < 5) { sum += v; count++; }
  }
  if (count === 0) throw new Error('No valid fuel prices');
  return sum / count;
}
