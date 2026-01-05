import { useEffect } from 'react';
import type { Vehicle } from '../types/domain';
import type { TravelProfile } from '../types/route';
import { useViewModel } from '../viewModels/base/useViewModel';
import type { SidePanelViewModel } from '../viewModels/SidePanelViewModel';

type Props = {
  vm: SidePanelViewModel;

  open: boolean;
  onClose: () => void;

  // context desde el trip VM
  currentOrigin: { label: string; position: { lat: number; lng: number } } | null;
  currentDestination: { label: string; position: { lat: number; lng: number } } | null;
  currentRoute: { distanceKm: number; durationMin: number; profile: TravelProfile } | null;

  vehicles: Vehicle[];
  onGoProfile: () => void;
};

export default function SidePanel({
  vm,
  open,
  onClose,
  currentOrigin,
  currentDestination,
  currentRoute,
  vehicles,
  onGoProfile,
}: Props) {
  const s = useViewModel(vm);

  useEffect(() => {
    vm.init();
  }, [vm]);

  // cuando se abre, vuelve al menú (como Figma)
  useEffect(() => {
    if (open) vm.openMenu();
  }, [open, vm]);

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

  const headerTitle =
    s.section === 'menu'
      ? 'Menu'
      : s.section === 'saved'
      ? 'Lugares y rutas guardados'
      : s.section === 'vehicles'
      ? 'Mis vehículos'
      : 'Preferencias';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <aside className="fixed top-4 left-4 z-50 w-[340px] max-w-[92vw]">
        <div
          className="bg-white/95 backdrop-blur shadow-xl rounded-2xl border border-black/5 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
            <div className="flex items-center gap-2">
              {s.section !== 'menu' && (
                <button
                  type="button"
                  onClick={() => vm.openMenu()}
                  className="h-9 w-9 rounded-full hover:bg-black/5 flex items-center justify-center"
                  aria-label="back"
                  title="Back"
                >
                  ←
                </button>
              )}
              <div className="text-sm font-semibold">{headerTitle}</div>
            </div>

            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full hover:bg-black/5 flex items-center justify-center"
              aria-label="close"
              type="button"
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="p-3">
            {/* Loading/Error */}
            {s.loading && <div className="text-sm text-gray-600">Loading…</div>}
            {!s.loading && s.error && <div className="text-sm text-red-600">{s.error}</div>}

            {/* MENU (3 opciones como Figma) */}
            {!s.loading && !s.error && s.section === 'menu' && (
              <div className="space-y-2">
                <MenuItem
                  label="Lugares y rutas guardados"
                  onClick={() => vm.openSaved()}
                  icon={<span className="text-blue-600">📍</span>}
                />
                <MenuItem
                  label="Mis vehículos"
                  onClick={() => vm.openVehicles()}
                  icon={<span className="text-blue-600">🚗</span>}
                />
                <MenuItem
                  label="Perfil"
                  onClick={() => {
                    onClose();
                    onGoProfile();
                  }}
                  icon={<span className="text-blue-600">👤</span>}
                />
              </div>
            )}

            {/* SAVED */}
            {!s.loading && !s.error && s.section === 'saved' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-black/5 bg-white p-3">
                  <div className="text-sm font-semibold mb-2">Guardar rápido</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-40"
                      onClick={() => vm.saveOrigin()}
                      disabled={!vm.canSaveOrigin}
                      type="button"
                    >
                      Guardar A
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-40"
                      onClick={() => vm.saveDestination()}
                      disabled={!vm.canSaveDestination}
                      type="button"
                    >
                      Guardar B
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-40"
                      onClick={() => vm.saveRoute()}
                      disabled={!vm.canSaveRoute}
                      type="button"
                    >
                      Guardar ruta
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-white p-3">
                  <div className="text-sm font-semibold mb-2">Ubicaciones guardadas</div>
                  <ul className="max-h-40 overflow-auto divide-y">
                    {s.places.map((p) => (
                      <li key={p.id} className="py-2 text-sm flex items-center justify-between gap-2">
                        <div className="truncate">{p.label}</div>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => vm.removePlace(p.id)}
                          type="button"
                        >
                          Borrar
                        </button>
                      </li>
                    ))}
                    {s.places.length === 0 && (
                      <div className="text-xs text-gray-500 py-1">No hay ubicaciones guardadas.</div>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl border border-black/5 bg-white p-3">
                  <div className="text-sm font-semibold mb-2">Rutas guardadas</div>
                  <ul className="max-h-44 overflow-auto divide-y">
                    {s.routes.map((r) => (
                      <li key={r.id} className="py-2 text-sm">
                        <div className="truncate">
                          <b>{r.origin.label}</b> → <b>{r.destination.label}</b>
                        </div>
                        <div className="text-gray-600 text-xs">
                          {r.profile} · {r.distanceKm.toFixed(1)} km · {Math.round(r.durationMin)} min
                        </div>
                        <div className="text-right mt-1">
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => vm.removeRoute(r.id)}
                            type="button"
                          >
                            Borrar
                          </button>
                        </div>
                      </li>
                    ))}
                    {s.routes.length === 0 && (
                      <div className="text-xs text-gray-500 py-1">No hay rutas guardadas.</div>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* VEHICLES */}
            {!s.loading && !s.error && s.section === 'vehicles' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-black/5 bg-white p-3">
                  <div className="text-sm font-semibold mb-2">Vehículos guardados</div>

                  <ul className="max-h-40 overflow-auto divide-y">
                    {s.vehicles.map((v) => (
                      <li key={v.id} className="py-2 text-sm flex items-center justify-between gap-2">
                        <div className="truncate">
                          <b>{v.name}</b> — {v.fuelType}, {v.litersPer100} L/100km
                        </div>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => vm.removeVehicle(v.id)}
                          type="button"
                        >
                          Borrar
                        </button>
                      </li>
                    ))}
                    {s.vehicles.length === 0 && (
                      <div className="text-xs text-gray-500 py-1">No hay vehículos guardados.</div>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl border border-black/5 bg-white text-gray-900 p-3">
                  <div className="text-sm font-semibold mb-2">Agregar vehículo</div>

                  <div className="space-y-2">
                    <input
                      className="w-full border border-black rounded-xl px-3 py-2 text-sm text-gray-900"
                      placeholder="Nombre"
                      value={s.vehName}
                      onChange={(e) => vm.setVehName(e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="w-full border border-black rounded-xl px-3 py-2 text-sm text-gray-900"
                        value={s.vehFuelType}
                        onChange={(e) => vm.setVehFuelType(e.target.value as any)}
                      >
                        <option value="gasoline95">Gasolina 95</option>
                        <option value="gasoline98">Gasolina 98</option>
                        <option value="diesel">Diésel</option>
                      </select>

                      <input
                        className="w-full border border-black rounded-xl px-3 py-2 text-sm text-gray-900"
                        placeholder="L/100km (ej: 6.5)"
                        value={s.vehLitersPer100}
                        onChange={(e) => vm.setVehLitersPer100(e.target.value)}
                        inputMode="decimal"
                      />
                    </div>

                    <button
                      className="w-full rounded-xl py-2 bg-white text-blue-700 font-semibold disabled:opacity-60"
                      onClick={() => vm.addVehicle()}
                      disabled={!vm.canAddVehicle}
                      type="button"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function MenuItem({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-black/5 transition text-left"
    >
      <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{label}</div>
      </div>
      <div className="text-gray-400">›</div>
    </button>
  );
}
