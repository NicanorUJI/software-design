// src/services/repos/routesRepo.ts
import { addDoc, col, deleteDoc, getDocs, limit, orderBy, query, ref } from '../firestoreHelpers';
import type { SavedRoute } from '../../types/domain';

const ROOT = 'users';
const COLLECTION = 'routes';

function assertUid(uid: string) {
  if (!uid) throw new Error('Missing user id');
}

export async function addRoute(
  uid: string,
  r: Omit<SavedRoute, 'id' | 'createdAt'>
): Promise<SavedRoute> {
  assertUid(uid);

  const createdAt = Date.now();
  const docRef = await addDoc(col(ROOT, uid, COLLECTION), { ...r, createdAt });

  return { ...r, id: docRef.id, createdAt };
}

export async function listRoutes(uid: string, max: number = 50): Promise<SavedRoute[]> {
  assertUid(uid);

  const q = query(col(ROOT, uid, COLLECTION), orderBy('createdAt', 'desc'), limit(max));
  const snap = await getDocs(q);

  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as SavedRoute[];
}

export async function removeRoute(uid: string, id: string): Promise<void> {
  assertUid(uid);

  await deleteDoc(ref(ROOT, uid, COLLECTION, id));
}
