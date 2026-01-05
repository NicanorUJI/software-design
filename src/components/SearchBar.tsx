import { useEffect, useMemo, useRef, useState } from 'react';
import type { PlaceSuggestion } from '../types/route';
import { getRoutingService } from '../services/serviceRegistry';

type Mode = 'A' | 'B';

interface Props {
  onSelectA: (p: PlaceSuggestion) => void;
  onSelectB: (p: PlaceSuggestion) => void;
  originLabel?: string;
  destinationLabel?: string;
}

export default function SearchBar({ onSelectA, onSelectB, originLabel, destinationLabel }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('A');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    const id = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
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
  }, [query]);

  const placeholder = useMemo(
    () => (mode === 'A' ? 'Search origin (A)…' : 'Search destination (B)…'),
    [mode]
  );

  const pick = (p: PlaceSuggestion) => {
    if (mode === 'A') onSelectA(p);
    else onSelectB(p);

    setQuery('');
    setResults([]);
    setOpen(false);

    if (mode === 'A') setMode('B');
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-1/2 -translate-x-1/2 w-[520px] max-w-[92vw] z-[500]">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-black/5 p-2 flex items-center gap-2">
        <button
          className={`px-3 py-1 rounded-xl text-sm border border-black/10
           ${mode === 'A' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          onClick={() => setMode('A')}
          title="Set next selection as Origin (A)"
        >
          A
        </button>
        <button
          className={`px-3 py-1 rounded-xl text-sm border border-black/10
           ${mode === 'A' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          onClick={() => setMode('B')}
          title="Set next selection as Destination (B)"
        >
          B
        </button>

        <input
          className="flex-1 px-3 py-2 rounded-xl bg-black/5 outline-none border border-transparent focus:border-blue-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
        />

        <div className="text-xs text-gray-500 pr-2 select-none">
          {originLabel ? `A: ${originLabel}` : 'A: —'}{' '}
          {destinationLabel ? `· B: ${destinationLabel}` : '· B: —'}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="mt-2 bg-white/95 rounded-2xl shadow-xl overflow-hidden">
          {results.map((r) => (
            <button
              key={`${r.label}-${r.position.lat}-${r.position.lng}`}
              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
              onClick={() => pick(r)}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
