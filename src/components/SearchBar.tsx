import { useEffect, useMemo, useRef, useState } from 'react';
import { geocodeSearch } from '../services/ors';
import type { PlaceSuggestion } from '../types/route';

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
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      const r = await geocodeSearch(query.trim());
      setResults(r);
      setOpen(true);
    }, 200);
    return () => clearTimeout(id);
  }, [query]);

  const placeholder = useMemo(() => (mode === 'A' ? 'Search origin (A)…' : 'Search destination (B)…'), [mode]);

  const pick = (p: PlaceSuggestion) => {
    if (mode === 'A') onSelectA(p); else onSelectB(p);
    setQuery('');
    setResults([]);
    setOpen(false);
    // After picking A, guide the user to pick B next
    if (mode === 'A') setMode('B');
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-1/2 -translate-x-1/2 w-[520px] max-w-[92vw] z-[500]">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-2 flex items-center gap-2">
        <button
          className={`px-3 py-1 rounded-xl text-sm border ${mode === 'A' ? 'bg-black text-white' : ''}`}
          onClick={() => setMode('A')}
          title="Set next selection as Origin (A)"
        >A</button>
        <button
          className={`px-3 py-1 rounded-xl text-sm border ${mode === 'B' ? 'bg-black text-white' : ''}`}
          onClick={() => setMode('B')}
          title="Set next selection as Destination (B)"
        >B</button>
        <input
          className="flex-1 px-3 py-2 rounded-xl border outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
        />
        <div className="text-xs text-gray-500 pr-2 select-none">
          {originLabel ? `A: ${originLabel}` : 'A: —'}
          {' '}
          {destinationLabel ? `· B: ${destinationLabel}` : '· B: —'}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="mt-2 bg-white rounded-2xl shadow-xl overflow-hidden border">
          {results.map(r => (
            <button
              key={r.id}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
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