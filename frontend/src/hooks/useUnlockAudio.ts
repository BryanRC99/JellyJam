import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useUnlockAudio(refs: Array<RefObject<HTMLAudioElement | null>>) {
  useEffect(() => {
    let unlocked = false;

    function unlock() {
      if (unlocked) return;
      unlocked = true;

      refs.forEach((ref) => {
        const audio = ref.current;
        if (!audio) return;
        const wasMuted = audio.muted;
        audio.muted = true;
        audio
          .play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.muted = wasMuted;
          })
          .catch(() => {
            audio.muted = wasMuted;
          });
      });

      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    }

    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });

    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);
}