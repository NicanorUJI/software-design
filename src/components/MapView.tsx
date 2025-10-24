import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = { center: LatLngExpression; zoom?: number };

function Centerer({ center, zoom = 13 }: { center: LatLngExpression; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.6 });
  }, [center, zoom, map]);
  return null;
}

export default function MapView({ center, zoom = 13 }: Props) {
  return (
    <div style={{ height: "100vh", width: "100%", position: "relative", zIndex: 0 }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%", position: "relative", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Centerer center={center} zoom={zoom} />
      </MapContainer>
    </div>
  );
}
