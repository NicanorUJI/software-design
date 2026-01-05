import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlaceSuggestion } from '../types/route';
import { getRoutingService } from '../services/serviceRegistry';

type Field = 'origin' | 'destination';

interface Props {
  onSelectA: (p: PlaceSuggestion) => void;
  onSelectB: (p: PlaceSuggestion) => void;

  originLabel?: string;
  destinationLabel?: string;

  onCalculateRoute: () => void;
  canCalculateRoute: boolean;
  loading: boolean;
  error?: string | null;
  resetKey?: number;
}

export default function SearchBar({
  onSelectA,
  onSelectB,
  originLabel,
  destinationLabel,
  onCalculateRoute,
  canCalculateRoute,
  loading,
  error,
  resetKey,
}: Props) {
  const [originQuery, setOriginQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [activeField, setActiveField] = useState<Field>('origin');

  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOriginQuery('');
    setDestQuery('');
    setResults([]);
    setOpen(false);
    setActiveField('origin');
  }, [resetKey]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Debounce
  useEffect(() => {
    const q = (activeField === 'origin' ? originQuery : destQuery).trim();

    const id = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }

      try {
        const routing = getRoutingService();
        const r = await routing.geocodeSearch(q);
        setResults(r);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(false);
      }
    }, 200);

    return () => clearTimeout(id);
  }, [activeField, originQuery, destQuery]);

  const pick = (p: PlaceSuggestion) => {
    if (activeField === 'origin') {
      onSelectA(p);
      setOriginQuery('');
      // UX: saltar automáticamente al destino
      setActiveField('destination');
    } else {
      onSelectB(p);
      setDestQuery('');
    }

    setResults([]);
    setOpen(false);
  };

  const activePlaceholder = useMemo(() => {
    return activeField === 'origin' ? 'Start location' : 'Destination';
  }, [activeField]);

  return (
    <div
      ref={containerRef}
      className="w-[640px] max-w-[92vw]"
    >
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-black/5 overflow-hidden">
        {/* Row: inputs + actions */}
        <div className="flex items-stretch">
          {/* Inputs column */}
          <div className="flex-1 p-2">
            <div className="rounded-xl bg-black/5 p-2 space-y-2">
              {/* Origin */}
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-black text-white text-xs flex items-center justify-center">
                  A
                </div>

                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Start location"
                  value={activeField === 'origin' ? originQuery : (originLabel ?? '')}
                  onChange={(e) => {
                    setActiveField('origin');
                    setOriginQuery(e.target.value);
                  }}
                  onFocus={() => setActiveField('origin')}
                />
              </div>

              <div className="h-px bg-black/10" />

              {/* Destination */}
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-black text-white text-xs flex items-center justify-center">
                  B
                </div>

                <input
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Destination"
                  value={activeField === 'destination' ? destQuery : (destinationLabel ?? '')}
                  onChange={(e) => {
                    setActiveField('destination');
                    setDestQuery(e.target.value);
                  }}
                  onFocus={() => setActiveField('destination')}
                />
              </div>
            </div>
          </div>

          {/* Actions column */}
          <div className="p-2 flex flex-col gap-2">
            {/* Calculate */}
            <button
              type="button"
              onClick={onCalculateRoute}
              disabled={!canCalculateRoute || loading}
              className="h-10 w-10 rounded-xl bg-black text-white disabled:opacity-40 flex items-center justify-center"
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
        {open && results.length > 0 && (
          <div className="border-t border-black/5">
            {results.map((r) => (
              <button
                key={`${r.label}-${r.position.lat}-${r.position.lng}`}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                onClick={() => pick(r)}
                type="button"
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* Hint / error */}
        {(!open || results.length === 0) && (originQuery.trim().length >= 2 || destQuery.trim().length >= 2) && (
          <div className="px-3 pb-2 text-xs text-gray-500">
            {open ? 'No results.' : `Searching… (${activePlaceholder})`}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 bg-white/95 rounded-2xl shadow-xl border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}