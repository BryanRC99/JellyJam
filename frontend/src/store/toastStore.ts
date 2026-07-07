import { create } from 'zustand';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ToastState {
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'error') => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = 'success') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 2800);
  },
}));