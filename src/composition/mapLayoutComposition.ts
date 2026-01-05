import { SearchBarViewModel } from '../viewModels/SearchBarViewModel';
import { SidePanelViewModel } from '../viewModels/SidePanelViewModel';
import { TripPlannerViewModel } from '../viewModels/TripPlannerViewModel';

import { getRoutingService, getTripPlannerFacade } from '../services/serviceRegistry';

import { addPlace, listPlaces, removePlace } from '../services/repos/placesRepo';
import { getPreferences, setPreferences, updatePreferences } from '../services/repos/preferencesRepo';
import { addRoute, listRoutes, removeRoute } from '../services/repos/routesRepo';
import { addVehicle, listVehicles, removeVehicle } from '../services/repos/vehiclesRepo';

function assertUid(uid: string) {
  if (!uid) throw new Error('Missing user id');
}

export function createTripPlannerViewModel(uid: string): TripPlannerViewModel {
  assertUid(uid);

  return new TripPlannerViewModel(
    getTripPlannerFacade(),
    {
      list: () => listVehicles(uid),
      add: (v) => addVehicle(uid, v),
      remove: (id) => removeVehicle(uid, id),
    },
    {
      get: () => getPreferences(uid),
    }
  );
}

export function createSearchBarViewModel(tripVm: TripPlannerViewModel): SearchBarViewModel {
  return new SearchBarViewModel(getRoutingService(), tripVm.selectOrigin, tripVm.selectDestination);
}

export function createSidePanelViewModel(uid: string, tripVm: TripPlannerViewModel): SidePanelViewModel {
  assertUid(uid);

  return new SidePanelViewModel(
    // Places
    {
      list: () => listPlaces(uid),
      add: (p) => addPlace(uid, p),
      remove: (id) => removePlace(uid, id),
    },
    // Routes
    {
      list: () => listRoutes(uid),
      add: (r) => addRoute(uid, r),
      remove: (id) => removeRoute(uid, id),
    },
    // Preferences
    {
      get: () => getPreferences(uid),
      set: (p) => setPreferences(uid, p),
      update: (patch) => updatePreferences(uid, patch as any),
    },
    // Vehicles (delegado al TripPlannerVM)
    {
      add: tripVm.addNewVehicle,
      remove: tripVm.removeExistingVehicle,
    },
    // Apply preferences to trip state
    (p) => {
      tripVm.changeProfile(p.defaultProfile);
      tripVm.setFuelType(p.defaultFuelType);
    },
    // SidePanel selects origin/destination
    (p) => tripVm.selectOrigin(p as any),
    (p) => tripVm.selectDestination(p as any),
    // Plan
    () => tripVm.planTrip()
  );
}
