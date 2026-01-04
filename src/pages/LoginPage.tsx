// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <div style={{ width: 360, padding: 24, background: 'white', borderRadius: 12 }}>
        <h2>Login</h2>

        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />

        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <button
          style={{ width: '100%', marginTop: 12 }}
          onClick={async () => {
            setError(null);
            try {
              await login(email, password);
              nav('/');
            } catch (e: any) {
              setError(e?.message ?? 'Login failed');
            }
          }}
        >
          Login
        </button>

        <p style={{ marginTop: 12 }}>
          Not registered? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
