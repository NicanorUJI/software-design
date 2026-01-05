import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import RoutePanel from '../components/RoutePanel';
import SidePanel from '../components/SidePanel';
import HamburgerMenu from '../components/HamburgerMenu';

import { useViewModel } from '../viewModels/base/useViewModel';
import {
  createSearchBarViewModel,
  createSidePanelViewModel,
  createTripPlannerViewModel,
} from '../composition/mapLayoutComposition';

import { useAuth } from '../services/AuthContext';

export default function MapLayout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const uid = user?.uid;

  const [sideOpen, setSideOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // Guard de auth
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  // Mientras auth carga, evita instanciar VMs.
  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!uid) return null;

  const tripVm = useMemo(() => createTripPlannerViewModel(uid), [uid]);
  const trip = useViewModel(tripVm);

  useEffect(() => {
    void tripVm.init();
    return () => tripVm.dispose();
  }, [tripVm]);

  const searchBarVm = useMemo(() => createSearchBarViewModel(tripVm), [tripVm]);

  useEffect(() => {
    return () => searchBarVm.dispose();
  }, [searchBarVm]);

  const sidePanelVm = useMemo(() => createSidePanelViewModel(uid, tripVm), [uid, tripVm]);

  useEffect(() => {
    return () => sidePanelVm.dispose?.();
  }, [sidePanelVm]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapView
          origin={trip.origin?.position ?? null}
          destination={trip.destination?.position ?? null}
          route={trip.route}
        />
      </div>

      <div className="absolute top-4 left-4 z-50">
        <HamburgerMenu onClick={() => setSideOpen(true)} />
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500]">
        <SearchBar
          vm={searchBarVm}
          originLabel={trip.origin?.label}
          destinationLabel={trip.destination?.label}
          onCalculateRoute={tripVm.planTrip}
          canCalculateRoute={tripVm.canRoute}
          loading={trip.loading}
          error={trip.error}
          resetKey={resetKey}
        />
      </div>

      <SidePanel
        vm={sidePanelVm}
        open={sideOpen}
        onClose={() => setSideOpen(false)}
        currentOrigin={trip.origin ? { label: trip.origin.label, position: trip.origin.position } : null}
        currentDestination={
          trip.destination ? { label: trip.destination.label, position: trip.destination.position } : null
        }
        currentRoute={
          trip.route
            ? {
                distanceKm: trip.route.summary.distanceKm,
                durationMin: trip.route.summary.durationMin,
                profile: trip.profile,
              }
            : null
        }
        vehicles={trip.vehicles}
        onGoProfile={() => navigate('/profile')}
      />

      {trip.route && !trip.error && (
        <div className="absolute top-4 right-4 max-w-sm w-[340px] space-y-2 z-[500]">
          <RoutePanel
            profile={trip.profile}
            onProfileChange={tripVm.changeProfile}
            canRoute={tripVm.canRoute}
            loading={trip.loading}
            error={trip.error}
            onRouteClick={tripVm.planTrip}
            originLabel={trip.origin?.label ?? ''}
            destinationLabel={trip.destination?.label ?? ''}
            summary={trip.route?.summary ?? null}
            costText={trip.costText}
            vehicles={trip.vehicles}
            selectedVehicleId={trip.selectedVehicleId}
            onVehicleChange={tripVm.changeVehicle}
            fuelType={trip.fuelType}
            onFuelTypeChange={tripVm.setFuelType}
            showCalculateButton={false}
            onClose={() => {
              tripVm.resetTrip();
              setResetKey((k) => k + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
