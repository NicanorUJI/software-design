// src/services/repos/placesRepo.ts
import { addDoc, col, deleteDoc, getDocs, orderBy, query, ref } from '../firestoreHelpers';
import type { Place } from '../../types/domain';

const COLLECTION = 'places';

export async function addPlace(p: Omit<Place, 'id' | 'createdAt'>): Promise<Place> {
  const docRef = await addDoc(col(COLLECTION), {
    label: p.label,
    position: p.position,
    createdAt: Date.now(),
  });
  return { ...p, id: docRef.id, createdAt: Date.now() };
}

export async function listPlaces(): Promise<Place[]> {
  const q = query(col(COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Place[];
}

export async function removePlace(id: string): Promise<void> {
  await deleteDoc(ref(COLLECTION, id));
}
