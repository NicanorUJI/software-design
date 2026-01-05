// src/viewModels/TripPlannerViewModel.ts
import type { PlaceSuggestion, RouteResult, TravelProfile } from '../types/route';
import type { FuelType, Vehicle } from '../types/domain';
import type { TripPlannerFacade } from '../domain/facades/TripPlannerFacade';
import type { Preferences } from '../types/domain';
import { ViewModel } from './base/ViewModel';

export type TripPlannerState = {
  origin: PlaceSuggestion | null;
  destination: PlaceSuggestion | null;
  profile: TravelProfile;

  route: RouteResult | null;
  costText: string | null;

  loading: boolean;
  error: string | null;

  fuelType: FuelType;

  vehicles: Vehicle[];
  selectedVehicleId: string | null;
};

export interface VehiclesRepoPort {
  list(): Promise<Vehicle[]>;
  add(v: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle>;
  remove(id: string): Promise<void>;
}

export interface PreferencesRepoPort {
  get(): Promise<Preferences | null>;
}

export class TripPlannerViewModel extends ViewModel<TripPlannerState> {
  private readonly facade: TripPlannerFacade;
  private readonly vehiclesRepo: VehiclesRepoPort;
  private readonly prefsRepo: PreferencesRepoPort;

  private initialized = false;
  private planToken = 0;
  private costToken = 0;

  private readonly defaultConsumption: Record<FuelType, number> = {
    gasoline95: 6.5,
    gasoline98: 7.0,
    diesel: 5.5,
  };

  constructor(
    facade: TripPlannerFacade,
    vehiclesRepo: VehiclesRepoPort,
    prefsRepo: PreferencesRepoPort
  ) {
    super({
      origin: null,
      destination: null,
      profile: 'driving-car',

      route: null,
      costText: null,

      loading: false,
      error: null,

      fuelType: 'gasoline95',

      vehicles: [],
      selectedVehicleId: null,
    });

    this.facade = facade;
    this.vehiclesRepo = vehiclesRepo;
    this.prefsRepo = prefsRepo;
  }

  // ---------- derived ----------
  get canRoute() {
    const s = this.snapshot;
    return !!s.origin && !!s.destination;
  }

  get selectedVehicle(): Vehicle | null {
    const s = this.snapshot;
    if (!s.selectedVehicleId) return null;
    return s.vehicles.find((v) => v.id === s.selectedVehicleId) ?? null;
  }

  // ---------- lifecycle ----------
  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const [prefs, vs] = await Promise.all([
        this.prefsRepo.get(),
        this.vehiclesRepo.list(),
      ]);

      this.setState((prev) => ({
        ...prev,
        vehicles: vs,
        profile: prefs?.defaultProfile ?? prev.profile,
        fuelType: prefs?.defaultFuelType ?? prev.fuelType,
      }));
    } catch {
    }
  }

  // ---------- commands ----------
  selectOrigin = (p: PlaceSuggestion) => {
    this.setState({
      origin: p,
      route: null,
      costText: null,
      error: null,
    });
  };

  selectDestination = (p: PlaceSuggestion) => {
    this.setState({
      destination: p,
      route: null,
      costText: null,
      error: null,
    });
  };

  changeProfile = (p: TravelProfile) => {
    this.setState({
      profile: p,
      route: null,
      costText: null,
      error: null,
    });
  };

  setFuelType = (t: FuelType) => {
    this.setState({ fuelType: t, costText: null, error: null });
    this.recalcCostIfPossible();
  };

  changeVehicle = (id: string | null) => {
    if (!id) {
      this.setState({ selectedVehicleId: null, costText: null, error: null });
      this.recalcCostIfPossible();
      return;
    }

    const v = this.snapshot.vehicles.find((x) => x.id === id) ?? null;

    this.setState({
      selectedVehicleId: id,
      fuelType: v?.fuelType ?? this.snapshot.fuelType,
      costText: null,
      error: null,
    });
  };

  addNewVehicle = async (v: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const created = await this.vehiclesRepo.add(v);
    this.setState((prev) => ({
      ...prev,
      vehicles: [created, ...prev.vehicles],
    }));
  };

  removeExistingVehicle = async (id: string) => {
    await this.vehiclesRepo.remove(id);

    this.setState((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((v) => v.id !== id),
      selectedVehicleId: prev.selectedVehicleId === id ? null : prev.selectedVehicleId,
    }));
  };

  planTrip = async () => {
    const s = this.snapshot;
    if (!s.origin || !s.destination) return;

    const token = ++this.planToken;

    try {
      this.setState({ loading: true, error: null });

      const result = await this.facade.planTrip({
        origin: s.origin,
        destination: s.destination,
        profile: s.profile,
        vehicle: this.selectedVehicle,
        fuelType: s.fuelType,
        defaultConsumption: this.defaultConsumption,
      });

      // Evitar race conditions si el usuario cambió inputs mientras se calculaba
      if (token !== this.planToken) return;

      this.setState({
        route: result.route,
        costText: result.costText,
        loading: false,
      });
    } catch (e: any) {
      if (token !== this.planToken) return;

      this.setState({
        error: e?.message ?? 'Failed to fetch route',
        route: null,
        costText: null,
        loading: false,
      });
    }
  };

  private recalcCostIfPossible() {
    const s = this.snapshot;
    if (!s.route) return;
    if (s.profile !== 'driving-car') return;

    const token = ++this.costToken;
    const route = s.route;

    void (async () => {
        try {
        const res = await this.facade.estimateCost({
            profile: s.profile,
            distanceKm: route.summary.distanceKm,
            vehicle: this.selectedVehicle,
            fuelType: s.fuelType,
            defaultConsumption: this.defaultConsumption,
        });

        if (token !== this.costToken) return;
        this.setState({ costText: res.costText });
        } catch {
        if (token !== this.costToken) return;
        this.setState({ costText: null });
        }
    })();
}

  resetTrip = () => {
    this.planToken++;
    this.setState({
      origin: null,
      destination: null,
      route: null,
      costText: null,
      error: null,
      loading: false,
    });
  };
}
