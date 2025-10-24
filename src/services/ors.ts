export type PlaceSuggestion = {
  id: string;
  label: string;
  coord: { lat: number; lon: number };
};

const ORS_BASE = "https://api.openrouteservice.org";

export async function geocodeSearch(
  text: string,
  size = 5,
  page = 1
): Promise<PlaceSuggestion[]> {
  if (!text.trim()) return [];
  const apiKey = import.meta.env.VITE_ORS_API_KEY as string;
  const params = new URLSearchParams({
    api_key: apiKey,
    text,
    size: String(size),
    page: String(page),
  });
  const url = `${ORS_BASE}/geocode/search?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`ORS geocoding error: ${res.status} ${msg}`);
  }
  const data = await res.json();
  const feats: any[] = data?.features ?? [];
  return feats.map((f) => ({
    id: f.properties?.id ?? crypto.randomUUID(),
    label: f.properties?.label ?? f.properties?.name ?? "Unknown",
    coord: { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] },
  }));
}
