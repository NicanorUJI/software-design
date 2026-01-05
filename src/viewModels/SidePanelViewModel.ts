// src/viewModels/SidePanelViewModel.ts
import type { FuelType, Place, Preferences, SavedRoute, Vehicle } from '../types/domain';
import type { TravelProfile } from '../types/route';
import { ViewModel } from './base/ViewModel';

export type SidePanelSection = 'menu' | 'saved' | 'vehicles' | 'preferences';

export type SidePanelContext = {
  origin: { label: string; position: { lat: number; lng: number } } | null;
  destination: { label: string; position: { lat: number; lng: number } } | null;
  route:
    | {
        distanceKm: number;
        durationMin: number;
        profile: TravelProfile;
      }
    | null;
};

export type SidePanelState = {
  section: SidePanelSection;
  loading: boolean;
  error: string | null;

  ctx: SidePanelContext;

  places: Place[];
  routes: SavedRoute[];
  prefs: Preferences | null;

  vehicles: Vehicle[];

  vehName: string;
  vehLitersPer100: string;
  vehFuelType: FuelType;
};

export interface PlacesRepoPort {
  list(): Promise<Place[]>;
  add(input: { label: string; position: { lat: number; lng: number } }): Promise<Place>;
  remove(id: string): Promise<void>;
}

export interface RoutesRepoPort {
  list(): Promise<SavedRoute[]>;
  add(input: Omit<SavedRoute, 'id' | 'createdAt'>): Promise<SavedRoute>;
  remove(id: string): Promise<void>;
}

export interface PreferencesRepoPort {
  get(): Promise<Preferences | null>;
  set(prefs: Preferences): Promise<void>;
  update(patch: Partial<Omit<Preferences, 'id'>>): Promise<void>;
}

export interface VehiclesPort {
  add(v: Omit<Vehicle, 'id' | 'createdAt'>): Promise<void>;
  remove(id: string): Promise<void>;
}

export type Coords = { lat: number; lng: number };
export type PlaceLike = { label: string; position: Coords };

export class SidePanelViewModel extends ViewModel<SidePanelState> {
  private readonly placesRepo: PlacesRepoPort;
  private readonly routesRepo: RoutesRepoPort;
  private readonly prefsRepo: PreferencesRepoPort;
  private readonly vehiclesPort: VehiclesPort;
  private readonly onPreferencesChanged: (p: Preferences) => void;
  private readonly onSetOrigin: (p: PlaceLike) => void;
  private readonly onSetDestination: (p: PlaceLike) => void;
  private readonly onPlanTrip: () => void;

  constructor(
    placesRepo: PlacesRepoPort,
    routesRepo: RoutesRepoPort,
    prefsRepo: PreferencesRepoPort,
    vehiclesPort: VehiclesPort,
    onPreferencesChanged: (p: Preferences) => void,
    onSetOrigin: (p: PlaceLike) => void,
    onSetDestination: (p: PlaceLike) => void,
    onPlanTrip: () => void
  ) {
    super({
      section: 'menu',
      loading: false,
      error: null,

      ctx: { origin: null, destination: null, route: null },

      places: [],
      routes: [],
      prefs: null,

      vehicles: [],

      vehName: '',
      vehLitersPer100: '6.5',
      vehFuelType: 'gasoline95',
    });

    this.placesRepo = placesRepo;
    this.routesRepo = routesRepo;
    this.prefsRepo = prefsRepo;
    this.vehiclesPort = vehiclesPort;
    this.onPreferencesChanged = onPreferencesChanged;
    this.onSetOrigin = onSetOrigin;
    this.onSetDestination = onSetDestination;
    this.onPlanTrip = onPlanTrip;
  }

  // ---------- lifecycle ----------
  async init(): Promise<void> {
    if (this.snapshot.loading) return;

    this.setState({ loading: true, error: null });

    try {
      const [places, routes, prefs] = await Promise.all([
        this.placesRepo.list(),
        this.routesRepo.list(),
        this.prefsRepo.get(),
      ]);

      this.setState((prev) => ({
        ...prev,
        places,
        routes,
        prefs,
        vehFuelType: prefs?.defaultFuelType ?? prev.vehFuelType,
        loading: false,
      }));
    } catch (e: any) {
      this.setState({
        loading: false,
        error: e?.message ?? 'Failed to load side panel data',
      });
    }
  }

  // ---------- external bindings ----------
  setContext(next: Partial<SidePanelContext>) {
    this.setState((prev) => ({
      ...prev,
      ctx: { ...prev.ctx, ...next },
    }));
  }

  setVehicles(vs: Vehicle[]) {
    this.setState({ vehicles: vs });
  }

