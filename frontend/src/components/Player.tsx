import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Loader2,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX,
} from 'lucide-react';
import { usePlayerStore, useCurrentTrack, useUpcomingTracks } from '../store/playerStore';

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

type Slot = 'A' | 'B';

export default function Player() {
  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);
  const slotTrackId = useRef<{ A: string | null; B: string | null }>({ A: null, B: null });

  const [activeSlot, setActiveSlot] = useState<Slot>('A');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const track = useCurrentTrack();
  const [nextTrack] = useUpcomingTracks(1);

  const activeRef = activeSlot === 'A' ? audioRefA : audioRefB;
  const inactiveRef = activeSlot === 'A' ? audioRefB : audioRefA;
  const inactiveSlot: Slot = activeSlot === 'A' ? 'B' : 'A';

  useEffect(() => {
    if (!track) return;

    if (slotTrackId.current[inactiveSlot] === track.id) {
      setActiveSlot(inactiveSlot);
      return;
    }

    const active = activeRef.current;
    if (!active) return;
    setIsBuffering(true);
    active.src = track.streamUrl;
    slotTrackId.current[activeSlot] = track.id;
    active.play().catch(() => {});
  }, [track?.id]);

  useEffect(() => {
    const inactive = inactiveRef.current;
    if (!inactive || !nextTrack) return;
    if (slotTrackId.current[inactiveSlot] === nextTrack.id) return;

    inactive.src = nextTrack.streamUrl;
    inactive.load();
    slotTrackId.current[inactiveSlot] = nextTrack.id;
  }, [nextTrack?.id, activeSlot]);

  useEffect(() => {
    const audio = activeRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying, activeSlot]);

  useEffect(() => {
    [audioRefA.current, audioRefB.current].forEach((audio) => {
      if (audio) audio.volume = muted ? 0 : volume;
    });
  }, [volume, muted]);

  if (!track) return null;

  const handleEnded = () => {
    const audio = activeRef.current;
    if (repeatMode === 'one' && audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      return;
    }
    next();
  };

  const bind = (slot: Slot) => ({
    preload: 'auto' as const,
    onTimeUpdate: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (slot === activeSlot) setProgress(e.currentTarget.currentTime);
    },
    onLoadedMetadata: (e: React.SyntheticEvent<HTMLAudioElement>) => {
      if (slot === activeSlot) setDuration(e.currentTarget.duration);
    },
    onWaiting: () => slot === activeSlot && setIsBuffering(true),
    onPlaying: () => slot === activeSlot && setIsBuffering(false),
    onCanPlay: () => slot === activeSlot && setIsBuffering(false),
    onEnded: () => slot === activeSlot && handleEnded(),
  });

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    // Cambiamos a 'grid grid-cols-3' para obligar a que las 3 secciones midan exactamente un tercio de la pantalla cada una
    <div className="w-full border-t border-neutral-800 bg-neutral-900 px-5 py-3 grid grid-cols-3 items-center select-none">
      <audio ref={audioRefA} {...bind('A')} />
      <audio ref={audioRefB} {...bind('B')} />

      {/* 1. COLUMNA IZQUIERDA: Info de la canción */}
      <div className="flex items-center gap-3 min-w-0 justify-self-start">
        <img src={track.coverUrl} alt="" className="w-12 h-12 rounded object-cover bg-neutral-800 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate text-white">{track.title}</p>
          <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
        </div>
      </div>

      {/* 2. COLUMNA CENTRAL: Controles y barra (Centrado absoluto garantizado por el grid) */}
      <div className="w-full max-w-[500px] flex flex-col gap-1.5 justify-self-center">
        {/* Botones de control */}
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={toggleShuffle}
            className={`transition ${shuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`}
            title="Aleatorio"
          >
            <Shuffle size={16} />
          </button>

          <button onClick={prev} className="text-neutral-300 hover:text-white transition">
            <SkipBack size={18} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isBuffering}
            className="w-9 h-9 rounded-full bg-white text-neutral-950 flex items-center justify-center disabled:opacity-60 hover:scale-105 transition"
          >
            {isBuffering ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button onClick={next} className="text-neutral-300 hover:text-white transition">
            <SkipForward size={18} fill="currentColor" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`transition ${repeatMode !== 'off' ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`}
            title={`Repetir: ${repeatMode}`}
          >
            <RepeatIcon size={16} />
          </button>
        </div>

        {/* Barra de Progreso */}
        <div className="flex items-center gap-2.5 w-full">
          <span className="text-xs text-neutral-400 w-10 text-right tabular-nums">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={(e) => {
              if (activeRef.current) activeRef.current.currentTime = Number(e.target.value);
            }}
            className="flex-1 accent-green-500 h-1 rounded-lg cursor-pointer bg-neutral-700"
          />
          <span className="text-xs text-neutral-400 w-10 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. COLUMNA DERECHA: Volumen (Alineada perfectamente al extremo derecho) */}
      <div className="flex items-center gap-2.5 justify-self-end w-full max-w-[180px]">
        <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition flex-shrink-0">
          {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-green-500 h-1 rounded-lg cursor-pointer bg-neutral-700"
        />
      </div>
    </div>
  );
}