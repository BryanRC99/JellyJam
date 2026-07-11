import { CheckCircle2, XCircle } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none px-4 w-full max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast-enter flex items-center gap-2 bg-neutral-800 border border-neutral-700 text-sm text-white px-4 py-2.5 rounded-full shadow-2xl max-w-full"
        >
          {toast.type === 'success' ? (
            <CheckCircle2
              size={16}
              className="text-green-500 flex-shrink-0"
            />
          ) : (
            <XCircle
              size={16}
              className="text-red-500 flex-shrink-0"
            />
          )}

          <span className="truncate">
            {toast.message}
          </span>
        </div>
      ))}
    </div>
  );
}