  // ---------- navigation ----------
  openMenu() {
    this.setState({ section: 'menu' });
  }
  openSaved() {
    this.setState({ section: 'saved' });
  }
  openVehicles() {
    this.setState({ section: 'vehicles' });
  }
  openPreferences() {
    this.setState({ section: 'preferences' });
  }

  // ---------- derived UI state ----------
  get canSaveOrigin() {
    return !!this.snapshot.ctx.origin;
  }
  get canSaveDestination() {
    return !!this.snapshot.ctx.destination;
  }
  get canSaveRoute() {
    const s = this.snapshot.ctx;
    return !!s.origin && !!s.destination && !!s.route;
  }

  get vehLitersParsed() {
    return Number(this.snapshot.vehLitersPer100);
  }

  get canAddVehicle() {
    const s = this.snapshot;
    const nameOk = s.vehName.trim().length > 0;
    const litersOk = Number.isFinite(this.vehLitersParsed) && this.vehLitersParsed > 0;
    return nameOk && litersOk;
  }

  // ---------- saved CRUD ----------
  async saveOrigin() {
    const origin = this.snapshot.ctx.origin;
    if (!origin) return;

    const created = await this.placesRepo.add({
      label: origin.label,
      position: origin.position,
    });

    this.setState((prev) => ({ ...prev, places: [created, ...prev.places] }));
  }

  async saveDestination() {
    const dest = this.snapshot.ctx.destination;
    if (!dest) return;

    const created = await this.placesRepo.add({
      label: dest.label,
      position: dest.position,
    });

    this.setState((prev) => ({ ...prev, places: [created, ...prev.places] }));
  }

  async saveRoute() {
    const { origin, destination, route } = this.snapshot.ctx;
    if (!origin || !destination || !route) return;

    const created = await this.routesRepo.add({
      origin: { label: origin.label, position: origin.position },
      destination: { label: destination.label, position: destination.position },
      profile: route.profile,
      routeType: 'fastest',
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
    });

    this.setState((prev) => ({ ...prev, routes: [created, ...prev.routes] }));
  }

  async removePlace(id: string) {
    await this.placesRepo.remove(id);
    this.setState((prev) => ({ ...prev, places: prev.places.filter((p) => p.id !== id) }));
  }

  async removeRoute(id: string) {
    await this.routesRepo.remove(id);
    this.setState((prev) => ({ ...prev, routes: prev.routes.filter((r) => r.id !== id) }));
  }

  applySavedRoute(r: SavedRoute) {
    this.onSetOrigin({ label: r.origin.label, position: r.origin.position });
    this.onSetDestination({ label: r.destination.label, position: r.destination.position });
    this.onPlanTrip();
  }

  applyPlace(p: Place) {
    const origin = this.snapshot.ctx.origin;
    const destination = this.snapshot.ctx.destination;

    if (!origin) {
      this.onSetOrigin({ label: p.label, position: p.position });
      return;
    }

    if (!destination) {
      this.onSetDestination({ label: p.label, position: p.position });
      this.onPlanTrip();
      return;
    }

    // ya hay A y B: toma el lugar como nuevo A y recalcula hacia B
    this.onSetOrigin({ label: p.label, position: p.position });
    this.onPlanTrip();
  }

  // ---------- preferences ----------
  async setDefaultProfile(profile: TravelProfile) {
    const current = this.snapshot.prefs;

    const next: Preferences = {
      id: 'default',
      defaultProfile: profile,
      defaultFuelType: current?.defaultFuelType ?? 'gasoline95',
    };

    if (current) await this.prefsRepo.update({ defaultProfile: profile });
    else await this.prefsRepo.set(next);

    this.setState({ prefs: next });
    this.onPreferencesChanged(next);
  }

  async setDefaultFuelType(fuelType: FuelType) {
    const current = this.snapshot.prefs;

    const next: Preferences = {
      id: 'default',
      defaultProfile: current?.defaultProfile ?? 'driving-car',
      defaultFuelType: fuelType,
    };

    if (current) await this.prefsRepo.update({ defaultFuelType: fuelType });
    else await this.prefsRepo.set(next);

    this.setState({ prefs: next, vehFuelType: fuelType });
    this.onPreferencesChanged(next);
  }

  // ---------- vehicles ----------
  setVehName(v: string) {
    this.setState({ vehName: v });
  }
  setVehLitersPer100(v: string) {
    this.setState({ vehLitersPer100: v });
  }
  setVehFuelType(v: FuelType) {
    this.setState({ vehFuelType: v });
  }

  async addVehicle() {
    if (!this.canAddVehicle) return;

    const s = this.snapshot;

    await this.vehiclesPort.add({
      name: s.vehName.trim(),
      fuelType: s.vehFuelType,
      litersPer100: this.vehLitersParsed,
    });

    this.setState({ vehName: '', vehLitersPer100: '6.5' });
  }

  async removeVehicle(id: string) {
    await this.vehiclesPort.remove(id);
  }
}
