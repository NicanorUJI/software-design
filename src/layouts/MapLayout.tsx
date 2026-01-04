// src/layouts/MapLayout.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import RoutePanel from '../components/RoutePanel';
import SidePanel from '../components/SidePanel';

import type { PlaceSuggestion, RouteResult, TravelProfile } from '../types/route';
import type { Vehicle, FuelType } from '../types/domain';

import { getDirections } from '../services/ors';
import { calculateCalories, calculateFuelCost } from '../utils/cost';
import { getEuroPerLiter } from '../services/fuel';

import { addVehicle, listVehicles, removeVehicle } from '../services/repos/vehiclesRepo';

import { TripCostCalculator } from '../domain/cost/TripCostCalculator';
import { BikeCostStrategy } from '../domain/cost/BikeCostStrategy';
import { WalkCostStrategy } from '../domain/cost/WalkCostStrategy';
import { CarCostStrategy } from '../domain/cost/CarCostStrategy';

const costCalculator = new TripCostCalculator([
  new CarCostStrategy(),
  new BikeCostStrategy(),
  new WalkCostStrategy(),
]);

export default function MapLayout() {
  const [origin, setOrigin] = useState<PlaceSuggestion | null>(null);
  const [destination, setDestination] = useState<PlaceSuggestion | null>(null);

  const [profile, setProfile] = useState<TravelProfile>('driving-car');
  const [route, setRoute] = useState<RouteResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fuelType, setFuelType] = useState<FuelType>('gasoline95');
  const [euroPerLiter, setEuroPerLiter] = useState<number | null>(null);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [costText, setCostText] = useState<string | null>(null);

  const defaultConsumption: Record<FuelType, number> = useMemo(
    () => ({
      gasoline95: 6.5,
      gasoline98: 7.0,
      diesel: 5.5,
    }),
    []
  );

  const canRoute = !!origin && !!destination;

  const handleSelectOrigin = useCallback((p: PlaceSuggestion) => {
    setOrigin(p);
    setRoute(null);
    setError(null);
  }, []);

  const handleSelectDestination = useCallback((p: PlaceSuggestion) => {
    setDestination(p);
    setRoute(null);
    setError(null);
  }, []);

  const handleProfileChange = useCallback((p: TravelProfile) => {
    setProfile(p);
    setRoute(null);
    setError(null);
  }, []);

  // Load vehicles once
  useEffect(() => {
    (async () => {
      try {
        const vs = await listVehicles();
        setVehicles(vs);
      } catch {
        setVehicles([]);
      }
    })();
  }, []);

  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehicles.find((v) => v.id === selectedVehicleId) ?? null;
  }, [vehicles, selectedVehicleId]);

  // Vehicle selection: optional UX sync fuelType to vehicle fuelType
  const handleVehicleChange = useCallback(
    (id: string | null) => {
      setSelectedVehicleId(id);
      if (!id) return;
      const v = vehicles.find((x) => x.id === id);
      if (v) setFuelType(v.fuelType);
    },
    [vehicles]
  );

  // Vehicle CRUD used by SidePanel
  const handleAddVehicle = useCallback(async (v: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const created = await addVehicle(v);
    setVehicles((prev) => [created, ...prev]);
  }, []);

  const handleRemoveVehicle = useCallback(async (id: string) => {
    await removeVehicle(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setSelectedVehicleId((prev) => (prev === id ? null : prev));
  }, []);

  // Fuel €/L fetch
  useEffect(() => {
    if (profile !== 'driving-car') return;

    let mounted = true;
    getEuroPerLiter(fuelType)
      .then((v) => {
        if (mounted) setEuroPerLiter(v);
      })
      .catch(() => {
        if (mounted) setEuroPerLiter(null);
      });

    return () => {
      mounted = false;
    };
  }, [fuelType, profile]);

  const fetchRoute = useCallback(async () => {
    if (!origin || !destination) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getDirections({ 
        profile, 
        from: origin.position, 
        to: destination.position 
      });
      setRoute(result);
    } catch (e: any) {
      setRoute(null);
      setError(e?.message ?? 'Failed to calculate route');
    } finally {
      setLoading(false);
    }
  }, [origin, destination, profile]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!route) {
        if (mounted) setCostText(null);
        return;
      }

      const km = route.summary.distanceKm;

      const result = await costCalculator.calculate(profile, {
        distanceKm: km,
        vehicle: selectedVehicle,
        fallbackFuelType: fuelType,
        fallbackLitersPer100: defaultConsumption[fuelType],
        euroPerLiter,
      });

      if (!mounted) return;

      if (!result) {
        if (profile === 'driving-car') setCostText('Fuel price unavailable.');
        else setCostText(null);
        return;
      }

      if (result.kind === 'fuel') {
        setCostText(
          `Fuel: ~€${result.euros.toFixed(2)} (≈ ${result.liters.toFixed(2)} L @ €${result.euroPerLiter.toFixed(2)}/L)`
        );
        return;
      }

      // energy
      setCostText(`Energy: ~${result.kcal} kcal`);
    })().catch(() => {
      if (!mounted) return;
      setCostText(profile === 'driving-car' ? 'Fuel price unavailable.' : null);
    });

    return () => {
      mounted = false;
    };
  }, [route, profile, selectedVehicle, fuelType, euroPerLiter, defaultConsumption]);

  return (
    <div className="w-full h-full relative">
      <SearchBar
        onSelectA={handleSelectOrigin}
        onSelectB={handleSelectDestination}
        originLabel={origin?.label}
        destinationLabel={destination?.label}
      />

      <div className="absolute top-4 right-4 max-w-sm w-[340px] space-y-2">
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
