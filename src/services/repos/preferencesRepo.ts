// src/services/repos/preferencesRepo.ts
import { getDoc, ref, setDoc } from '../firestoreHelpers';
import type { Preferences } from '../../types/domain';

const ROOT = 'users';
const COLLECTION = 'preferences';
const DEFAULT_ID = 'default';

function assertUid(uid: string) {
  if (!uid) throw new Error('Missing user id');
}

function prefRef(uid: string) {
  return ref(ROOT, uid, COLLECTION, DEFAULT_ID);
}

type StoredPreferences = Omit<Preferences, 'id'>;

export async function getPreferences(uid: string): Promise<Preferences | null> {
  assertUid(uid);

  const snap = await getDoc(prefRef(uid));
  if (!snap.exists()) return null;

  const data = snap.data() as StoredPreferences;
  return { ...data, id: DEFAULT_ID };
}

export async function setPreferences(uid: string, p: Preferences): Promise<void> {
  assertUid(uid);

  const { id: _ignore, ...toStore } = p;
  await setDoc(prefRef(uid), toStore);
}

export async function updatePreferences(uid: string, patch: Partial<Preferences>): Promise<void> {
  assertUid(uid);

  // Evita guardar "id" como campo y evita que falle si el doc no existe.
  const { id: _ignore, ...toStore } = patch;

  await setDoc(prefRef(uid), toStore, { merge: true });
}
