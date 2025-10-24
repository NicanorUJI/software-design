// src/services/repos/preferencesRepo.ts
import { getDoc, ref, setDoc, updateDoc } from '../firestoreHelpers';
import type { Preferences } from '../../types/domain';

const COLLECTION = 'preferences';
const DEFAULT_ID = 'default';

export async function getPreferences(): Promise<Preferences | null> {
  const snap = await getDoc(ref(COLLECTION, DEFAULT_ID));
  if (!snap.exists()) return null;
  const data = snap.data() as Preferences;
  return { ...data, id: DEFAULT_ID };
}

export async function setPreferences(p: Preferences): Promise<void> {
  await setDoc(ref(COLLECTION, DEFAULT_ID), p);
}

export async function updatePreferences(patch: Partial<Preferences>): Promise<void> {
  await updateDoc(ref(COLLECTION, DEFAULT_ID), patch as any);
}
