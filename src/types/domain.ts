// src/types/domain.ts
import type { LatLng, TravelProfile } from './route';

export type Id = string;

export interface Place {
  id: Id;                 // Firestore document id
  label: string;
  position: LatLng;
  createdAt: number;      // ms epoch
}

export type FuelType = 'gasoline95' | 'gasoline98' | 'diesel';

export interface Vehicle {
  id: Id;
  name: string;           // e.g., "My Car"
  fuelType: FuelType;
  litersPer100: number;   // L/100km
  createdAt: number;
}

export interface SavedRoute {
  id: Id;
  origin: { label: string; position: LatLng };
  destination: { label: string; position: LatLng };
  profile: TravelProfile;
  distanceKm: number;
  durationMin: number;
  createdAt: number;
}

export interface Preferences {
  id: 'default';
  defaultProfile: TravelProfile;
  defaultFuelType: FuelType;
  // optionally link a default vehicle id in futuro
}
