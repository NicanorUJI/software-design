// src/viewModels/ProfileViewModel.ts
import { ViewModel } from './base/ViewModel';
import type { FuelType, Preferences } from '../types/domain';
import type { TravelProfile } from '../types/route';

export type ProfileState = {
  userEmail: string | null;

  prefs: Preferences;
  busy: boolean;
  error: string | null;
};

export interface ProfileAuthPort {
  getUserEmail(): string | null;
  logout(): Promise<void>;
  deleteAccount(): Promise<void>;
}

export interface PreferencesRepoPort {
  get(): Promise<Preferences | null>;
  set(prefs: Preferences): Promise<void>;
  update(patch: Partial<Omit<Preferences, 'id'>>): Promise<void>;
}

const DEFAULT_PREFS: Preferences = {
  id: 'default',
  defaultProfile: 'driving-car',
  defaultFuelType: 'gasoline95',
};

export class ProfileViewModel extends ViewModel<ProfileState> {
  private readonly auth: ProfileAuthPort;
  private readonly prefsRepo: PreferencesRepoPort;
  private initialized = false;

  constructor(auth: ProfileAuthPort, prefsRepo: PreferencesRepoPort) {
    super({
      userEmail: auth.getUserEmail(),
      prefs: DEFAULT_PREFS,
      busy: false,
      error: null,
    });

    this.auth = auth;
    this.prefsRepo = prefsRepo;
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const existing = await this.prefsRepo.get();
      if (existing) {
        this.setState({ prefs: existing });
      } else {
        await this.prefsRepo.set(this.snapshot.prefs);
      }
    } catch (e: any) {
      this.setState({ error: e?.message ?? 'Failed to load preferences' });
    }
  }

  refreshUserEmail() {
    this.setState({ userEmail: this.auth.getUserEmail() });
  }

  async saveProfile(profile: TravelProfile) {
    this.setState((p) => ({ ...p, error: null, prefs: { ...p.prefs, defaultProfile: profile } }));

    try {
      await this.prefsRepo.update({ defaultProfile: profile });
    } catch (e: any) {
      this.setState({ error: e?.message ?? 'Failed to update profile' });
    }
  }

  async saveFuel(fuel: FuelType) {
    this.setState((p) => ({ ...p, error: null, prefs: { ...p.prefs, defaultFuelType: fuel } }));

    try {
      await this.prefsRepo.update({ defaultFuelType: fuel });
    } catch (e: any) {
      this.setState({ error: e?.message ?? 'Failed to update fuel type' });
    }
  }

  async logout(onDone: () => void) {
    this.setState({ error: null, busy: true });
    try {
      await this.auth.logout();
      onDone();
    } catch (e: any) {
      this.setState({ error: e?.message ?? 'Logout failed' });
    } finally {
      this.setState({ busy: false });
    }
  }

  async deleteAccount(onDone: () => void) {
    this.setState({ error: null, busy: true });

    try {
      await this.auth.deleteAccount();
      onDone();
    } catch (e: any) {
      this.setState({ error: e?.message ?? 'Delete account failed' });
    } finally {
      this.setState({ busy: false });
    }
  }
}
