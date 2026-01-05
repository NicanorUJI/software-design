// src/pages/RegisterPage.tsx
import { useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import logo from '../assests/fakemaps-logo.png';
import { useViewModel } from '../viewModels/base/useViewModel';
import { RegisterViewModel } from '../viewModels/RegisterViewModel';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const vm = useMemo(() => new RegisterViewModel({ register }), [register]);
  const s = useViewModel(vm);

  useEffect(() => () => vm.dispose(), [vm]);

  return (
    <AuthLayout>
      <div className="w-[420px] max-w-[92vw] bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-black/10 px-10 py-10">
        <div className="flex flex-col items-center">
          <img
            src={logo}
            alt="FakeMaps"
            className="h-10 w-auto mb-6"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            vm.submit(() => nav('/'));
          }}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm text-gray-700 mb-2">Email:</label>
            <input
              value={s.email}
              onChange={(e) => vm.setEmail(e.target.value)}
              className="w-full rounded-full bg-gray-200/80 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Password:</label>
            <div className="relative">
              <input
                type={s.showPw ? 'text' : 'password'}
                value={s.password}
                onChange={(e) => vm.setPassword(e.target.value)}
                className="w-full rounded-full bg-gray-200/80 px-5 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => vm.toggleShowPw()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 hover:text-gray-900"
                aria-label={s.showPw ? 'Hide password' : 'Show password'}
              >
                {s.showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Confirm password:</label>
            <input
              type={s.showPw ? 'text' : 'password'}
              value={s.confirmPassword}
              onChange={(e) => vm.setConfirmPassword(e.target.value)}
              className="w-full rounded-full bg-gray-200/80 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="new-password"
            />
          </div>

          {s.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {s.error}
            </div>
          )}

          <button
            type="submit"
            disabled={!vm.canSubmit}
            className="w-full rounded-full bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600"
          >
            {s.busy ? 'Registering…' : 'Register'}
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
