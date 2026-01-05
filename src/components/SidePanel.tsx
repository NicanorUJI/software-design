// src/components/SidePanel.tsx
import { useEffect, useMemo, useState } from 'react';
import type { Place, SavedRoute, Preferences, FuelType, Vehicle } from '../types/domain';
import { addPlace, listPlaces, removePlace } from '../services/repos/placesRepo';
import { addRoute, listRoutes, removeRoute } from '../services/repos/routesRepo';
import { getPreferences, setPreferences, updatePreferences } from '../services/repos/preferencesRepo';

interface Props {
  currentOrigin?: { label: string; position: { lat: number; lng: number } } | null;
  currentDestination?: { label: string; position: { lat: number; lng: number } } | null;
  currentRoute?: {
    distanceKm: number;
    durationMin: number;
    profile: 'driving-car' | 'cycling-regular' | 'foot-walking';
  } | null;

  onApplyPreferences?: (p: Preferences) => void;

  vehicles?: Vehicle[];
  onAddVehicle?: (v: Omit<Vehicle, 'id' | 'createdAt'>) => Promise<void>;
  onRemoveVehicle?: (id: string) => Promise<void>;
}


export default function SidePanel({
  currentOrigin,
  currentDestination,
  currentRoute,
  onApplyPreferences,
  vehicles,
  onAddVehicle,
  onRemoveVehicle,
}: Props) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  // Vehicles form state
  const [vehName, setVehName] = useState('');
  const [vehLitersPer100, setVehLitersPer100] = useState('6.5');
  const [vehFuelType, setVehFuelType] = useState<FuelType>('gasoline95');
  const vehLitersParsed = useMemo(() => Number(vehLitersPer100), [vehLitersPer100]);

  useEffect(() => {
    (async () => {
      try {
        const [p, r, pr] = await Promise.all([listPlaces(), listRoutes(), getPreferences()]);
        setPlaces(p);
        setRoutes(r);
        setPrefs(pr);
        if (pr) {
          setVehFuelType(pr.defaultFuelType);
        }
      } catch {
        // no-op (keeps UI usable even if one list fails)
      }
    })();
  }, []);

  const saveCurrentOrigin = async () => {
    if (!currentOrigin) return;
    const p = await addPlace({ label: currentOrigin.label, position: currentOrigin.position });
    setPlaces((prev) => [p, ...prev]);
  };

  const saveCurrentDestination = async () => {
    if (!currentDestination) return;
    const p = await addPlace({ label: currentDestination.label, position: currentDestination.position });
    setPlaces((prev) => [p, ...prev]);
  };

  const saveCurrentRoute = async () => {
    if (!currentOrigin || !currentDestination || !currentRoute) return;

    const r = await addRoute({
      origin: { label: currentOrigin.label, position: currentOrigin.position },
      destination: { label: currentDestination.label, position: currentDestination.position },
      profile: currentRoute.profile,
      routeType: 'fastest',
      distanceKm: currentRoute.distanceKm,
      durationMin: currentRoute.durationMin,
    });
    setRoutes((prev) => [r, ...prev]);
  };

  const removePlaceItem = async (id: string) => {
    await removePlace(id);
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  const removeRouteItem = async (id: string) => {
    await removeRoute(id);
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  const setDefaultProfile = async (profile: Preferences['defaultProfile']) => {
    const next: Preferences = {
      id: 'default',
      defaultProfile: profile,
      defaultFuelType: prefs?.defaultFuelType ?? 'gasoline95',
    };
    if (prefs) await updatePreferences({ defaultProfile: profile });
    else await setPreferences(next);
    setPrefs(next);
    onApplyPreferences?.(next);
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
    setVehFuelType(fuelType);
  };

  const handleAddVehicle = async () => {
    const name = vehName.trim();
    if (!name) return;
    if (!Number.isFinite(vehLitersParsed) || vehLitersParsed <= 0) return;
    if (!onAddVehicle) return;

    await onAddVehicle({
      name,
      fuelType: vehFuelType,
      litersPer100: vehLitersParsed,
    });

    setVehName('');
    setVehLitersPer100('6.5');
  };

  return (
    <div className="bg-white/95 backdrop-blur shadow-xl rounded-2xl p-3 space-y-3 w-[320px]">
      <div className="text-lg font-semibold">Save & Lists</div>

      <div className="space-y-2">
        <div className="font-medium text-sm">Quick save</div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded-lg bg-gray-900 text-white disabled:opacity-40"
            onClick={saveCurrentOrigin}
            disabled={!currentOrigin}
          >
            Save A
          </button>
          <button
            className="px-3 py-1 rounded-lg bg-gray-900 text-white disabled:opacity-40"
            onClick={saveCurrentDestination}
            disabled={!currentDestination}
          >
            Save B
          </button>
          <button
            className="px-3 py-1 rounded-lg bg-gray-900 text-white disabled:opacity-40"
            onClick={saveCurrentRoute}
            disabled={!currentRoute}
          >
            Save Route
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-2">
        <div className="font-medium text-sm">Preferences</div>

        <div className="flex items-center gap-2 text-sm">
          <label className="w-28 text-gray-700">Default mode:</label>
          <select
            className="border rounded-md px-2 py-1 flex-1"
            value={prefs?.defaultProfile ?? 'driving-car'}
            onChange={(e) => setDefaultProfile(e.target.value as Preferences['defaultProfile'])}
          >
            <option value="driving-car">Car</option>
            <option value="cycling-regular">Bike</option>
            <option value="foot-walking">Foot</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label className="w-28 text-gray-700">Fuel type:</label>
          <select
            className="border rounded-md px-2 py-1 flex-1"
            value={prefs?.defaultFuelType ?? 'gasoline95'}
            onChange={(e) => setDefaultFuelType(e.target.value as FuelType)}
          >
            <option value="gasoline95">Gasoline 95</option>
            <option value="gasoline98">Gasoline 98</option>
            <option value="diesel">Diesel</option>
          </select>
        </div>
      </div>

      {/* NEW: Vehicles */}
      <div className="space-y-2">
        <div className="font-medium text-sm">My vehicles</div>

        <div className="grid grid-cols-3 gap-2 text-sm">
          <input
            className="border rounded-md px-2 py-1 col-span-2"
            placeholder="Name (e.g., Golf)"
            value={vehName}
            onChange={(e) => setVehName(e.target.value)}
          />
          <select
            className="border rounded-md px-2 py-1"
            value={vehFuelType}
            onChange={(e) => setVehFuelType(e.target.value as FuelType)}
          >
            <option value="gasoline95">95</option>
            <option value="gasoline98">98</option>
            <option value="diesel">Diesel</option>
          </select>

          <input
            className="border rounded-md px-2 py-1 col-span-2"
            placeholder="L/100km (e.g., 6.5)"
            value={vehLitersPer100}
            onChange={(e) => setVehLitersPer100(e.target.value)}
            inputMode="decimal"
          />
          <button
            className="px-3 py-1 rounded-lg bg-gray-900 text-white disabled:opacity-40"
            onClick={handleAddVehicle}
            disabled={!vehName.trim() || !Number.isFinite(vehLitersParsed) || vehLitersParsed <= 0 || !onAddVehicle}
          >
            Add
          </button>
        </div>

        <ul className="max-h-40 overflow-auto divide-y">
          {vehicles?.map((v) => (
            <li key={v.id} className="py-1 text-sm flex items-center justify-between gap-2">
              <div className="truncate">
                <b>{v.name}</b> — {v.fuelType}, {v.litersPer100} L/100km
              </div>
              <button className="text-red-600" onClick={() => onRemoveVehicle?.(v.id)}>
                Remove
              </button>
            </li>
          ))}
          {(vehicles?.length ?? 0) === 0 && <div className="text-xs text-gray-500 py-1">No vehicles saved.</div>}
        </ul>
      </div>

      {/* Favorite places */}
      <div className="space-y-2">
        <div className="font-medium text-sm">Favorite places</div>
        <ul className="max-h-32 overflow-auto divide-y">
          {places.map((p) => (
            <li key={p.id} className="py-1 text-sm flex items-center justify-between gap-2">
              <div className="truncate">{p.label}</div>
              <button className="text-red-600" onClick={() => removePlaceItem(p.id)}>
                Remove
              </button>
            </li>
          ))}
          {places.length === 0 && <div className="text-xs text-gray-500 py-1">No favorite places yet.</div>}
        </ul>
      </div>

      {/* Saved routes */}
      <div className="space-y-2">
        <div className="font-medium text-sm">Saved routes</div>
        <ul className="max-h-40 overflow-auto divide-y">
          {routes.map((r) => (
            <li key={r.id} className="py-1 text-sm">
              <div className="truncate">
                <b>{r.origin.label}</b> → <b>{r.destination.label}</b>
              </div>
              <div className="text-gray-600 text-xs">
                {r.profile} · {r.distanceKm.toFixed(1)} km · {Math.round(r.durationMin)} min
              </div>
              <div className="text-right">
                <button className="text-red-600" onClick={() => removeRouteItem(r.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
          {routes.length === 0 && <div className="text-xs text-gray-500 py-1">No routes saved.</div>}
        </ul>
      </div>
    </div>
  );
}
