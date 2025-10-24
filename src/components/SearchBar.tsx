import React, { useEffect, useRef, useState } from "react";
import { geocodeSearch, type PlaceSuggestion } from "../services/ors";

type Props = {
  placeholder?: string;
  onSelect: (place: PlaceSuggestion) => void;
};

export default function SearchBar({ placeholder = "Search here", onSelect }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const debouncedQ = useDebounce(q, 300);

  useEffect(() => {
    let active = true;
    if (!debouncedQ) { setResults([]); setPage(1); return; }
    setLoading(true);
    geocodeSearch(debouncedQ, 5, 1)
      .then((r) => { if (active) { setResults(r); setPage(1); setOpen(true); } })
      .catch(console.error)
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [debouncedQ]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const loadMore = async () => {
    const next = page + 1;
    setLoading(true);
    try {
      const more = await geocodeSearch(debouncedQ, 5, next);
      setResults((r) => [...r, ...more]);
      setPage(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={boxRef} style={{ position: "relative", width: 520 }}>
      <div style={searchBoxStyle}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          placeholder={placeholder}
          style={inputStyle}
        />
        <button aria-label="search" style={iconBtnStyle}>🔍</button>
      </div>

      {open && results.length > 0 && (
        <div style={dropdownStyle}>
          {results.map((r) => (
            <button
              key={r.id}
              style={itemStyle}
              onClick={() => { onSelect(r); setOpen(false); }}
            >
              <span style={{ marginRight: 8 }}>📍</span>
              {r.label}
            </button>
          ))}
          <div style={{ padding: 12, textAlign: "center" }}>
            <button onClick={loadMore} disabled={loading} style={loadMoreBtn}>
              {loading ? "Loading..." : "Load more"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ——— inline styles mínimos (look similar al diseño) ———
const searchBoxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#fff",
  padding: "12px 14px",
  borderRadius: 12,
  boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
};
const inputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  outline: "none",
  fontSize: 16,
};
const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: 18,
};
const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  top: 56,
  left: 0,
  right: 0,
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
  overflow: "hidden",
};
const itemStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "14px 16px",
  border: "none",
  background: "white",
  cursor: "pointer",
  borderBottom: "1px solid #f0f0f0",
};
const loadMoreBtn: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 20,
  border: "none",
  background: "#2f6df6",
  color: "white",
  cursor: "pointer",
};
