// src/components/RoutePanel.tsx
import type { TravelProfile, RouteSummary } from '../types/route';
import { formatDuration, formatKm } from '../utils/format';
import type { Vehicle, FuelType } from '../types/domain';

interface Props {
  profile: TravelProfile;
  onProfileChange: (p: TravelProfile) => void;

  canRoute: boolean;
  loading: boolean;
  error: string | null;

  onRouteClick: () => void;
  originLabel: string;
  destinationLabel: string;

  summary: RouteSummary | null;
  costText?: string | null;

  vehicles?: Vehicle[];
  selectedVehicleId?: string | null;
  onVehicleChange?: (id: string | null) => void;

  fuelType?: FuelType;
  onFuelTypeChange?: (t: FuelType) => void;

  onClose?: () => void;
  showCalculateButton?: boolean;
}

export default function RoutePanel(props: Props) {
  const {
    profile,
    onProfileChange,
    canRoute,
    loading,
    error,
    onRouteClick,
    originLabel,
    destinationLabel,
    summary,
    costText,
    vehicles,
    selectedVehicleId,
    onVehicleChange,
    fuelType,
    onFuelTypeChange,
    onClose,
    showCalculateButton = true,
  } = props;

  const costTitle = profile === 'driving-car' ? 'Estimated fuel cost' : 'Estimated energy';

  return (
    <div className="bg-white/95 backdrop-blur shadow-xl rounded-2xl p-4 space-y-3 border border-black/5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Route</div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
            aria-label="close route panel"
            title="Close"
          >
            X
          </button>
        )}
      </div>

      <div className="text-sm text-gray-600">
        <div>
          <span className="font-medium">From:</span> {originLabel || '—'}
        </div>
        <div>
          <span className="font-medium">To:</span> {destinationLabel || '—'}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label className="font-medium">Mode:</label>
        <select
          className="border rounded-md px-2 py-1 bg-white"
          value={profile}
          onChange={(e) => onProfileChange(e.target.value as TravelProfile)}
        >
          <option value="driving-car">Car</option>
          <option value="cycling-regular">Bike</option>
          <option value="foot-walking">Foot</option>
        </select>
      </div>

      {profile === 'driving-car' && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <label className="font-medium w-20">Vehicle:</label>
            <select
              className="border rounded-md px-2 py-1 flex-1 bg-white"
              value={selectedVehicleId ?? ''}
              onChange={(e) => onVehicleChange?.(e.target.value ? e.target.value : null)}
            >
              <option value="">No vehicle (avg consumption)</option>
              {vehicles?.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.litersPer100} L/100km)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-medium w-20">Fuel:</label>
            <select
              className="border rounded-md px-2 py-1 flex-1 bg-white"
              value={fuelType}
              onChange={(e) => onFuelTypeChange?.(e.target.value as FuelType)}
            >
              <option value="gasoline95">Gasoline 95</option>
              <option value="gasoline98">Gasoline 98</option>
              <option value="diesel">Diesel</option>
            </select>
          </div>
        </div>
      )}

      {showCalculateButton && (
        <button
          className="w-full rounded-xl py-2 font-medium bg-black text-white disabled:opacity-40"
          onClick={onRouteClick}
          disabled={!canRoute || loading}
          type="button"
        >
          {loading ? 'Calculating…' : 'Calculate route'}
        </button>
      )}

      {error && <div className="text-red-600 text-sm">{error}</div>}

      {summary && !error && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-gray-100 p-2">
            <div className="text-gray-500">Distance</div>
            <div className="text-base font-semibold">{formatKm(summary.distanceKm)}</div>
          </div>
          <div className="rounded-xl bg-gray-100 p-2">
            <div className="text-gray-500">Duration</div>
            <div className="text-base font-semibold">{formatDuration(summary.durationMin)}</div>
          </div>
        </div>
      )}

      {summary && costText && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-sm">
          <div className="text-emerald-800 font-medium">{costTitle}</div>
          <div className="text-emerald-900">{costText}</div>
        </div>
      )}
    </div>
  );
}
