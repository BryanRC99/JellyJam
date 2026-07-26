// frontend/src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('session_token');

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token ausente, inválido o expirado: limpiamos la sesión y mandamos a login
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_user');

    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }

    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status}`);
  }

  return res.json();
}