import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useTrackLookup } from './useTrackLookup';
import { useToastStore } from '../store/toastStore';
import type { DjBlockResult } from '../types/dj';
import type { RoomState } from '../store/roomStore';

const API_URL = import.meta.env.VITE_API_URL;
const FADE_SECONDS = 3; // duración del crossfade voz -> música al terminar de hablar
const DUCK_LEVEL = 0.15; // volumen relativo de la música mientras habla el DJ
const QUEUE_LOW_THRESHOLD = 2; // canciones restantes tras la actual para disparar la siguiente transición

interface UseDjRadioParams {
  room: RoomState;
  canControl: boolean;
  musicAudioRef: RefObject<HTMLAudioElement | null>;
  voiceAudioRef: RefObject<HTMLAudioElement | null>;
  getMusicVolume: () => number;
  addToQueue: (trackId: string) => void;
  setPlayback: (updates: { isPlaying?: boolean; currentIndex?: number; basePosition?: number }) => void;
}

export function useDjRadio({
  room,
  canControl,
  musicAudioRef,
  voiceAudioRef,
  getMusicVolume,
  addToQueue,
  setPlayback,
}: UseDjRadioParams) {
  const [isActive, setIsActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  const lookup = useTrackLookup();
  const showToast = useToastStore((s) => s.showToast);

  const lastArtistRef = useRef<string | undefined>(undefined);
  const fadeIntervalRef = useRef<number | null>(null);
  const isBusyRef = useRef(false);

  function clearFadeInterval() {
    if (fadeIntervalRef.current !== null) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }

  function duckMusicImmediately() {
    const audio = musicAudioRef.current;
    if (audio) audio.volume = getMusicVolume() * DUCK_LEVEL;
  }

  function restoreMusicImmediately() {
    const audio = musicAudioRef.current;
    if (audio) audio.volume = getMusicVolume();
  }

  // Baja la voz de 1 a 0 y sube la música de "ducked" a volumen normal, en paralelo
  function startFadeOut(voice: HTMLAudioElement) {
    clearFadeInterval();
    const steps = 30;
    const stepMs = (FADE_SECONDS * 1000) / steps;
    let step = 0;

    fadeIntervalRef.current = window.setInterval(() => {
      step++;
      const t = Math.min(1, step / steps);
      voice.volume = Math.max(0, 1 - t);

      const music = musicAudioRef.current;
      if (music) music.volume = getMusicVolume() * (DUCK_LEVEL + (1 - DUCK_LEVEL) * t);

      if (t >= 1) clearFadeInterval();
    }, stepMs);
  }

  async function generateAndAnnounce(isTransition: boolean) {
    if (isBusyRef.current || !canControl) return;
    isBusyRef.current = true;
    setIsGenerating(true);

    try {
      const wasEmpty = room.queue.length === 0 || room.currentIndex === -1;

      const result = await apiFetch('/dj-blocks/personalized', {
        method: 'POST',
        body: JSON.stringify({
          previousArtist: isTransition ? lastArtistRef.current : undefined,
        }),
      }) as DjBlockResult;

      lastArtistRef.current = result.topArtist ?? lastArtistRef.current;

      setIsGenerating(false);
      setIsAnnouncing(true);

      let queuedCount = 0;
      for (const trackId of result.trackIds) {
        if (lookup(trackId)) {
          addToQueue(trackId);
          queuedCount++;
        }
      }

      if (wasEmpty && queuedCount > 0) {
        setPlayback({ isPlaying: true, currentIndex: 0, basePosition: 0 });
      }

      await playVoiceWithCrossfade(result.blockId);

      if (!isTransition) {
        showToast(`DJ activado: ${queuedCount} canciones en la mezcla`);
      }
    } catch (err: any) {
      showToast(err.message ?? 'No se pudo generar el bloque del DJ', 'error');
    } finally {
      setIsGenerating(false);
      setIsAnnouncing(false);
      isBusyRef.current = false;
    }
  }

  function playVoiceWithCrossfade(blockId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const voice = voiceAudioRef.current;
      if (!voice) return reject(new Error('Reproductor de voz no disponible'));

      let settled = false;

      function cleanup() {
        voice!.removeEventListener('timeupdate', handleTimeUpdate);
        voice!.removeEventListener('ended', handleEnded);
        voice!.removeEventListener('error', handleError);
        clearTimeout(safetyTimeout);
      }

      function finish() {
        if (settled) return;
        settled = true;
        clearFadeInterval();
        restoreMusicImmediately();
        cleanup();
        resolve();
      }

      function handleTimeUpdate() {
        if (!voice!.duration || !isFinite(voice!.duration)) return;
        const remaining = voice!.duration - voice!.currentTime;
        if (remaining <= FADE_SECONDS && fadeIntervalRef.current === null) {
          startFadeOut(voice!);
        }
      }

      function handleEnded() {
        finish();
      }

      function handleError() {
        if (settled) return;
        settled = true;
        clearFadeInterval();
        restoreMusicImmediately();
        cleanup();
        reject(new Error('No se pudo reproducir el audio del DJ'));
      }

      const safetyTimeout = setTimeout(() => finish(), 45000);

      voice.addEventListener('timeupdate', handleTimeUpdate);
      voice.addEventListener('ended', handleEnded);
      voice.addEventListener('error', handleError);

      duckMusicImmediately();

      voice.volume = 1;
      const token = localStorage.getItem('session_token') ?? '';
      voice.src = `${API_URL}/dj-blocks/${blockId}/audio?token=${token}`;

      voice.play().catch((err) => {
        if (settled) return;
        settled = true;
        restoreMusicImmediately();
        cleanup();
        reject(err);
      });
    });
  }

  function startDjRadio() {
    if (isActive) return;
    setIsActive(true);
    lastArtistRef.current = undefined;
    generateAndAnnounce(false);
  }

  function stopDjRadio() {
    setIsActive(false);
  }

  // Cuando quedan pocas canciones en la cola, generamos automáticamente la
  // siguiente tanda con una locución de transición (estilo radio continua).
  useEffect(() => {
    if (!isActive || !canControl || isBusyRef.current) return;

    const remaining = room.queue.length - 1 - room.currentIndex;
    if (remaining <= QUEUE_LOW_THRESHOLD) {
      generateAndAnnounce(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.queue.length, room.currentIndex, isActive, canControl]);

  return { isActive, isGenerating, isAnnouncing, startDjRadio, stopDjRadio };
}