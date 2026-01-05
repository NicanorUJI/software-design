import { useState, useEffect, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import RoutePanel from '../components/RoutePanel';
import SidePanel from '../components/SidePanel';
import HamburgerMenu from '../components/HamburgerMenu';
import { useTripPlannerViewModel } from '../viewModels/useTripPlannerViewModel';
import { SearchBarViewModel } from '../viewModels/SearchBarViewModel';
import { SidePanelViewModel } from '../viewModels/SidePanelViewModel';
import { getRoutingService } from '../services/serviceRegistry';
import { useNavigate } from 'react-router-dom';

import { addPlace, listPlaces, removePlace } from '../services/repos/placesRepo';
import { addRoute, listRoutes, removeRoute } from '../services/repos/routesRepo';
import { getPreferences, setPreferences, updatePreferences } from '../services/repos/preferencesRepo';

export default function MapLayout() {
  const tripVm = useTripPlannerViewModel();

  const [sideOpen, setSideOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const navigate = useNavigate();

  const searchBarVm = useMemo(() => {
    return new SearchBarViewModel(
      getRoutingService(),
      tripVm.selectOrigin,
      tripVm.selectDestination
    );
  }, [tripVm.selectOrigin, tripVm.selectDestination]);

  useEffect(() => {
    return () => searchBarVm.dispose();
  }, [searchBarVm]);

  const sidePanelVm = useMemo(() => {
    return new SidePanelViewModel(
      // Places
      {
        list: listPlaces,
        add: addPlace,
        remove: removePlace,
      },
      // Routes
      {
        list: listRoutes,
        add: addRoute,
        remove: removeRoute,
      },
      // Preferences
      {
        get: getPreferences,
        set: setPreferences,
        update: updatePreferences,
      },
      // Vehicles (delegamos al Trip VM para mantener un source-of-truth único)
      {
        add: tripVm.addNewVehicle,
        remove: tripVm.removeExistingVehicle,
      },
      // Notificar cambios de prefs al Trip VM
      (p) => {
        tripVm.changeProfile(p.defaultProfile);
        tripVm.setFuelType(p.defaultFuelType);
      }
    );
  }, [
    tripVm.addNewVehicle,
    tripVm.removeExistingVehicle,
    tripVm.changeProfile,
    tripVm.setFuelType,
  ]);

  useEffect(() => {
    return () => sidePanelVm.dispose?.();
  }, [sidePanelVm]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapView
          origin={tripVm.origin?.position ?? null}
          destination={tripVm.destination?.position ?? null}
          route={tripVm.route}
        />
      </div>

      <div className="absolute top-4 left-4 z-50">
        <HamburgerMenu onClick={() => setSideOpen(true)} />
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500]">
        <SearchBar
          vm={searchBarVm}
          originLabel={tripVm.origin?.label}
          destinationLabel={tripVm.destination?.label}
          onCalculateRoute={tripVm.planTrip}
          canCalculateRoute={tripVm.canRoute}
          loading={tripVm.loading}
          error={tripVm.error}
          resetKey={resetKey}
        />
      </div>

      <SidePanel
        vm={sidePanelVm}
        open={sideOpen}
        onClose={() => setSideOpen(false)}
        currentOrigin={
          tripVm.origin ? { label: tripVm.origin.label, position: tripVm.origin.position } : null
        }
        currentDestination={
          tripVm.destination
            ? { label: tripVm.destination.label, position: tripVm.destination.position }
            : null
        }
        currentRoute={
          tripVm.route
            ? {
                distanceKm: tripVm.route.summary.distanceKm,
                durationMin: tripVm.route.summary.durationMin,
                profile: tripVm.profile,
              }
            : null
        }
        vehicles={tripVm.vehicles}
        onGoProfile={() => navigate('/profile')}
      />

      {tripVm.route && !tripVm.error && (
        <div className="absolute top-4 right-4 max-w-sm w-[340px] space-y-2 z-[500]">
          <RoutePanel
            profile={tripVm.profile}
            onProfileChange={tripVm.changeProfile}
            canRoute={tripVm.canRoute}
            loading={tripVm.loading}
            error={tripVm.error}
            onRouteClick={tripVm.planTrip}
            originLabel={tripVm.origin?.label ?? ''}
            destinationLabel={tripVm.destination?.label ?? ''}
            summary={tripVm.route?.summary ?? null}
            costText={tripVm.costText}
            vehicles={tripVm.vehicles}
            selectedVehicleId={tripVm.selectedVehicleId}
            onVehicleChange={tripVm.changeVehicle}
            fuelType={tripVm.fuelType}
            onFuelTypeChange={tripVm.setFuelType}
            showCalculateButton={false}
            onClose={() => {
              tripVm.resetTrip?.(); // si existe
              setResetKey((k) => k + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
