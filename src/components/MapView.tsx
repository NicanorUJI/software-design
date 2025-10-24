import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView() {
  return (
    <MapContainer
      center={[40.4168, -3.7038]} // Madrid por defecto
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      `<TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />`
    </MapContainer>
  );
}
