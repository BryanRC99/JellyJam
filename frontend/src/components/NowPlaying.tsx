import { useEffect, useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore, useCurrentTrack } from '../store/playerStore';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { useClockSync } from '../hooks/useClockSync';
import { useTrackLookup } from '../hooks/useTrackLookup';
import { getExpectedPosition } from '../utils/roomSync';

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Portada cuadrada que se achica en pantallas bajas para no forzar scroll
const coverClass = 'w-[min(42vh,20rem)] h-[min(42vh,20rem)] rounded-2xl object-cover bg-neutral-900 shadow-2xl shrink-0';

export default function NowPlaying() {
  const isOpen = useUiStore((s) => s.nowPlayingOpen);
  const close = useUiStore((s) => s.closeNowPlaying);
  const room = useRoomStore((s) => s.room);
  const [tab, setTab] = useState<'now' | 'lyrics'>('now');

  useEffect(() => {
    if (!isOpen) setTab('now');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-900 shrink-0">
        <div className="flex items-center gap-6 text-sm font-medium">
          <button onClick={() => setTab('now')} className={tab === 'now' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}>
            Reproduciendo
          </button>
          <button onClick={() => setTab('lyrics')} className={tab === 'lyrics' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}>
            Letras
          </button>
        </div>
        <button onClick={close} className="text-neutral-400 hover:text-white transition">
          <X size={22} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {tab === 'lyrics' ? (
          <div className="h-full flex items-center justify-center text-neutral-500 text-sm">Letras — próximamente</div>
        ) : room ? (
          <RoomNowPlaying room={room} />
        ) : (
          <SoloNowPlaying />
        )}
      </div>
    </div>
  );
}

function SoloNowPlaying() {
  const track = useCurrentTrack();
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
  const progress = usePlayerStore((s) => s.progress);
  const requestSeek = usePlayerStore((s) => s.requestSeek);

  if (!track) return <div className="h-full flex items-center justify-center text-neutral-500">Nada sonando</div>;

  const duration = track.durationSeconds;
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-3 sm:gap-5 px-6 py-4">
      <img src={track.coverUrl} alt="" className={coverClass} />

      <div className="text-center shrink-0">
        <h2 className="text-lg sm:text-2xl font-bold text-white">{track.title}</h2>
        <p className="text-neutral-400 mt-0.5 text-sm sm:text-base">{track.artist}</p>
      </div>

      <div className="w-full max-w-xl flex items-center gap-3 shrink-0">
        <span className="text-xs text-neutral-500 w-10 text-right tabular-nums">{formatTime(progress)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={Math.min(progress, duration || 0)}
          onChange={(e) => requestSeek(Number(e.target.value))}
          className="flex-1 accent-green-500"
        />
        <span className="text-xs text-neutral-500 w-10 tabular-nums">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center gap-5 sm:gap-6 shrink-0">
        <button onClick={toggleShuffle} className={shuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white transition'}>
          <Shuffle size={20} />
        </button>
        <button onClick={prev} className="text-neutral-200 hover:text-white transition">
          <SkipBack size={24} fill="currentColor" />
        </button>
        <button onClick={togglePlay} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-neutral-950 flex items-center justify-center hover:scale-105 transition">
          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>
        <button onClick={next} className="text-neutral-200 hover:text-white transition">
          <SkipForward size={24} fill="currentColor" />
        </button>
        <button onClick={cycleRepeat} className={repeatMode !== 'off' ? 'text-green-500' : 'text-neutral-400 hover:text-white transition'}>
          <RepeatIcon size={20} />
        </button>
      </div>

      <div className="flex items-center gap-3 w-full max-w-[220px] shrink-0">
        <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition">
          {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input type="range" min={0} max={1} step={0.01} value={muted ? 0 : volume} onChange={(e) => setVolume(Number(e.target.value))} className="flex-1 accent-green-500" />
      </div>
    </div>
  );
}

function RoomNowPlaying({ room }: { room: any }) {
  const lookup = useTrackLookup();
  const { getServerNow } = useClockSync();
  const setPlayback = useRoomStore((s) => s.setPlayback);
  const seek = useRoomStore((s) => s.seek);
  const user = useAuthStore((s) => s.user);
  const [progress, setProgress] = useState(0);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);

  const canControl = room.hostUserId === user?.id || room.allowGuestControl;
  const currentTrackId = room.currentIndex >= 0 ? room.queue[room.currentIndex] : null;
  const track = currentTrackId ? lookup(currentTrackId) : null;

  useEffect(() => {
    if (seekPreview !== null) return;
    const interval = setInterval(() => setProgress(getExpectedPosition(room, getServerNow)), 500);
    return () => clearInterval(interval);
  }, [room, getServerNow, seekPreview]);

  if (!track) return <div className="h-full flex items-center justify-center text-neutral-500">La cola está vacía</div>;

  const duration = track.durationSeconds;
  const displayedProgress = seekPreview ?? progress;

  function commitSeek(value: number) {
    if (!canControl) return;
    seek(value);
    setSeekPreview(null);
  }

  function handleTogglePlay() {
    if (!canControl) return;
    setPlayback({ isPlaying: !room.isPlaying, basePosition: displayedProgress });
  }

  function handleSkip(direction: 1 | -1) {
    if (!canControl) return;
    const newIndex = room.currentIndex + direction;
    if (newIndex < 0 || newIndex >= room.queue.length) return;
    setPlayback({ currentIndex: newIndex, isPlaying: true, basePosition: 0 });
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center gap-3 sm:gap-5 px-6 py-4">
      <img src={track.coverUrl} alt="" className={coverClass} />

      <div className="text-center shrink-0">
        <h2 className="text-lg sm:text-2xl font-bold text-white">{track.title}</h2>
        <p className="text-neutral-400 mt-0.5 text-sm sm:text-base">{track.artist}</p>
        <p className="text-xs text-green-500 mt-1.5">Sala {room.code}</p>
      </div>

      <div className="w-full max-w-xl flex items-center gap-3 shrink-0">
        <span className="text-xs text-neutral-500 w-10 text-right tabular-nums">{formatTime(displayedProgress)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={displayedProgress}
          disabled={!canControl}
          onChange={(e) => setSeekPreview(Number(e.target.value))}
          onMouseUp={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
          className="flex-1 accent-green-500 disabled:accent-neutral-600"
        />
        <span className="text-xs text-neutral-500 w-10 tabular-nums">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center gap-5 sm:gap-6 shrink-0">
        <button onClick={() => handleSkip(-1)} disabled={!canControl} className="text-neutral-200 hover:text-white transition disabled:opacity-30">
          <SkipBack size={24} fill="currentColor" />
        </button>
        <button onClick={handleTogglePlay} disabled={!canControl} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white text-neutral-950 flex items-center justify-center hover:scale-105 transition disabled:opacity-60">
          {room.isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>
        <button onClick={() => handleSkip(1)} disabled={!canControl} className="text-neutral-200 hover:text-white transition disabled:opacity-30">
          <SkipForward size={24} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}