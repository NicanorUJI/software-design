import { useState } from "react";
import MapView from "../components/MapView";
import SearchBar from "../components/SearchBar";
import HamburgerMenu from "../components/HamburgerMenu";
import SidePanel from "../components/SidePanel";
import type { LatLngExpression } from "leaflet";
import type { PlaceSuggestion } from "../services/ors";

const DEFAULT_CENTER: LatLngExpression = [48.8566, 2.3522]; // París

export default function MapLayout() {
  const [center, setCenter] = useState<LatLngExpression>(DEFAULT_CENTER);
  const [open, setOpen] = useState(false);

  const handleSelect = (place: PlaceSuggestion) => {
    setCenter([place.coord.lat, place.coord.lon]);
  };

  return (
    <div style={{ position: "relative" }}>
      <MapView center={center} zoom={13} />

      {/* Overlay: top-left menu */}
      <div style={{ position: "absolute", top: 24, left: 24 }}>
        <HamburgerMenu onClick={() => setOpen(true)} />
      </div>

      {/* Overlay: top-center search */}
      <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)" }}>
        <SearchBar onSelect={handleSelect} />
      </div>

      {/* Side panel */}
      <SidePanel isOpen={open} onClose={() => setOpen(false)}>
        <h3 style={{ marginTop: 0 }}>Menu</h3>
        <ul style={{ paddingLeft: 18, lineHeight: 1.9 }}>
          <li>Lugares</li>
          <li>Vehículos</li>
          <li>Rutas</li>
          <li>Preferencias</li>
        </ul>
      </SidePanel>
    </div>
  );
}
