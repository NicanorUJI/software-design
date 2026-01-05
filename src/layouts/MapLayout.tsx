import { useState, useEffect, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import RoutePanel from '../components/RoutePanel';
import SidePanel from '../components/SidePanel';
import HamburgerMenu from '../components/HamburgerMenu';
import { SearchBarViewModel } from '../viewModels/SearchBarViewModel';
import { SidePanelViewModel } from '../viewModels/SidePanelViewModel';
import { useNavigate } from 'react-router-dom';
import { useViewModel } from '../viewModels/base/useViewModel';
import {TripPlannerViewModel} from "../viewModels/TripPlannerViewModel";
import { getTripPlannerFacade, getRoutingService } from '../services/serviceRegistry';
import { listVehicles, addVehicle, removeVehicle } from '../services/repos/vehiclesRepo';

import { addPlace, listPlaces, removePlace } from '../services/repos/placesRepo';
import { addRoute, listRoutes, removeRoute } from '../services/repos/routesRepo';
import { getPreferences, setPreferences, updatePreferences } from '../services/repos/preferencesRepo';

export default function MapLayout() {

  const [sideOpen, setSideOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const navigate = useNavigate();

  const tripVm = useMemo(() => {
    return new TripPlannerViewModel(
      getTripPlannerFacade(),
      { list: listVehicles, add: addVehicle, remove: removeVehicle },
      { get: getPreferences }
    );
  }, []);

  const trip = useViewModel(tripVm);
  
  useEffect(() => {
    return () => tripVm.dispose();
  }, [tripVm]);

  const searchBarVm = useMemo(() => {
    return new SearchBarViewModel(
      getRoutingService(),
      tripVm.selectOrigin,
      tripVm.selectDestination
    );
  }, [tripVm]);

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
      // Vehicles
      {
        add: tripVm.addNewVehicle,
        remove: tripVm.removeExistingVehicle,
      },
      (p) => {
        tripVm.changeProfile(p.defaultProfile);
        tripVm.setFuelType(p.defaultFuelType);
      },
      (p) => tripVm.selectOrigin(p as any),
      (p) => tripVm.selectDestination(p as any),
      () => tripVm.planTrip()
    );
  }, [
    tripVm,
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
        currentOrigin={
          trip.origin ? { label: trip.origin.label, position: trip.origin.position } : null
        }
        currentDestination={
          trip.destination
            ? { label: trip.destination.label, position: trip.destination.position }
            : null
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
