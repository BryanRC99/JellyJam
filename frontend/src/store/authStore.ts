import { create } from 'zustand';

interface JellyfinUser {
  id: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: JellyfinUser | null;
  setSession: (token: string, user: JellyfinUser) => void;
  logout: () => void;
}

const storedToken = localStorage.getItem('session_token');
const storedUser = localStorage.getItem('session_user');

export const useAuthStore = create<AuthState>((set) => ({
  token: storedToken,
  user: storedUser ? JSON.parse(storedUser) : null,
  setSession: (token, user) => {
    localStorage.setItem('session_token', token);
    localStorage.setItem('session_user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('session_user');
    set({ token: null, user: null });
  },
}));