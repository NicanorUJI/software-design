// src/pages/ProfilePage.tsx
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import * as authService from '../services/auth';
import type { FuelType } from '../types/domain';
import type { TravelProfile } from '../types/route';
import { getPreferences, setPreferences, updatePreferences } from '../services/repos/preferencesRepo';

import { useViewModel } from '../viewModels/base/useViewModel';
import { ProfileViewModel } from '../viewModels/ProfileViewModel';

import logo from '../assests/fakemaps-logo.png';
import bgMap from '../assests/map-bg.png';

export default function ProfilePage() {
  const nav = useNavigate();
  const { user, loading, logout } = useAuth();

  // Si todavía está resolviendo auth, no intentes cargar prefs.
  if (loading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-slate-100">
        <div className="text-sm text-gray-600">Loading...</div>
      </div>
    );
  }

  // Si no hay usuario, redirigir.
  useEffect(() => {
    if (!user) nav('/login');
  }, [user, nav]);

  // Si no hay user (y ya no está loading), no renderizar la página.
  if (!user) return null;

  const uid = user.uid;

  const vm = useMemo(() => {
    return new ProfileViewModel(
      {
        getUserEmail: () => user.email ?? null,
        logout,
        deleteAccount: async () => {
          await authService.deleteAccount(user);
        },
      },
      {
        get: async () => {
          return await getPreferences(uid);
        },
        set: async (p) => {
          await setPreferences(uid, p);
        },
        update: async (patch) => {
          await updatePreferences(uid, patch as any);
        },
      }
    );
  }, [uid, user, logout]);

  const s = useViewModel(vm);

  useEffect(() => {
    vm.init();
    vm.refreshUserEmail();
    return () => vm.dispose();
  }, [vm]);

  return (
    <div className="min-h-screen w-screen relative overflow-hidden bg-slate-100">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgMap})` }}
      />
      <div className="absolute inset-0 bg-white/5" />
      <div className="absolute inset-0 backdrop-blur-[1px]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="w-[820px] max-w-[95vw] bg-white/90 backdrop-blur rounded-2xl shadow-xl border border-black/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => nav('/')}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Volver al mapa
            </button>

            <div className="flex justify-center">
              <img
                src={logo}
                alt="FakeMaps"
                className="h-10 w-auto"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            <button
              type="button"
              onClick={async () => {
                const ok = window.confirm(
                  'This will delete your account. This action cannot be undone. Continue?'
                );
                if (!ok) return;
                await vm.deleteAccount(() => nav('/login'));
              }}
              disabled={s.busy}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
              title="Delete account"
            >
              Borrar cuenta
            </button>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="h-16 w-16 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center text-2xl">
              👤
            </div>

            <div className="mt-2 text-sm text-gray-700">{s.userEmail ?? '—'}</div>

            <button
              type="button"
              onClick={() => vm.logout(() => nav('/login'))}
              disabled={s.busy}
              className="mt-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
              title="Logout"
            >
              Cerrar sesión
            </button>
          </div>

          {s.error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {s.error}
            </div>
          )}

          <div className="mt-8">
            <div className="text-sm font-semibold text-gray-700 mb-3">Preferencias</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-black/5 bg-white p-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">Tipo de transporte</div>
                <select
                  className="w-full rounded-xl border border-black/10 px-3 py-2 bg-white"
                  value={s.prefs.defaultProfile}
                  onChange={(e) => vm.saveProfile(e.target.value as TravelProfile)}
                  disabled={s.busy}
                >
                  <option value="driving-car">Automóvil</option>
                  <option value="cycling-regular">Bicicleta</option>
                  <option value="foot-walking">A pie</option>
                </select>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">Combustible</div>
                <select
                  className="w-full rounded-xl border border-black/10 px-3 py-2 bg-white"
                  value={s.prefs.defaultFuelType}
                  onChange={(e) => vm.saveFuel(e.target.value as FuelType)}
                  disabled={s.busy}
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
          </div>
        </div>
      </div>
    </div>
  );
}
