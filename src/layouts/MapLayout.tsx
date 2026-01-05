// src/layouts/MapLayout.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from '../components/MapView';
import RoutePanel from '../components/RoutePanel';
import SearchBar from '../components/SearchBar';
import SidePanel from '../components/SidePanel';
import type { PlaceSuggestion, RouteResult, TravelProfile } from '../types/route';
import { getPreferences } from '../services/repos/preferencesRepo';
import { getTripPlannerFacade } from '../services/serviceRegistry';
import type { Vehicle, FuelType } from '../types/domain';
import { listVehicles, addVehicle, removeVehicle } from '../services/repos/vehiclesRepo';

export default function MapLayout() {
  const [origin, setOrigin] = useState<PlaceSuggestion | null>(null);
  const [destination, setDestination] = useState<PlaceSuggestion | null>(null);
  const [profile, setProfile] = useState<TravelProfile>('driving-car');
  const [route, setRoute] = useState<RouteResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fuelType, setFuelType] = useState<FuelType>('gasoline95');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  }, [selectedVehicleId, vehicles]);

  const [costText, setCostText] = useState<string | null>(null);

  const defaultConsumption: Record<FuelType, number> = useMemo(
    () => ({
      gasoline95: 6.5,
      gasoline98: 7.0,
      diesel: 5.5,
    }),
    []
  );

  // load preferences
  useEffect(() => {
    (async () => {
      const p = await getPreferences();
      if (p) {
        setProfile(p.defaultProfile);
        setFuelType(p.defaultFuelType);
      }
      try {
        const vs = await listVehicles();
        setVehicles(vs);
      } catch {
        setVehicles([]);
      }
    })();
  }, []);

  const canRoute = useMemo(() => !!origin && !!destination, [origin, destination]);

  const handleSelectOrigin = useCallback((place: PlaceSuggestion) => {
    setOrigin(place);
    setRoute(null);
    setCostText(null);
    setError(null);
  }, []);

  const handleSelectDestination = useCallback((place: PlaceSuggestion) => {
    setDestination(place);
    setRoute(null);
    setCostText(null);
    setError(null);
  }, []);

  const handleVehicleChange = useCallback((id: string | null) => {
    setSelectedVehicleId(id);
    if (!id) return;

    const v = vehicles.find(x => x.id === id);
    if (v) setFuelType(v.fuelType);
  }, [vehicles]);

  const handleAddVehicle = useCallback(async (v: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const created = await addVehicle(v);
    setVehicles(prev => [created, ...prev]);
  }, []);

  const handleRemoveVehicle = useCallback(async (id: string) => {
    await removeVehicle(id);
    setVehicles(prev => prev.filter(v => v.id !== id));
    setSelectedVehicleId(prev => (prev === id ? null : prev));
  }, []);

  const fetchRoute = useCallback(async () => {
    if (!origin || !destination) return;

    try {
      setLoading(true);
      setError(null);

      const facade = getTripPlannerFacade();
      const result = await facade.planTrip({
        origin,
        destination,
        profile,
        vehicle: selectedVehicle,
        fuelType,
        defaultConsumption,
      });

      setRoute(result.route);
      setCostText(result.costText);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to fetch route');
      setRoute(null);
      setCostText(null);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, profile, selectedVehicle, fuelType, defaultConsumption]);

  const handleProfileChange = useCallback(
    (p: TravelProfile) => {
      setProfile(p);
      setRoute(null);
      setCostText(null);
      setError(null);
    },
    []
  );

  return (
    <div className="w-full h-full relative">
      <SearchBar
        onSelectA={handleSelectOrigin}
        onSelectB={handleSelectDestination}
        originLabel={origin?.label}
        destinationLabel={destination?.label}
      />

      {/* Right side: route panel */}
      <div className="absolute top-4 right-4 max-w-sm w-[340px] space-y-2">
        {profile === 'driving-car' && (
          <div className="bg-white/90 rounded-2xl shadow p-2 text-sm flex gap-2 items-center">
            <label>Fuel type:</label>
            <select
              className="border rounded px-2 py-1"
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value as FuelType)}
            >
              <option value="gasoline95">Gasoline 95</option>
              <option value="gasoline98">Gasoline 98</option>
              <option value="diesel">Diesel</option>
            </select>
          </div>
        )}

        <RoutePanel
          profile={profile}
          onProfileChange={handleProfileChange}
          canRoute={canRoute}
          loading={loading}
          error={error}
          onRouteClick={fetchRoute}
          originLabel={origin?.label ?? ''}
          destinationLabel={destination?.label ?? ''}
          summary={route?.summary ?? null}
          costText={costText}

          vehicles={vehicles}
          selectedVehicleId={selectedVehicleId}
          onVehicleChange={handleVehicleChange}
          fuelType={fuelType}
          onFuelTypeChange={setFuelType}
        />
      </div>

      {/* Left side: persistence side panel */}
      <div className="absolute top-4 left-4">
        <SidePanel
          currentOrigin={origin ? { label: origin.label, position: origin.position } : null}
          currentDestination={destination ? { label: destination.label, position: destination.position } : null}
          currentRoute={
            route
              ? { distanceKm: route.summary.distanceKm, durationMin: route.summary.durationMin, profile }
              : null
          }
          onApplyPreferences={(p) => {
            setProfile(p.defaultProfile);
            setFuelType(p.defaultFuelType);
          }}
          vehicles={vehicles}
          onAddVehicle={handleAddVehicle}
          onRemoveVehicle={handleRemoveVehicle}
        />
      </div>

      <MapView origin={origin?.position ?? null} destination={destination?.position ?? null} route={route} />
    </div>
  );
}
