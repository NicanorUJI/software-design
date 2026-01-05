export type Unsubscribe = () => void;

export abstract class ViewModel<TState> {
  private listeners = new Set<(s: TState) => void>();
  protected state: TState;

  protected constructor(initialState: TState) {
    this.state = initialState;
  }

  get snapshot(): TState {
    return this.state;
  }

  subscribe(listener: (s: TState) => void): Unsubscribe {
    this.listeners.add(listener);
    listener(this.state); // push initial snapshot
    return () => this.listeners.delete(listener);
  }

  protected setState(patch: Partial<TState> | ((prev: TState) => TState)) {
    this.state =
      typeof patch === 'function'
        ? (patch as (prev: TState) => TState)(this.state)
        : ({ ...this.state, ...patch } as TState);

    for (const l of this.listeners) l(this.state);
  }

  dispose(): void {
    this.listeners.clear();
  }
}
