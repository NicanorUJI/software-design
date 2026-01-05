import { useEffect, useState } from 'react';
import type { ViewModel } from './ViewModel';

export function useViewModel<TState>(vm: ViewModel<TState>): TState {
  const [state, setState] = useState(vm.snapshot);

  useEffect(() => {
    const unsub = vm.subscribe(setState);
    return () => unsub();
  }, [vm]);

  return state;
}
