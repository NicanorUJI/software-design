import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { LatLng, RouteResult } from '../types/route';

interface Props {
  origin: LatLng | null;
  destination: LatLng | null;
  route: RouteResult | null;
}

function FitToRoute({ route }: { route: RouteResult | null }) {
  const map = useMap();
  useEffect(() => {
    if (!route) return;
    if (route.geometry.points.length < 2) return;
    const bounds = L.latLngBounds(route.geometry.points.map(p => L.latLng(p.lat, p.lng))).pad(0.25);
    map.fitBounds(bounds, { animate: true });
  }, [route, map]);
  return null;
}

export default function MapView({ origin, destination, route }: Props) {
  const center = useMemo(() => ({ lat: 39.98, lng: -0.05 }), []);

  return (
    <MapContainer center={center} zoom={12} className='h-full w-full'>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {origin && (
        <Marker position={[origin.lat, origin.lng]}>
          <Popup>Origin</Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lng]}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {route && (
        <>
          <Polyline positions={route.geometry.points.map(p => [p.lat, p.lng]) as [number, number][]} />
          <FitToRoute route={route} />
        </>
      )}
    </MapContainer>
  );
}