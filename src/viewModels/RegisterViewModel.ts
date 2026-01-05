// src/viewModels/RegisterViewModel.ts
import { ViewModel } from './base/ViewModel';

export type RegisterState = {
  email: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  busy: boolean;
  showPw: boolean;
};

export interface RegisterAuthPort {
  register(email: string, password: string): Promise<void>;
}

export class RegisterViewModel extends ViewModel<RegisterState> {
  private readonly auth: RegisterAuthPort;

  constructor(auth: RegisterAuthPort) {
    super({
      email: '',
      password: '',
      confirmPassword: '',
      error: null,
      busy: false,
      showPw: false,
    });
    this.auth = auth;
  }

  get canSubmit() {
    const s = this.snapshot;
    return (
      s.email.trim().length > 0 &&
      s.password.length >= 1 &&
      s.confirmPassword.length >= 1 &&
      !s.busy
    );
  }

  setEmail(v: string) {
    this.setState({ email: v });
  }
  setPassword(v: string) {
    this.setState({ password: v });
  }
  setConfirmPassword(v: string) {
    this.setState({ confirmPassword: v });
  }
  toggleShowPw() {
    this.setState((prev) => ({ ...prev, showPw: !prev.showPw }));
  }

  async submit(onSuccess: () => void) {
    if (!this.canSubmit) return;

    const s = this.snapshot;
    this.setState({ error: null });

    if (s.password !== s.confirmPassword) {
      this.setState({ error: 'Passwords do not match' });
      return;
    }

    this.setState({ busy: true });

    try {
      await this.auth.register(s.email, s.password);
      onSuccess();
    } catch (e: any) {
      this.setState({ error: e?.message ?? 'Register failed' });
    } finally {
      this.setState({ busy: false });
    }
  }
}
