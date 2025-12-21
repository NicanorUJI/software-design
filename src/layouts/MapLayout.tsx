// src/layouts/MapLayout.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import MapView from '../components/MapView';
import RoutePanel from '../components/RoutePanel';
import SearchBar from '../components/SearchBar';
import SidePanel from '../components/SidePanel';
import type { PlaceSuggestion, RouteResult, TravelProfile } from '../types/route';
import { getDirections } from '../services/ors';
import { calculateCalories, calculateFuelCost } from '../utils/cost';
import { getEuroPerLiter, type FuelType } from '../services/fuel';
import { getPreferences } from '../services/repos/preferencesRepo';

export default function MapLayout() {
  const [origin, setOrigin] = useState<PlaceSuggestion | null>(null);
  const [destination, setDestination] = useState<PlaceSuggestion | null>(null);
  const [profile, setProfile] = useState<TravelProfile>('driving-car');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fuelType, setFuelType] = useState<FuelType>('gasoline95');
  const [euroPerLiter, setEuroPerLiter] = useState<number | null>(null);

  const defaultConsumption: Record<FuelType, number> = {
    gasoline95: 6.5,
    gasoline98: 7.0,
    diesel: 5.5,
  };

  // load preferences (if exist)
  useEffect(() => {
    (async () => {
      const p = await getPreferences();
      if (p) {
        setProfile(p.defaultProfile);
        setFuelType(p.defaultFuelType);
      }
    })();
  }, []);

  const canRoute = useMemo(() => origin && destination, [origin, destination]);

  const handleSelectOrigin = useCallback((place: PlaceSuggestion) => {
    setOrigin(place);
    setRoute(null);
  }, []);

  const handleSelectDestination = useCallback((place: PlaceSuggestion) => {
    setDestination(place);
    setRoute(null);
  }, []);

  const fetchRoute = useCallback(async () => {
    if (!origin || !destination) return;
    try {
      setLoading(true);
      setError(null);
      const res = await getDirections({
        profile,
        from: origin.position,
        to: destination.position,
      });
      setRoute(res);
    } catch (e: any) {
      setError(e.message ?? 'Failed to fetch route');
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, profile]);

  const handleProfileChange = useCallback((p: TravelProfile) => {
    setProfile(p);
    if (origin && destination) fetchRoute();
  }, [origin, destination, fetchRoute]);

  // get fuel price when needed
  useEffect(() => {
    if (profile !== 'driving-car') return;
    let mounted = true;
    getEuroPerLiter(fuelType)
      .then((v) => { if (mounted) setEuroPerLiter(v); })
      .catch(() => setEuroPerLiter(null));
    return () => { mounted = false; };
  }, [fuelType, profile]);

  const costText = useMemo(() => {
    if (!route) return null;
    const km = route.summary.distanceKm;
    if (profile === 'driving-car') {
      if (euroPerLiter == null) return 'Fuel price unavailable.';
      const litersPer100 = defaultConsumption[fuelType];
      const { liters, euros } = calculateFuelCost(km, litersPer100, euroPerLiter);
      return `Fuel: ~€${euros.toFixed(2)} (≈ ${liters.toFixed(2)} L @ €${euroPerLiter.toFixed(2)}/L)`;
    }
    if (profile === 'cycling-regular') {
      const kcal = calculateCalories(km, 'cycling');
      return `Energy: ~${kcal} kcal`;
    }
    if (profile === 'foot-walking') {
      const kcal = calculateCalories(km, 'walking');
      return `Energy: ~${kcal} kcal`;
    }
    return null;
  }, [route, profile, euroPerLiter, fuelType]);

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
          canRoute={!!canRoute}
          loading={loading}
          error={error}
          onRouteClick={fetchRoute}
          originLabel={origin?.label ?? ''}
          destinationLabel={destination?.label ?? ''}
          summary={route?.summary ?? null}
          costText={costText}
        />
      </div>

      {/* Left side: persistence side panel */}
      <div className="absolute top-4 left-4">
        <SidePanel
          currentOrigin={origin ? { label: origin.label, position: origin.position } : null}
          currentDestination={destination ? { label: destination.label, position: destination.position } : null}
          currentRoute={route ? { distanceKm: route.summary.distanceKm, durationMin: route.summary.durationMin, profile } : null}
          onApplyPreferences={(p) => {
            setProfile(p.defaultProfile);
            setFuelType(p.defaultFuelType);
          }}
        />
      </div>

    <MapView
        origin={origin?.position ?? null}
        destination={destination?.position ?? null}
        route={route}
      />
    </div>
  );
}
