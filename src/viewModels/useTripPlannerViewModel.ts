import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PlaceSuggestion, RouteResult, TravelProfile } from '../types/route';
import type { FuelType, Vehicle } from '../types/domain';
import { getTripPlannerFacade } from '../services/serviceRegistry';
import { listVehicles, addVehicle, removeVehicle } from '../services/repos/vehiclesRepo';
import { getPreferences } from '../services/repos/preferencesRepo';

export function useTripPlannerViewModel() {
  // View state
  const [origin, setOrigin] = useState<PlaceSuggestion | null>(null);
  const [destination, setDestination] = useState<PlaceSuggestion | null>(null);
  const [profile, setProfile] = useState<TravelProfile>('driving-car');

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [costText, setCostText] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inputs for planning
  const [fuelType, setFuelType] = useState<FuelType>('gasoline95');

  const defaultConsumption: Record<FuelType, number> = useMemo(
    () => ({
      gasoline95: 6.5,
      gasoline98: 7.0,
      diesel: 5.5,
    }),
    []
  );

  // Vehicles
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  }, [vehicles, selectedVehicleId]);

  const canRoute = useMemo(() => !!origin && !!destination, [origin, destination]);

  // Load initial data: prefs + vehicles
  useEffect(() => {
    (async () => {
      try {
        const [prefs, vs] = await Promise.all([getPreferences(), listVehicles()]);
        if (prefs) {
          setProfile(prefs.defaultProfile);
          setFuelType(prefs.defaultFuelType);
        }
        setVehicles(vs);
      } catch {
        // keep app usable even if something fails
      }
    })();
  }, []);

  // Commands
  const selectOrigin = useCallback((p: PlaceSuggestion) => {
    setOrigin(p);
    setRoute(null);
    setCostText(null);
    setError(null);
  }, []);

  const selectDestination = useCallback((p: PlaceSuggestion) => {
    setDestination(p);
    setRoute(null);
    setCostText(null);
    setError(null);
  }, []);

  const changeProfile = useCallback((p: TravelProfile) => {
    setProfile(p);
    setRoute(null);
    setCostText(null);
    setError(null);
  }, []);

  const resetTrip = useCallback(() => {
    setOrigin(null);
    setDestination(null);
    setRoute(null);
    setCostText(null);
    setError(null);
    setLoading(false);
  }, []);

  const changeVehicle = useCallback(
    (id: string | null) => {
      setSelectedVehicleId(id);
      if (!id) return;
      const v = vehicles.find((x) => x.id === id);
      if (v) setFuelType(v.fuelType);
    },
    [vehicles]
  );

  const addNewVehicle = useCallback(async (v: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const created = await addVehicle(v);
    setVehicles((prev) => [created, ...prev]);
  }, []);

  const removeExistingVehicle = useCallback(async (id: string) => {
    await removeVehicle(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setSelectedVehicleId((prev) => (prev === id ? null : prev));
  }, []);

  const planTrip = useCallback(async () => {
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

  // Expose ViewModel API
  return {
    // state
    origin,
    destination,
    profile,
    route,
    costText,
    loading,
    error,
    canRoute,

    fuelType,
    vehicles,
    selectedVehicleId,

    // commands
    selectOrigin,
    selectDestination,
    changeProfile,
    setFuelType,
    changeVehicle,
    planTrip,
    addNewVehicle,
    removeExistingVehicle,
    resetTrip,

    // helper
    selectedVehicle,
  };
}
