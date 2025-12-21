// src/services/repos/routesRepo.ts
import { addDoc, col, deleteDoc, getDocs, limit, orderBy, query, ref } from '../firestoreHelpers';
import type { SavedRoute } from '../../types/domain';

const COLLECTION = 'routes';

export async function addRoute(r: Omit<SavedRoute, 'id' | 'createdAt'>): Promise<SavedRoute> {
  const createdAt = Date.now();
  const docRef = await addDoc(col(COLLECTION), { ...r, createdAt });
  return { ...r, id: docRef.id, createdAt };
}

export async function listRoutes(max: number = 50): Promise<SavedRoute[]> {
  const q = query(col(COLLECTION), orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SavedRoute[];
}

export async function removeRoute(id: string): Promise<void> {
  await deleteDoc(ref(COLLECTION, id));
}
