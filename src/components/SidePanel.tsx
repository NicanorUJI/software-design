import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Place, SavedRoute, Preferences, FuelType, Vehicle } from '../types/domain';
import { addPlace, listPlaces, removePlace } from '../services/repos/placesRepo';
import { addRoute, listRoutes, removeRoute } from '../services/repos/routesRepo';
import { getPreferences, setPreferences, updatePreferences } from '../services/repos/preferencesRepo';
type PanelView = 'menu' | 'saved' | 'vehicles';

interface Props {
  open: boolean;
  onClose: () => void;

  currentOrigin?: { label: string; position: { lat: number; lng: number } } | null;
  currentDestination?: { label: string; position: { lat: number; lng: number } } | null;
  currentRoute?: {
    distanceKm: number;
    durationMin: number;
    profile: 'driving-car' | 'cycling-regular' | 'foot-walking';
  } | null;

  onApplyPreferences?: (p: Preferences) => void;

  vehicles?: Vehicle[];
  onAddVehicle?: (v: Omit<Vehicle, 'id' | 'createdAt'>) => Promise<void>;
  onRemoveVehicle?: (id: string) => Promise<void>;
}

export default function SidePanel({
  open,
  onClose,
  currentOrigin,
  currentDestination,
  currentRoute,
  onApplyPreferences,
  vehicles,
  onAddVehicle,
  onRemoveVehicle,
}: Props) {
  const navigate = useNavigate();

  const [view, setView] = useState<PanelView>('menu');

  const [places, setPlaces] = useState<Place[]>([]);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);

  // Vehicles form state
  const [vehName, setVehName] = useState('');
  const [vehLitersPer100, setVehLitersPer100] = useState('6.5');
  const [vehFuelType, setVehFuelType] = useState<FuelType>('gasoline95');
  const vehLitersParsed = useMemo(() => Number(vehLitersPer100), [vehLitersPer100]);

  // Cada vez que se abre, volvemos al menú (como en Figma)
  useEffect(() => {
    if (open) setView('menu');
  }, [open]);

  // Cargar data (una vez)
  useEffect(() => {
    (async () => {
      try {
        const [p, r, pr] = await Promise.all([listPlaces(), listRoutes(), getPreferences()]);
        setPlaces(p);
        setRoutes(r);
        setPrefs(pr);
        if (pr) setVehFuelType(pr.defaultFuelType);
      } catch {
        // no-op
      }
    })();
  }, []);

  // Acciones de guardado rápido (para Figma “saved” view)
  const saveCurrentOrigin = async () => {
    if (!currentOrigin) return;
    const p = await addPlace({ label: currentOrigin.label, position: currentOrigin.position });
    setPlaces((prev) => [p, ...prev]);
  };

  const saveCurrentDestination = async () => {
    if (!currentDestination) return;
    const p = await addPlace({ label: currentDestination.label, position: currentDestination.position });
    setPlaces((prev) => [p, ...prev]);
  };

  const saveCurrentRoute = async () => {
    if (!currentOrigin || !currentDestination || !currentRoute) return;

    const r = await addRoute({
      origin: { label: currentOrigin.label, position: currentOrigin.position },
      destination: { label: currentDestination.label, position: currentDestination.position },
      profile: currentRoute.profile,
      routeType: 'fastest',
      distanceKm: currentRoute.distanceKm,
      durationMin: currentRoute.durationMin,
    });

    setRoutes((prev) => [r, ...prev]);
  };

  const removePlaceItem = async (id: string) => {
    await removePlace(id);
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  const removeRouteItem = async (id: string) => {
    await removeRoute(id);
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  };

  // Si tus preferencias NO van en el panel, puedes borrar esta sección y dejarlo todo para /profile
  const setDefaultProfile = async (profile: Preferences['defaultProfile']) => {
    const next: Preferences = {
      id: 'default',
      defaultProfile: profile,
      defaultFuelType: prefs?.defaultFuelType ?? 'gasoline95',
    };
    if (prefs) await updatePreferences({ defaultProfile: profile });
    else await setPreferences(next);
    setPrefs(next);
    onApplyPreferences?.(next);
  };

  const setDefaultFuelType = async (fuelType: FuelType) => {
    const next: Preferences = {
      id: 'default',
      defaultProfile: prefs?.defaultProfile ?? 'driving-car',
      defaultFuelType: fuelType,
    };
    if (prefs) await updatePreferences({ defaultFuelType: fuelType });
    else await setPreferences(next);
    setPrefs(next);
    onApplyPreferences?.(next);
    setVehFuelType(fuelType);
  };

  const handleAddVehicle = async () => {
    const name = vehName.trim();
    if (!name) return;
    if (!Number.isFinite(vehLitersParsed) || vehLitersParsed <= 0) return;
    if (!onAddVehicle) return;

    await onAddVehicle({
      name,
      fuelType: vehFuelType,
      litersPer100: vehLitersParsed,
    });

    setVehName('');
    setVehLitersPer100('6.5');
  };

  const goProfile = () => {
    onClose();
    navigate('/profile');
  };

  const Header = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between px-3 py-2 border-b border-black/5">
      <div className="flex items-center gap-2">
        {view !== 'menu' && (
          <button
            type="button"
            onClick={() => setView('menu')}
            className="h-9 w-9 rounded-full hover:bg-black/5 flex items-center justify-center"
            aria-label="back"
            title="Back"
          >
            ←
          </button>
        )}
        <div className="text-sm font-semibold">{title}</div>
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
  );

  const MenuItem = ({
    label,
    sublabel,
    onClick,
    icon,
  }: {
    label: string;
    sublabel?: string;
    onClick: () => void;
    icon: React.ReactNode;
  }) => (
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
        {sublabel && <div className="text-xs text-gray-500">{sublabel}</div>}
      </div>
      <div className="text-gray-400">›</div>
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden="true" />}

      {/* Panel */}
      <aside
        className={[
          'fixed top-4 left-4 z-50 w-[340px] max-w-[92vw]',
          'transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-[120%] pointer-events-none',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="bg-white/95 backdrop-blur shadow-xl rounded-2xl border border-black/5 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER (cambia según vista) */}
          {view === 'menu' && <Header title="Menu" />}
          {view === 'saved' && <Header title="Saved" />}
          {view === 'vehicles' && <Header title="My vehicles" />}

          {/* BODY */}
          <div className="p-3">
            {/* MENU view */}
            {view === 'menu' && (
              <div className="space-y-2">
                <MenuItem
                  label="Lugares y rutas guardados"
                  sublabel="Ver, borrar y guardar rutas/lugares"
                  onClick={() => setView('saved')}
                  icon={<span className="text-blue-600">📍</span>}
                />
                <MenuItem
                  label="Mis vehículos"
                  sublabel="Gestiona tus vehículos"
                  onClick={() => setView('vehicles')}
                  icon={<span className="text-blue-600">🚗</span>}
                />
                <MenuItem
                  label="Perfil"
                  sublabel="Preferencias, logout, borrar cuenta"
                  onClick={goProfile}
                  icon={<span className="text-blue-600">👤</span>}
                />

                {/* (Opcional) mini bloque de preferencias rápidas, si lo quieres en menu */}
                <div className="mt-3 rounded-2xl border border-black/5 bg-white p-3">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Preferencias rápidas</div>

                  <div className="flex items-center gap-2 text-sm mb-2">
                    <label className="w-28 text-gray-600">Modo:</label>
                    <select
                      className="border rounded-md px-2 py-1 flex-1 bg-white"
                      value={prefs?.defaultProfile ?? 'driving-car'}
                      onChange={(e) => setDefaultProfile(e.target.value as Preferences['defaultProfile'])}
                    >
                      <option value="driving-car">Automóvil</option>
                      <option value="cycling-regular">Bicicleta</option>
                      <option value="foot-walking">A pie</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <label className="w-28 text-gray-600">Combustible:</label>
                    <select
                      className="border rounded-md px-2 py-1 flex-1 bg-white"
                      value={prefs?.defaultFuelType ?? 'gasoline95'}
                      onChange={(e) => setDefaultFuelType(e.target.value as FuelType)}
                    >
                      <option value="gasoline95">Gasolina 95</option>
                      <option value="gasoline98">Gasolina 98</option>
                      <option value="diesel">Diésel</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* SAVED view */}
            {view === 'saved' && (
              <div className="space-y-4">
                {/* Quick save actions (Figma-ish) */}
                <div className="rounded-2xl border border-black/5 bg-white p-3">
                  <div className="text-sm font-semibold mb-2">Guardar rápido</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-40"
                      onClick={saveCurrentOrigin}
                      disabled={!currentOrigin}
                      type="button"
                    >
                      Guardar A
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-40"
                      onClick={saveCurrentDestination}
                      disabled={!currentDestination}
                      type="button"
                    >
                      Guardar B
                    </button>
                    <button
                      className="px-3 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-40"
                      onClick={saveCurrentRoute}
                      disabled={!currentRoute}
                      type="button"
                    >
                      Guardar ruta
                    </button>
                  </div>
                </div>

                {/* Places */}
                <div className="rounded-2xl border border-black/5 bg-white p-3">
                  <div className="text-sm font-semibold mb-2">Ubicaciones guardadas</div>
                  <ul className="max-h-40 overflow-auto divide-y">
                    {places.map((p) => (
                      <li key={p.id} className="py-2 text-sm flex items-center justify-between gap-2">
                        <div className="truncate">{p.label}</div>
                        <button className="text-red-600 hover:underline" onClick={() => removePlaceItem(p.id)} type="button">
                          Borrar
                        </button>
                      </li>
                    ))}
                    {places.length === 0 && <div className="text-xs text-gray-500 py-1">No hay ubicaciones guardadas.</div>}
                  </ul>
                </div>

                {/* Routes */}
                <div className="rounded-2xl border border-black/5 bg-white p-3">
                  <div className="text-sm font-semibold mb-2">Rutas guardadas</div>
                  <ul className="max-h-44 overflow-auto divide-y">
                    {routes.map((r) => (
                      <li key={r.id} className="py-2 text-sm">
                        <div className="truncate">
                          <b>{r.origin.label}</b> → <b>{r.destination.label}</b>
                        </div>
                        <div className="text-gray-600 text-xs">
                          {r.profile} · {r.distanceKm.toFixed(1)} km · {Math.round(r.durationMin)} min
                        </div>
                        <div className="text-right mt-1">
                          <button className="text-red-600 hover:underline" onClick={() => removeRouteItem(r.id)} type="button">
                            Borrar
                          </button>
                        </div>
                      </li>
                    ))}
                    {routes.length === 0 && <div className="text-xs text-gray-500 py-1">No hay rutas guardadas.</div>}
                  </ul>
                </div>
              </div>
            )}

            {/* VEHICLES view */}
            {view === 'vehicles' && (
              <div className="space-y-4">
                {/* List */}
                <div className="rounded-2xl border border-black/5 bg-white p-3">
                  <div className="text-sm font-semibold mb-2">Vehículos guardados</div>

                  <ul className="max-h-40 overflow-auto divide-y">
                    {vehicles?.map((v) => (
                      <li key={v.id} className="py-2 text-sm flex items-center justify-between gap-2">
                        <div className="truncate">
                          <b>{v.name}</b> — {v.fuelType}, {v.litersPer100} L/100km
                        </div>
                        <button
                          className="text-red-600 hover:underline"
                          onClick={() => onRemoveVehicle?.(v.id)}
                          type="button"
                        >
                          Borrar
                        </button>
                      </li>
                    ))}
                    {(vehicles?.length ?? 0) === 0 && <div className="text-xs text-gray-500 py-1">No hay vehículos guardados.</div>}
                  </ul>
                </div>

                {/* Add vehicle */}
                <div className="rounded-2xl bg-blue-600 text-white p-3">
                  <div className="text-sm font-semibold mb-2">Agregar vehículo</div>

                  <div className="space-y-2">
                    <input
                      className="w-full rounded-xl px-3 py-2 text-sm text-white-900"
                      placeholder="Nombre"
                      value={vehName}
                      onChange={(e) => setVehName(e.target.value)}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        className="w-full rounded-xl px-3 py-2 text-sm text-white-900"
                        value={vehFuelType}
                        onChange={(e) => setVehFuelType(e.target.value as FuelType)}
                      >
                        <option value="gasoline95">Gasolina 95</option>
                        <option value="gasoline98">Gasolina 98</option>
                        <option value="diesel">Diésel</option>
                      </select>

                      <input
                        className="w-full rounded-xl px-3 py-2 text-sm text-white-900"
                        placeholder="L/100km (ej: 6.5)"
                        value={vehLitersPer100}
                        onChange={(e) => setVehLitersPer100(e.target.value)}
                        inputMode="decimal"
                      />
                    </div>

                    <button
                      className="w-full rounded-xl py-2 bg-white text-blue-700 font-semibold disabled:opacity-60"
                      onClick={handleAddVehicle}
                      disabled={
                        !vehName.trim() ||
                        !Number.isFinite(vehLitersParsed) ||
                        vehLitersParsed <= 0 ||
                        !onAddVehicle
                      }
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
