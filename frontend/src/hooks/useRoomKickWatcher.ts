import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '../store/roomStore';
import { useToastStore } from '../store/toastStore';

export function useRoomKickWatcher() {
  const kicked = useRoomStore((s) => s.kicked);
  const clearKicked = useRoomStore((s) => s.clearKicked);
  const showToast = useToastStore((s) => s.showToast);
  const navigate = useNavigate();

  useEffect(() => {
    if (!kicked) return;
    showToast('El host te sacó de la sala', 'error');
    clearKicked();
    navigate('/');
  }, [kicked]);
}