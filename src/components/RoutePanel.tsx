// src/components/RoutePanel.tsx
import type { TravelProfile, RouteSummary } from '../types/route';
import { formatDuration, formatKm } from '../utils/format';

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
}

export default function RoutePanel({
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
}: Props) {
  return (
    <div className="bg-white/95 backdrop-blur shadow-xl rounded-2xl p-4 space-y-3">
      <div className="text-lg font-semibold">Route</div>

      <div className="text-sm text-gray-600">
        <div><span className="font-medium">From:</span> {originLabel || '—'}</div>
        <div><span className="font-medium">To:</span> {destinationLabel || '—'}</div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label className="font-medium">Mode:</label>
        <select
          className="border rounded-md px-2 py-1"
          value={profile}
          onChange={(e) => onProfileChange(e.target.value as TravelProfile)}
        >
          <option value="driving-car">Car</option>
          <option value="cycling-regular">Bike</option>
          <option value="foot-walking">Foot</option>
        </select>
      </div>

      <button
        className="w-full rounded-xl py-2 font-medium bg-black text-white disabled:opacity-40"
        onClick={onRouteClick}
        disabled={!canRoute || loading}
      >
        {loading ? 'Calculating…' : 'Calculate route'}
      </button>

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
          <div className="text-emerald-800 font-medium">Estimated fuel cost</div>
          <div className="text-emerald-900">{costText}</div>
        </div>
      )}
    </div>
  );
}
