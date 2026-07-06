import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      setSession(result.sessionToken, result.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-neutral-900 rounded-2xl p-8 space-y-4 shadow-xl">
        <h1 className="text-2xl font-semibold text-center">Iniciar sesión</h1>
        <p className="text-sm text-neutral-400 text-center">Usa tu cuenta de Jellyfin</p>

        <div className="space-y-2">
          <label className="text-sm text-neutral-400">Usuario</label>
          <input
            className="w-full rounded-lg bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-neutral-400">Contraseña</label>
          <input
            type="password"
            className="w-full rounded-lg bg-neutral-800 px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-green-500 hover:bg-green-400 transition py-2 font-medium text-neutral-950 disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}