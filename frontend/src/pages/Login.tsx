import { useState, type FormEvent } from 'react';
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
    <div className="relative min-h-screen flex items-center justify-center bg-neutral-950 overflow-hidden px-4">
      {/* Glow de fondo */}
      <div className="absolute w-[380px] h-[380px] rounded-full bg-violet-600/10 blur-[100px]" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-[360px] rounded-2xl border border-neutral-800/80 bg-neutral-900/70 backdrop-blur-xl shadow-2xl p-6"
      >
        {/* Header Compacto */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="/logoV1.png"
            alt="JellyJam"
            className="w-15 h-15 mb-2 select-none"
            draggable={false}
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            JellyJam
          </h1>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950/50 px-3.5 py-2 text-sm text-neutral-200 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950/50 px-3.5 py-2 text-sm text-neutral-200 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
            />
          </div>
        </div>

        {/* Mensaje de Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
            <p className="text-xs text-red-400 text-center font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Botón de Acción */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {/* Footer minimalista */}
        <p className="mt-5 text-center text-[10px] text-neutral-600 tracking-wider uppercase font-medium">
          Powered by Jellyfin
        </p>
      </form>
    </div>
  );
}