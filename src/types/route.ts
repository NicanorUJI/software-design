export type TravelProfile = 'driving-car' | 'cycling-regular' | 'foot-walking';


export interface LatLng {
lat: number;
lng: number;
}


export interface PlaceSuggestion {
id: string;
label: string;
position: LatLng; // convenience for map rendering
}


export interface RouteSummary {
distanceKm: number; // kilometers
durationMin: number; // minutes
}


export interface RouteGeometry {
// Leaflet-friendly polyline points
points: LatLng[];
}


export interface RouteResult {
summary: RouteSummary;
geometry: RouteGeometry;
bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}