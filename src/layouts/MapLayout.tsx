import { useState } from 'react';
import SearchBar from '../components/SearchBar';
import MapView from '../components/MapView';
import RoutePanel from '../components/RoutePanel';
import SidePanel from '../components/SidePanel';
import HamburgerMenu from '../components/HamburgerMenu';
import { useTripPlannerViewModel } from '../viewModels/useTripPlannerViewModel';

export default function MapLayout() {
  const vm = useTripPlannerViewModel();
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* MAP layer */}
      <div className="absolute inset-0 z-0">
        <MapView
          origin={vm.origin?.position ?? null}
          destination={vm.destination?.position ?? null}
          route={vm.route}
        />
      </div>

      {/* Top-left hamburger */}
      <div className="absolute top-4 left-4 z-50">
        <HamburgerMenu onClick={() => setSideOpen(true)} />
      </div>

      {/* Search bar (top center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
        <SearchBar
          onSelectA={vm.selectOrigin}
          onSelectB={vm.selectDestination}
          originLabel={vm.origin?.label}
          destinationLabel={vm.destination?.label}
        />
      </div>

      {/* Side panel (slide-over) */}
      <SidePanel
        open={sideOpen}
        onClose={() => setSideOpen(false)}
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

      {/* Route panel (por ahora abajo-centro, parecido a Figma) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[380px] max-w-[92vw]">
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
    </div>
  );
}
