// src/pages/RegisterPage.tsx
import { useMemo, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import logo from '../assests/fakemaps-logo.png';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      email.trim().length > 0 &&
      password.length >= 1 &&
      confirmPassword.length >= 1 &&
      !busy
    );
  }, [email, password, confirmPassword, busy]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setBusy(true);
    try {
      await register(email, password);
      nav('/');
    } catch (err: any) {
      setError(err?.message ?? 'Register failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-[420px] max-w-[92vw] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-black/10 px-10 py-10">
        <div className="flex flex-col items-center">
          <img
            src={logo}
            alt="FakeMaps"
            className="h-10 w-auto mb-6"
            onError={(e) => {
              // If logo not present, hide broken image icon
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Email:</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full bg-gray-200/80 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Password:</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-full bg-gray-200/80 px-5 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 hover:text-gray-900"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Confirm password:</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-full bg-gray-200/80 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            {busy ? 'Registering…' : 'Register'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Already registered?
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
