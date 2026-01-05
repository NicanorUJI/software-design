// src/components/SidePanel.tsx
import { useEffect } from 'react';
import type { Vehicle } from '../types/domain';
import type { TravelProfile } from '../types/route';
import { useViewModel } from '../viewModels/base/useViewModel';
import type { SidePanelViewModel } from '../viewModels/SidePanelViewModel';

type Props = {
  vm: SidePanelViewModel;

  open: boolean;
  onClose: () => void;

  currentOrigin: { label: string; position: { lat: number; lng: number } } | null;
  currentDestination: { label: string; position: { lat: number; lng: number } } | null;
  currentRoute: { distanceKm: number; durationMin: number; profile: TravelProfile } | null;

  vehicles: Vehicle[];
};

export default function SidePanel({
  vm,
  open,
  onClose,
  currentOrigin,
  currentDestination,
  currentRoute,
  vehicles,
}: Props) {
  const s = useViewModel(vm);

  useEffect(() => {
    vm.init();
  }, [vm]);

  useEffect(() => {
    vm.setContext({
      origin: currentOrigin,
      destination: currentDestination,
      route: currentRoute,
    });
  }, [vm, currentOrigin, currentDestination, currentRoute]);

  useEffect(() => {
    vm.setVehicles(vehicles ?? []);
  }, [vm, vehicles]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[800]">
      {/* overlay */}
      <button
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Close side panel overlay"
        type="button"
      />

      {/* panel */}
      <aside className="absolute top-4 left-4 bottom-4 w-[340px] max-w-[88vw] bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-black/10">
          <button
            className="h-9 w-9 rounded-xl hover:bg-black/5 flex items-center justify-center"
            onClick={onClose}
            aria-label="Close"
            title="Close"
            type="button"
          >
            ✕
          </button>

          <div className="font-semibold">FakeMaps</div>

          {s.section !== 'menu' ? (
            <button
              className="h-9 px-3 rounded-xl hover:bg-black/5 text-sm"
              onClick={() => vm.openMenu()}
              title="Back"
              type="button"
            >
              Back
            </button>
          ) : (
            <div className="w-12" />
          )}
        </header>

        <div className="flex-1 overflow-auto p-4">
          {s.loading && <div className="text-sm text-gray-600">Loading…</div>}

          {!s.loading && s.error && <div className="text-sm text-red-600">{s.error}</div>}

          {!s.loading && !s.error && s.section === 'menu' && (
            <div className="space-y-2">
              <MenuButton title="Lugares y rutas guardados" onClick={() => vm.openSaved()} />
              <MenuButton title="Mis vehículos" onClick={() => vm.openVehicles()} />
              <MenuButton title="Preferencias" onClick={() => vm.openPreferences()} />
              <MenuButton title="Perfil (próximamente)" onClick={() => {}} disabled />
            </div>
          )}

          {!s.loading && !s.error && s.section === 'saved' && (
            <div className="space-y-5">
              <SectionTitle title="Guardados" />

              <div className="space-y-2">
                <div className="text-sm font-medium">Quick save</div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 rounded-xl bg-black text-white text-sm disabled:opacity-40"
                    onClick={() => vm.saveOrigin()}
                    disabled={!vm.canSaveOrigin}
                    type="button"
                  >
                    Save A
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl bg-black text-white text-sm disabled:opacity-40"
                    onClick={() => vm.saveDestination()}
                    disabled={!vm.canSaveDestination}
                    type="button"
                  >
                    Save B
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl bg-black text-white text-sm disabled:opacity-40"
                    onClick={() => vm.saveRoute()}
                    disabled={!vm.canSaveRoute}
                    type="button"
                  >
                    Save route
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Ubicaciones guardadas</div>
                <div className="rounded-xl border border-black/10 overflow-hidden">
                  <ul className="max-h-40 overflow-auto divide-y divide-black/10">
                    {s.places.map((p) => (
                      <li key={p.id} className="px-3 py-2 flex items-center justify-between gap-2">
                        <div className="truncate text-sm">{p.label}</div>
                        <button
                          className="text-sm text-red-600 hover:underline"
                          onClick={() => vm.removePlace(p.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                    {s.places.length === 0 && (
                      <li className="px-3 py-2 text-xs text-gray-500">No hay ubicaciones guardadas.</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Rutas guardadas</div>
                <div className="rounded-xl border border-black/10 overflow-hidden">
                  <ul className="max-h-56 overflow-auto divide-y divide-black/10">
                    {s.routes.map((r) => (
                      <li key={r.id} className="px-3 py-2">
                        <div className="text-sm truncate">
                          <b>{r.origin.label}</b> → <b>{r.destination.label}</b>
                        </div>
                        <div className="text-xs text-gray-600">
                          {r.profile} · {r.distanceKm.toFixed(1)} km · {Math.round(r.durationMin)} min
                        </div>
                        <div className="pt-1 text-right">
                          <button
                            className="text-sm text-red-600 hover:underline"
                            onClick={() => vm.removeRoute(r.id)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                    {s.routes.length === 0 && (
                      <li className="px-3 py-2 text-xs text-gray-500">No hay rutas guardadas.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!s.loading && !s.error && s.section === 'vehicles' && (
            <div className="space-y-5">
              <SectionTitle title="Mis vehículos" />

              <div className="space-y-2">
                <div className="text-sm font-medium">Agregar vehículo</div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    className="border border-black/10 rounded-xl px-3 py-2 col-span-2 text-sm outline-none"
                    placeholder="Nombre (p.ej., Golf)"
                    value={s.vehName}
                    onChange={(e) => vm.setVehName(e.target.value)}
                  />
                  <select
                    className="border border-black/10 rounded-xl px-3 py-2 text-sm"
                    value={s.vehFuelType}
                    onChange={(e) => vm.setVehFuelType(e.target.value as any)}
                  >
                    <option value="gasoline95">95</option>
                    <option value="gasoline98">98</option>
                    <option value="diesel">Diesel</option>
                  </select>

                  <input
                    className="border border-black/10 rounded-xl px-3 py-2 col-span-2 text-sm outline-none"
                    placeholder="L/100km (p.ej., 6.5)"
                    value={s.vehLitersPer100}
                    onChange={(e) => vm.setVehLitersPer100(e.target.value)}
                    inputMode="decimal"
                  />
                  <button
                    className="rounded-xl bg-black text-white text-sm disabled:opacity-40"
                    onClick={() => vm.addVehicle()}
                    disabled={!vm.canAddVehicle}
                    type="button"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Vehículos guardados</div>
                <div className="rounded-xl border border-black/10 overflow-hidden">
                  <ul className="max-h-64 overflow-auto divide-y divide-black/10">
                    {s.vehicles.map((v) => (
                      <li key={v.id} className="px-3 py-2 flex items-center justify-between gap-2">
                        <div className="truncate text-sm">
                          <b>{v.name}</b> — {v.fuelType}, {v.litersPer100} L/100km
                        </div>
                        <button
                          className="text-sm text-red-600 hover:underline"
                          onClick={() => vm.removeVehicle(v.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                    {s.vehicles.length === 0 && (
                      <li className="px-3 py-2 text-xs text-gray-500">No hay vehículos guardados.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!s.loading && !s.error && s.section === 'preferences' && (
            <div className="space-y-5">
              <SectionTitle title="Preferencias" />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <label className="w-28 text-gray-700">Modo:</label>
                  <select
                    className="border border-black/10 rounded-xl px-3 py-2 flex-1"
                    value={s.prefs?.defaultProfile ?? 'driving-car'}
                    onChange={(e) => vm.setDefaultProfile(e.target.value as any)}
                  >
                    <option value="driving-car">Automóvil</option>
                    <option value="cycling-regular">Bicicleta</option>
                    <option value="foot-walking">A pie</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <label className="w-28 text-gray-700">Combustible:</label>
                  <select
                    className="border border-black/10 rounded-xl px-3 py-2 flex-1"
                    value={s.prefs?.defaultFuelType ?? 'gasoline95'}
                    onChange={(e) => vm.setDefaultFuelType(e.target.value as any)}
                  >
                    <option value="gasoline95">Gasolina 95</option>
                    <option value="gasoline98">Gasolina 98</option>
                    <option value="diesel">Diesel</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function MenuButton({
  title,
  onClick,
  disabled,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="w-full text-left px-4 py-3 rounded-2xl border border-black/10 hover:bg-black/5 disabled:opacity-50 disabled:hover:bg-transparent"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <div className="text-sm font-medium">{title}</div>
    </button>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <div className="text-base font-semibold">{title}</div>;
}
