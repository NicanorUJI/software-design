export type FuelType = 'gasoline95' | 'gasoline98' | 'diesel';
export type FuelPrices = Record<FuelType, number>;

const ES_API ='https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';
const TTL_MS = 30 * 60 * 1000;

let cache: { ts: number; data: FuelPrices } | null = null;

function parsePrice(raw: unknown): number | null {
  if (raw == null) return null;
  const v = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(v)) return null;
  if (v <= 0.5 || v >= 5) return null;
  return v;
}

function fieldsFor(type: FuelType): string[] {
  switch (type) {
    case 'gasoline95':
      return ['Precio Gasolina 95 E5', 'Precio Gasolina 95 E10', 'Precio Gasolina 95 E5 Premium'];
    case 'gasoline98':
      return ['Precio Gasolina 98 E5', 'Precio Gasolina 98 E10'];
    case 'diesel':
      return ['Precio Gasoleo A', 'Precio Gasóleo A'];
  }
}

export async function getFuelPrices(): Promise<FuelPrices> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.data;

  const res = await fetch(ES_API);
  if (!res.ok) throw new Error(`Fuel ES API failed: ${res.status}`);
  const json = await res.json();
  const items: any[] = json?.ListaEESSPrecio ?? [];

  const sums: FuelPrices = { gasoline95: 0, gasoline98: 0, diesel: 0 };
  const counts: Record<FuelType, number> = { gasoline95: 0, gasoline98: 0, diesel: 0 };
  const types: FuelType[] = ['gasoline95', 'gasoline98', 'diesel'];

  for (const it of items) {
    for (const t of types) {
      for (const f of fieldsFor(t)) {
        const v = parsePrice(it?.[f]);
        if (v != null) {
          sums[t] += v;
          counts[t] += 1;
          break;
        }
      }
    }
  }

  const gasoline95 = counts.gasoline95 ? sums.gasoline95 / counts.gasoline95 : null;
  const gasoline98 = counts.gasoline98 ? sums.gasoline98 / counts.gasoline98 : null;
  const diesel = counts.diesel ? sums.diesel / counts.diesel : null;

  if (gasoline95 == null || gasoline98 == null || diesel == null) {
    throw new Error('No valid fuel prices found');
  }

  const data: FuelPrices = { gasoline95, gasoline98, diesel };
  cache = { ts: Date.now(), data };
  return data;
}

export async function getEuroPerLiter(type: FuelType): Promise<number> {
  const prices = await getFuelPrices();
  return prices[type];
}
