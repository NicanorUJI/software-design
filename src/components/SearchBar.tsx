// src/components/SearchBar.tsx
import { useEffect, useRef } from 'react';
import { useViewModel } from '../viewModels/base/useViewModel';
import type { SearchBarViewModel } from '../viewModels/SearchBarViewModel';

interface Props {
  vm: SearchBarViewModel;

  originLabel?: string;
  destinationLabel?: string;

  onCalculateRoute: () => void;
  canCalculateRoute: boolean;
  loading: boolean;

  // error del cálculo de ruta
  error?: string | null;
  resetKey?: number;
}

export default function SearchBar({
  vm,
  originLabel,
  destinationLabel,
  onCalculateRoute,
  canCalculateRoute,
  loading,
  error,
  resetKey,
}: Props) {
  const s = useViewModel(vm);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset externo
  useEffect(() => {
    if (resetKey === undefined) return;
    vm.reset();
  }, [resetKey, vm]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) vm.closeDropdown();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [vm]);
  const uiError = error ?? s.error;

  return (
    <div ref={containerRef} className="w-[640px] max-w-[92vw]">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-black/5 overflow-hidden">
        {/* Inputs */}
        <div className="flex items-stretch">
          {/* Inputs */}
          <div className="flex-1 p-2">
            <div className="rounded-xl bg-black/5 p-2 space-y-2">
              {/* Origin */}
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                </div>

                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Start location"
                  value={s.activeField === 'origin' && s.originQuery ? s.originQuery : (originLabel ?? s.originQuery)}
                  onFocus={() => vm.setActiveField('origin')}
                  onChange={(e) => vm.setOriginQuery(e.target.value)}
                />
              </div>

              <div className="h-px bg-black/10" />

              {/* Destination */}
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 text-white text-xl flex items-center justify-center">
                  📍
                </div>

                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Destination"
                  value={s.activeField === 'destination' && s.destinationQuery ? s.destinationQuery : (destinationLabel ?? s.destinationQuery)}
                  onFocus={() => vm.setActiveField('destination')}
                  onChange={(e) => vm.setDestinationQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2 flex flex-col gap-2">
            {/* Calculate */}
            <button
              type="button"
              onClick={onCalculateRoute}
              disabled={!canCalculateRoute || loading}
              className="h-10 w-10 rounded-xl bg-blue-600 text-white disabled:opacity-40 flex items-center justify-center"
              title="Calculate route"
              aria-label="calculate route"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span className="text-lg leading-none">➜</span>
              )}
            </button>
          </div>
        </div>

        {/* Dropdown */}
        {s.open && s.suggestions.length > 0 && (
          <div className="border-t border-black/5">
            {s.suggestions.map((r) => (
              <button
                key={`${r.label}-${r.position.lat}-${r.position.lng}`}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                onClick={() => vm.selectSuggestion(r)}
                type="button"
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {s.searching && (
          <div className="px-3 pb-2 text-xs text-gray-500">
            Searching…
          </div>
        )}
      </div>

      {/* Error UI */}
      {uiError && (
        <div className="mt-2 bg-white/95 rounded-2xl shadow-xl border border-red-200 px-3 py-2 text-sm text-red-700">
          {uiError}
        </div>
      )}
    </div>
  );
}
