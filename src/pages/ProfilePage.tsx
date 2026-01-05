import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import * as authService from '../services/auth';
import type { FuelType, Preferences } from '../types/domain';
import { getPreferences, setPreferences, updatePreferences } from '../services/repos/preferencesRepo';
import type { TravelProfile } from '../types/route';

export default function ProfilePage() {
  const nav = useNavigate();
  const { user, logout } = useAuth();

  const [prefs, setPrefs] = useState<Preferences>({
    id: 'default',
    defaultProfile: 'driving-car',
    defaultFuelType: 'gasoline95',
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const existing = await getPreferences();
        if (existing) setPrefs(existing);
        else await setPreferences(prefs);
      } catch (e: any) {
        setErr(e?.message ?? 'Failed to load preferences');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (profile: TravelProfile) => {
    setErr(null);
    setPrefs((p) => ({ ...p, defaultProfile: profile }));
    try {
      await updatePreferences({ defaultProfile: profile });
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to update profile');
    }
  };

  const saveFuel = async (fuel: FuelType) => {
    setErr(null);
    setPrefs((p) => ({ ...p, defaultFuelType: fuel }));
    try {
      await updatePreferences({ defaultFuelType: fuel });
    } catch (e: any) {
      setErr(e?.message ?? 'Failed to update fuel type');
    }
  };

  const handleLogout = async () => {
    setErr(null);
    setBusy(true);
    try {
      await logout();
      nav('/login');
    } catch (e: any) {
      setErr(e?.message ?? 'Logout failed');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const ok = window.confirm(
      'This will delete your account. This action cannot be undone. Continue?'
    );
    if (!ok) return;

    setErr(null);
    setBusy(true);

    try {
      await authService.deleteAccount(user);
      nav('/login');
    } catch (e: any) {
      // Firebase often requires recent login to delete user:
      // auth/requires-recent-login
      setErr(e?.message ?? 'Delete account failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen w-screen relative overflow-hidden bg-slate-100">
      {/* Background “map-like” layer (aprox Figma) */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-[820px] max-w-[95vw] bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-black/5 p-6">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => nav('/')}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to maps
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={busy}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
              title="Delete account"
            >
              Delete account
            </button>
          </div>

          {/* Center header */}
          <div className="mt-6 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center text-2xl">
              👤
            </div>

            <div className="mt-3 text-lg font-semibold">FakeMaps</div>

            <div className="mt-2 text-sm text-gray-700">
              {user?.email ?? '—'}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={busy}
              className="mt-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
              title="Logout"
            >
              Logout
            </button>
          </div>

          {/* Preferences */}
          <div className="mt-8">
            <div className="text-sm font-semibold text-gray-700 mb-3">
              Preferencias
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-black/5 bg-white p-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                  Tipo de transporte
                </div>
                <select
                  className="w-full rounded-xl border border-black/10 px-3 py-2 bg-white"
                  value={prefs.defaultProfile}
                  onChange={(e) => saveProfile(e.target.value as TravelProfile)}
                  disabled={busy}
                >
                  <option value="driving-car">Automóvil</option>
                  <option value="cycling-regular">Bicicleta</option>
                  <option value="foot-walking">A pie</option>
                </select>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                  Combustible
                </div>
                <select
                  className="w-full rounded-xl border border-black/10 px-3 py-2 bg-white"
                  value={prefs.defaultFuelType}
                  onChange={(e) => saveFuel(e.target.value as FuelType)}
                  disabled={busy}
                >
                  <option value="gasoline95">Gasolina 95</option>
                  <option value="gasoline98">Gasolina 98</option>
                  <option value="diesel">Diésel</option>
                </select>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-4 flex items-center justify-center text-xs text-gray-500">
                Tema (pendiente)
              </div>
            </div>

            {err && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
