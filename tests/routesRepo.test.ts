import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/services/firestoreHelpers', async () => await import('./__mocks__/firestoreHelpers.mock'));

import { addRoute, listRoutes, removeRoute } from '../src/services/repos/routesRepo';
import type { SavedRoute } from '../src/types/domain';

describe('routesRepo', () => {
  it('adds, lists with limit and removes routes', async () => {
    const base: Omit<SavedRoute, 'id' | 'createdAt'> = {
      origin: { label: 'O', position: { lat: 0, lng: 0 } },
      destination: { label: 'D', position: { lat: 1, lng: 1 } },
      profile: 'driving',
      distanceKm: 10,
      durationMin: 15
    } as any;

    const r1 = await addRoute(base);
    const r2 = await addRoute({ ...base });

    const all = await listRoutes(1);
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(r2.id);

    await removeRoute(r1.id);
    const left = await listRoutes(10);
    expect(left.find(r => r.id === r1.id)).toBeUndefined();
  });
});
