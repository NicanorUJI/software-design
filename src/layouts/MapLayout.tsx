import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import RoutePanel from '../components/RoutePanel';
import SidePanel from '../components/SidePanel';
import { useTripPlannerViewModel } from '../viewModels/useTripPlannerViewModel';

export default function MapLayout() {
  const vm = useTripPlannerViewModel();

  return (
    <div className="w-full h-full relative">
      <SearchBar
        onSelectA={vm.selectOrigin}
        onSelectB={vm.selectDestination}
        originLabel={vm.origin?.label}
        destinationLabel={vm.destination?.label}
      />

      <div className="absolute top-4 right-4 max-w-sm w-[340px] space-y-2">
        <RoutePanel
          profile={vm.profile}
          onProfileChange={vm.changeProfile}
          canRoute={vm.canRoute}
          loading={vm.loading}
          error={vm.error}
          onRouteClick={vm.planTrip}
          originLabel={vm.origin?.label ?? ''}
          destinationLabel={vm.destination?.label ?? ''}
          summary={vm.route?.summary ?? null}
          costText={vm.costText}
          vehicles={vm.vehicles}
          selectedVehicleId={vm.selectedVehicleId}
          onVehicleChange={vm.changeVehicle}
          fuelType={vm.fuelType}
          onFuelTypeChange={vm.setFuelType}
        />
      </div>

      <div className="absolute top-4 left-4">
        <SidePanel
          currentOrigin={vm.origin ? { label: vm.origin.label, position: vm.origin.position } : null}
          currentDestination={vm.destination ? { label: vm.destination.label, position: vm.destination.position } : null}
          currentRoute={
            vm.route
              ? { distanceKm: vm.route.summary.distanceKm, durationMin: vm.route.summary.durationMin, profile: vm.profile }
              : null
          }
          onApplyPreferences={(p) => {
            vm.changeProfile(p.defaultProfile);
            vm.setFuelType(p.defaultFuelType);
          }}
          vehicles={vm.vehicles}
          onAddVehicle={vm.addNewVehicle}
          onRemoveVehicle={vm.removeExistingVehicle}
        />
      </div>

      <MapView
        origin={vm.origin?.position ?? null}
        destination={vm.destination?.position ?? null}
        route={vm.route}
      />
    </div>
  );
}
