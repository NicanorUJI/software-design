// src/viewModels/LoginViewModel.ts
import { ViewModel } from './base/ViewModel';

export type LoginState = {
  email: string;
  password: string;
  error: string | null;
  busy: boolean;
  showPw: boolean;
};

export interface LoginAuthPort {
  login(email: string, password: string): Promise<void>;
}

export class LoginViewModel extends ViewModel<LoginState> {
  private readonly auth: LoginAuthPort;

  constructor(auth: LoginAuthPort) {
    super({
      email: '',
      password: '',
      error: null,
      busy: false,
      showPw: false,
    });
    this.auth = auth;
  }

  get canSubmit() {
    const s = this.snapshot;
    return s.email.trim().length > 0 && s.password.length > 0 && !s.busy;
  }

  setEmail(v: string) {
    this.setState({ email: v });
  }

  setPassword(v: string) {
    this.setState({ password: v });
  }

  toggleShowPw() {
    this.setState((prev) => ({ ...prev, showPw: !prev.showPw }));
  }

  async submit(onSuccess: () => void) {
    if (!this.canSubmit) return;

    const s = this.snapshot;
    this.setState({ busy: true, error: null });

    try {
      await this.auth.login(s.email, s.password);
      onSuccess();
    } catch (e: any) {
      this.setState({ error: e?.message ?? 'Login failed' });
    } finally {
      this.setState({ busy: false });
    }
  }
}
