// src/services/repos/vehiclesRepo.ts
import { addDoc, col, deleteDoc, getDocs, orderBy, query, ref, updateDoc } from '../firestoreHelpers';
import type { Vehicle } from '../../types/domain';

const ROOT = 'users';
const COLLECTION = 'vehicles';

function assertUid(uid: string) {
  if (!uid) throw new Error('Missing user id');
}

export async function addVehicle(
  uid: string,
  v: Omit<Vehicle, 'id' | 'createdAt'>
): Promise<Vehicle> {
  assertUid(uid);

  const createdAt = Date.now();
  const docRef = await addDoc(col(ROOT, uid, COLLECTION), { ...v, createdAt });

  return { ...v, id: docRef.id, createdAt };
}

export async function listVehicles(uid: string): Promise<Vehicle[]> {
  assertUid(uid);

  const q = query(col(ROOT, uid, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Vehicle[];
}

export async function updateVehicle(uid: string, id: string, patch: Partial<Vehicle>): Promise<void> {
  assertUid(uid);

  // Si en algún momento agregas un campo "id" al patch por error, puedes filtrarlo aquí.
  await updateDoc(ref(ROOT, uid, COLLECTION, id), patch as any);
}

export async function removeVehicle(uid: string, id: string): Promise<void> {
  assertUid(uid);

  await deleteDoc(ref(ROOT, uid, COLLECTION, id));
}
