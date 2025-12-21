// src/services/repos/vehiclesRepo.ts
import { addDoc, col, deleteDoc, getDocs, orderBy, query, ref, updateDoc } from '../firestoreHelpers';
import type { Vehicle } from '../../types/domain';

const COLLECTION = 'vehicles';

export async function addVehicle(v: Omit<Vehicle, 'id' | 'createdAt'>): Promise<Vehicle> {
  const createdAt = Date.now();
  const docRef = await addDoc(col(COLLECTION), { ...v, createdAt });
  return { ...v, id: docRef.id, createdAt };
}

export async function listVehicles(): Promise<Vehicle[]> {
  const q = query(col(COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Vehicle[];
}

export async function updateVehicle(id: string, patch: Partial<Vehicle>): Promise<void> {
  await updateDoc(ref(COLLECTION, id), patch as any);
}

export async function removeVehicle(id: string): Promise<void> {
  await deleteDoc(ref(COLLECTION, id));
}
