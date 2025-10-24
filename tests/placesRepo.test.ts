import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/services/firestoreHelpers', async () => await import('./__mocks__/firestoreHelpers.mock'));

import { addPlace, listPlaces, removePlace } from '../src/services/repos/placesRepo';
import type { Place } from '../src/types/domain';

describe('placesRepo', () => {
  it('adds, lists (desc by createdAt) and removes places', async () => {
    const p1: Omit<Place, 'id' | 'createdAt'> = { label: 'A', position: { lat: 1, lng: 1 } } as any;
    const p2: Omit<Place, 'id' | 'createdAt'> = { label: 'B', position: { lat: 2, lng: 2 } } as any;

    const s1 = await addPlace(p1);
    const s2 = await addPlace(p2);

    const all = await listPlaces();
    expect(all[0].id).toBe(s2.id);

    await removePlace(s1.id);
    const after = await listPlaces();
    expect(after.find(p => p.id === s1.id)).toBeUndefined();
  });
});
