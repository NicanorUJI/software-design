// src/services/repos/placesRepo.ts
import { addDoc, col, deleteDoc, getDocs, orderBy, query, ref } from '../firestoreHelpers';
import type { Place } from '../../types/domain';

const ROOT = 'users';
const COLLECTION = 'places';

function assertUid(uid: string) {
  if (!uid) throw new Error('Missing user id');
}

export async function addPlace(
  uid: string,
  p: Omit<Place, 'id' | 'createdAt'>
): Promise<Place> {
  assertUid(uid);

  const createdAt = Date.now();
  const docRef = await addDoc(col(ROOT, uid, COLLECTION), {
    label: p.label,
    position: p.position,
    createdAt,
  });

  return { ...p, id: docRef.id, createdAt };
}

export async function listPlaces(uid: string): Promise<Place[]> {
  assertUid(uid);

  const q = query(col(ROOT, uid, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Place[];
}

export async function removePlace(uid: string, id: string): Promise<void> {
  assertUid(uid);

  await deleteDoc(ref(ROOT, uid, COLLECTION, id));
}
