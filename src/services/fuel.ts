export type FuelType = 'gasoline95' | 'gasoline98' | 'diesel';

export type FuelPrices = Record<FuelType, number>;

const ES_API =
  'https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/';

const CACHE_KEY = 'fuelPrices:avg_es:v2';
const CACHE_TTL_MS = 30 * 60 * 1000;

type CacheShape = { ts: number; data: FuelPrices };

function parsePrice(raw: unknown): number | null {
  if (raw == null) return null;
  const v = Number(String(raw).trim().replace(',', '.'));
  if (!Number.isFinite(v)) return null;
  // sanity bounds
  if (v <= 0.5 || v >= 5) return null;
  return v;
}

function mean(sum: number, count: number): number | null {
  if (count === 0) return null;
  return sum / count;
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

function loadCache(): CacheShape | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheShape;
    if (!parsed?.ts || !parsed?.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(data: FuelPrices) {
  const payload: CacheShape = { ts: Date.now(), data };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

function isFresh(ts: number) {
  return Date.now() - ts < CACHE_TTL_MS;
}

export async function getFuelPrices(): Promise<FuelPrices> {
  const cached = loadCache();
  if (cached && isFresh(cached.ts)) return cached.data;

  try {
    const res = await fetch(ES_API);
    if (!res.ok) throw new Error(`Fuel ES API failed: ${res.status}`);
    const data = await res.json();
    const items: any[] = data?.ListaEESSPrecio ?? [];

    const sums: FuelPrices = { gasoline95: 0, gasoline98: 0, diesel: 0 };
    const counts: Record<FuelType, number> = { gasoline95: 0, gasoline98: 0, diesel: 0 };

    const types: FuelType[] = ['gasoline95', 'gasoline98', 'diesel'];

    for (const it of items) {
      for (const t of types) {
        const fields = fieldsFor(t);
        for (const f of fields) {
          const v = parsePrice(it?.[f]);
          if (v != null) {
            sums[t] += v;
            counts[t] += 1;
            break;
          }
        }
      }
    }

    const gasoline95 = mean(sums.gasoline95, counts.gasoline95);
    const gasoline98 = mean(sums.gasoline98, counts.gasoline98);
    const diesel = mean(sums.diesel, counts.diesel);

    if (gasoline95 == null || gasoline98 == null || diesel == null) {
      throw new Error('No valid fuel prices found for one or more fuel types');
    }

    const result: FuelPrices = { gasoline95, gasoline98, diesel };
    saveCache(result);
    return result;
  } catch (e) {
    if (cached?.data) return cached.data;
    throw e;
  }
}

export async function getEuroPerLiter(type: FuelType): Promise<number> {
  const prices = await getFuelPrices();
  return prices[type];
}
