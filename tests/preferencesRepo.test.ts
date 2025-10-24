import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/services/firestoreHelpers', async () => await import('./__mocks__/firestoreHelpers.mock'));

import { getPreferences, setPreferences, updatePreferences } from '../src/services/repos/preferencesRepo';
import type { Preferences } from '../src/types/domain';

describe('preferencesRepo', () => {
  it('sets, updates and gets preferences', async () => {
    const prefs: Preferences = {
      id: 'default',
      defaultProfile: 'driving',
      defaultFuelType: 'gasoline95'
    } as any;

    await setPreferences(prefs);
    const got = await getPreferences();
    expect(got?.defaultProfile).toBe('driving');

    await updatePreferences({ defaultProfile: 'cycling' } as any);
    const got2 = await getPreferences();
    expect(got2?.defaultProfile).toBe('cycling');
  });
});
