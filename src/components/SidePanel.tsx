// src/components/SidePanel.tsx
import { useEffect, useState } from 'react';
import type { Place, SavedRoute, Preferences, FuelType } from '../types/domain';
import { addPlace, listPlaces, removePlace } from '../services/repos/placesRepo';
import { addRoute, listRoutes, removeRoute } from '../services/repos/routesRepo';
import { getPreferences, setPreferences, updatePreferences } from '../services/repos/preferencesRepo';

interface Props {
  // datos actuales del mapa para poder guardar
  currentOrigin?: { label: string; position: { lat: number; lng: number } } | null;
  currentDestination?: { label: string; position: { lat: number; lng: number } } | null;
  currentRoute?: { distanceKm: number; durationMin: number; profile: 'driving-car' | 'cycling-regular' | 'foot-walking' } | null;
  onApplyPreferences?: (p: Preferences) => void; // para aplicar defaultProfile/fuelType al estado de la app
}

export default function SidePanel({ currentOrigin, currentDestination, currentRoute, onApplyPreferences }: Props) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  // cargar listas
  useEffect(() => {
    (async () => {
      const [pl, rt, pr] = await Promise.all([listPlaces(), listRoutes(), getPreferences()]);
      setPlaces(pl);
      setRoutes(rt);
      setPrefs(pr);
    })();
  }, []);

  const saveCurrentOrigin = async () => {
    if (!currentOrigin) return;
    const p = await addPlace({ label: currentOrigin.label, position: currentOrigin.position });
    setPlaces(prev => [p, ...prev]);
  };

  const saveCurrentDestination = async () => {
    if (!currentDestination) return;
    const p = await addPlace({ label: currentDestination.label, position: currentDestination.position });
    setPlaces(prev => [p, ...prev]);
  };

  const saveCurrentRoute = async () => {
    if (!currentOrigin || !currentDestination || !currentRoute) return;
    const r = await addRoute({
      origin: currentOrigin,
      destination: currentDestination,
      distanceKm: currentRoute.distanceKm,
      durationMin: currentRoute.durationMin,
      profile: currentRoute.profile,
    });
    setRoutes(prev => [r, ...prev]);
  };

  const removePlaceItem = async (id: string) => {
    await removePlace(id);
    setPlaces(prev => prev.filter(p => p.id !== id));
  };

  const removeRouteItem = async (id: string) => {
    await removeRoute(id);
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  const setDefaultProfile = async (profile: Preferences['defaultProfile']) => {
    const newPrefs: Preferences = {
      id: 'default',
      defaultProfile: profile,
      defaultFuelType: prefs?.defaultFuelType ?? 'gasoline95',
    };
    await setPreferences(newPrefs);
    setPrefs(newPrefs);
    onApplyPreferences?.(newPrefs);
  };

  const setDefaultFuelType = async (fuelType: FuelType) => {
    const next: Preferences = {
      id: 'default',
      defaultProfile: prefs?.defaultProfile ?? 'driving-car',
      defaultFuelType: fuelType,
    };
    if (prefs) await updatePreferences({ defaultFuelType: fuelType });
    else await setPreferences(next);
    setPrefs(next);
    onApplyPreferences?.(next);
  };

  return (
    <div className="bg-white/95 backdrop-blur shadow-xl rounded-2xl p-3 space-y-3 w-[320px]">
      <div className="text-lg font-semibold">Save & Lists</div>

      <div className="space-y-2">
        <div className="font-medium text-sm">Quick save</div>
        <div className="flex gap-2">
          <button className="px-3 py-1 rounded-lg bg-gray-900 text-white disabled:opacity-40"
                  onClick={saveCurrentOrigin} disabled={!currentOrigin}>Save A</button>
          <button className="px-3 py-1 rounded-lg bg-gray-900 text-white disabled:opacity-40"
                  onClick={saveCurrentDestination} disabled={!currentDestination}>Save B</button>
          <button className="px-3 py-1 rounded-lg bg-gray-900 text-white disabled:opacity-40"
                  onClick={saveCurrentRoute} disabled={!currentRoute}>Save Route</button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-medium text-sm">Preferences</div>
        <div className="flex items-center gap-2 text-sm">
          <label>Default mode:</label>
          <select
            className="border rounded px-2 py-1"
            value={prefs?.defaultProfile ?? 'driving-car'}
            onChange={(e) => setDefaultProfile(e.target.value as any)}
          >
            <option value="driving-car">Car</option>
            <option value="cycling-regular">Bike</option>
            <option value="foot-walking">Foot</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label>Fuel type:</label>
          <select
            className="border rounded px-2 py-1"
            value={prefs?.defaultFuelType ?? 'gasoline95'}
            onChange={(e) => setDefaultFuelType(e.target.value as any)}
          >
            <option value="gasoline95">Gasoline 95</option>
            <option value="gasoline98">Gasoline 98</option>
            <option value="diesel">Diesel</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-medium text-sm">Favorite places</div>
        <ul className="max-h-40 overflow-auto divide-y">
          {places.map(p => (
            <li key={p.id} className="py-1 flex items-center justify-between text-sm">
              <span className="truncate">{p.label}</span>
              <button className="text-red-600" onClick={() => removePlaceItem(p.id)}>Remove</button>
            </li>
          ))}
          {places.length === 0 && <div className="text-xs text-gray-500 py-1">No places saved.</div>}
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-medium text-sm">Saved routes</div>
        <ul className="max-h-40 overflow-auto divide-y">
          {routes.map(r => (
            <li key={r.id} className="py-1 text-sm">
              <div className="truncate"><b>{r.origin.label}</b> → <b>{r.destination.label}</b></div>
              <div className="text-gray-600 text-xs">{r.profile} · {r.distanceKm.toFixed(1)} km · {Math.round(r.durationMin)} min</div>
              <div className="text-right"><button className="text-red-600" onClick={() => removeRouteItem(r.id)}>Remove</button></div>
            </li>
          ))}
          {routes.length === 0 && <div className="text-xs text-gray-500 py-1">No routes saved.</div>}
        </ul>
      </div>
    </div>
  );
}
