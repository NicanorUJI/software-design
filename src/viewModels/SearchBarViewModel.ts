import { ViewModel } from './base/ViewModel';
import type { PlaceSuggestion } from '../types/route';

export type SearchField = 'origin' | 'destination';

export interface IRoutingGeocode {
  geocodeSearch(q: string): Promise<PlaceSuggestion[]>;
}

type State = {
  originQuery: string;
  destinationQuery: string;
  activeField: SearchField;
  suggestions: PlaceSuggestion[];
  open: boolean;
  searching: boolean;
  error: string | null;
};

export class SearchBarViewModel extends ViewModel<State> {
  private timer: ReturnType<typeof setTimeout> | null = null;

  private readonly routing: IRoutingGeocode;
  private readonly onSelectOrigin: (p: PlaceSuggestion) => void;
  private readonly onSelectDestination: (p: PlaceSuggestion) => void;

  constructor(
    routing: IRoutingGeocode,
    onSelectOrigin: (p: PlaceSuggestion) => void,
    onSelectDestination: (p: PlaceSuggestion) => void
  ) {
    super({
      originQuery: '',
      destinationQuery: '',
      activeField: 'origin',
      suggestions: [],
      open: false,
      searching: false,
      error: null,
    });

    this.routing = routing;
    this.onSelectOrigin = onSelectOrigin;
    this.onSelectDestination = onSelectDestination;
  }

  setActiveField(field: SearchField) {
    this.setState({ activeField: field });
    this.search(); // opcional: re-dispara si ya hay query
  }

  setOriginQuery(q: string) {
    this.setState({ originQuery: q, activeField: 'origin' });
    this.search();
  }

  setDestinationQuery(q: string) {
    this.setState({ destinationQuery: q, activeField: 'destination' });
    this.search();
  }

  closeDropdown() {
    this.setState({ open: false });
  }

  reset() {
    this.clearTimer();
    this.setState({
      originQuery: '',
      destinationQuery: '',
      activeField: 'origin',
      suggestions: [],
      open: false,
      searching: false,
      error: null,
    });
  }

  selectSuggestion(p: PlaceSuggestion) {
    if (this.state.activeField === 'origin') {
      this.onSelectOrigin(p);
      this.setState({
        originQuery: '',
        suggestions: [],
        open: false,
        error: null,
        activeField: 'destination',
      });
    } else {
      this.onSelectDestination(p);
      this.setState({
        destinationQuery: '',
        suggestions: [],
        open: false,
        error: null,
      });
    }
  }

  private search() {
    const q =
      (this.state.activeField === 'origin'
        ? this.state.originQuery
        : this.state.destinationQuery).trim();

    this.clearTimer();

    if (q.length < 2) {
      this.setState({ suggestions: [], open: false, searching: false, error: null });
      return;
    }

    this.setState({ searching: true, error: null });

    this.timer = window.setTimeout(async () => {
      try {
        const results = await this.routing.geocodeSearch(q);
        this.setState({ suggestions: results, open: true, searching: false });
      } catch {
        this.setState({ suggestions: [], open: false, searching: false, error: 'Search failed' });
      }
    }, 200);
  }

  private clearTimer() {
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  override dispose(): void {
    this.clearTimer();
    super.dispose();
  }
}
