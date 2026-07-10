import { useEffect, useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, Heart } from 'lucide-react';
import { usePlayerStore, useCurrentTrack } from '../store/playerStore';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { useClockSync } from '../hooks/useClockSync';
import { useTrackLookup } from '../hooks/useTrackLookup';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import { getExpectedPosition } from '../utils/roomSync';
import LyricsView from './lyrics/LyricsView';
import type { Track } from '../types/track';

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function NowPlaying() {
  const isOpen = useUiStore((s) => s.nowPlayingOpen);
  const close = useUiStore((s) => s.closeNowPlaying);
  const room = useRoomStore((s) => s.room);

  if (!isOpen) return null;

  return room ? <RoomNowPlaying room={room} onClose={close} /> : <SoloNowPlaying onClose={close} />;
}

function BackgroundArt({ coverUrl }: { coverUrl: string | undefined }) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-neutral-950">
      {coverUrl && (
        <img src={coverUrl} alt="" className="w-full h-full object-cover scale-125 blur-3xl opacity-50" />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/70 to-black/95" />
    </div>
  );
}

function LyricsPanel({
  trackId,
  progress,
  onSeek,
  onClose,
}: {
  trackId: string | undefined;
  progress: number;
  onSeek?: (v: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="relative h-full flex flex-col min-w-0 bg-black/20">
      <div className="relative px-6 md:px-10 pt-6 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white pb-3 border-b-2 border-white">Letras</span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-neutral-300 hover:text-white transition shrink-0"
          >
            <X size={18} />
          </button>
        </div>
        <div className="absolute left-6 right-6 md:left-10 md:right-10 bottom-0 h-px bg-white/10" />
      </div>

      <div className="flex-1 min-h-0 min-w-0">
        <LyricsView trackId={trackId} progress={progress} onSeek={onSeek} />
      </div>
    </div>
  );
}

function SoloNowPlaying({ onClose }: { onClose: () => void }) {
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
  const toggleFavorite = useToggleFavorite();

  if (!track) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center text-neutral-500 bg-neutral-950">
        Nada sonando
        <button onClick={onClose} className="absolute top-6 right-6 text-neutral-400 hover:text-white transition">
          <X size={22} />
        </button>
      </div>
    );
  }

  const duration = track.durationSeconds;
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <BackgroundArt coverUrl={track.coverUrl} />

      <div className="relative h-full flex flex-col md:flex-row">
        <div className="w-full md:w-[420px] shrink-0 flex flex-col justify-center px-8 py-10 gap-6">
          <img src={track.coverUrl} alt="" className="w-56 h-56 md:w-64 md:h-64 rounded-xl object-cover bg-neutral-900 shadow-2xl" />

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white truncate">{track.title}</h2>
            <p className="text-neutral-300 mt-1 truncate">{track.artist}</p>
            {track.album && <p className="text-neutral-500 text-sm mt-0.5 truncate">{track.album}</p>}
          </div>

          <button onClick={() => toggleFavorite(track)} className="w-fit text-neutral-300 hover:text-white transition">
            <Heart size={22} fill={track.isFavorite ? '#22c55e' : 'none'} className={track.isFavorite ? 'text-green-500' : ''} />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 w-10 text-right tabular-nums">{formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={Math.min(progress, duration || 0)}
              onChange={(e) => requestSeek(Number(e.target.value))}
              className="flex-1 accent-white"
            />
            <span className="text-xs text-neutral-500 w-10 tabular-nums">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={toggleShuffle} className={shuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white transition'}>
              <Shuffle size={20} />
            </button>
            <button onClick={prev} className="text-neutral-200 hover:text-white transition">
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-white text-neutral-950 flex items-center justify-center hover:scale-105 transition">
              {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={next} className="text-neutral-200 hover:text-white transition">
              <SkipForward size={24} fill="currentColor" />
            </button>
            <button onClick={cycleRepeat} className={repeatMode !== 'off' ? 'text-green-500' : 'text-neutral-400 hover:text-white transition'}>
              <RepeatIcon size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition">
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-white"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 min-w-0">
          <LyricsPanel trackId={track.id} progress={progress} onSeek={requestSeek} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

function RoomNowPlaying({ room, onClose }: { room: any; onClose: () => void }) {
  const lookup = useTrackLookup();
  const { getServerNow } = useClockSync();
  const setPlayback = useRoomStore((s) => s.setPlayback);
  const seek = useRoomStore((s) => s.seek);
  const user = useAuthStore((s) => s.user);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const toggleFavorite = useToggleFavorite();
  const [progress, setProgress] = useState(0);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);

  const canControl = room.hostUserId === user?.id || room.allowGuestControl;
  const currentTrackId = room.currentIndex >= 0 ? room.queue[room.currentIndex] : null;
  const track: Track | undefined = currentTrackId ? lookup(currentTrackId) : undefined;

  useEffect(() => {
    if (seekPreview !== null) return;
    const interval = setInterval(() => setProgress(getExpectedPosition(room, getServerNow)), 500);
    return () => clearInterval(interval);
  }, [room, getServerNow, seekPreview]);

  if (!track) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center text-neutral-500 bg-neutral-950">
        La cola está vacía
        <button onClick={onClose} className="absolute top-6 right-6 text-neutral-400 hover:text-white transition">
          <X size={22} />
        </button>
      </div>
    );
  }

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
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <BackgroundArt coverUrl={track.coverUrl} />

      <div className="relative h-full flex flex-col md:flex-row">
        <div className="w-full md:w-[420px] shrink-0 flex flex-col justify-center px-8 py-10 gap-6">
          <img src={track.coverUrl} alt="" className="w-56 h-56 md:w-64 md:h-64 rounded-xl object-cover bg-neutral-900 shadow-2xl" />

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white truncate">{track.title}</h2>
            <p className="text-neutral-300 mt-1 truncate">{track.artist}</p>
            <p className="text-green-500 text-sm mt-1">Sala {room.code}</p>
          </div>

          <button onClick={() => toggleFavorite(track)} className="w-fit text-neutral-300 hover:text-white transition">
            <Heart size={22} fill={track.isFavorite ? '#22c55e' : 'none'} className={track.isFavorite ? 'text-green-500' : ''} />
          </button>

          <div className="flex items-center gap-3">
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
              className="flex-1 accent-white disabled:accent-neutral-600"
            />
            <span className="text-xs text-neutral-500 w-10 tabular-nums">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={() => handleSkip(-1)} disabled={!canControl} className="text-neutral-200 hover:text-white transition disabled:opacity-30">
              <SkipBack size={24} fill="currentColor" />
            </button>
            <button
              onClick={handleTogglePlay}
              disabled={!canControl}
              className="w-12 h-12 rounded-full bg-white text-neutral-950 flex items-center justify-center hover:scale-105 transition disabled:opacity-60"
            >
              {room.isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={() => handleSkip(1)} disabled={!canControl} className="text-neutral-200 hover:text-white transition disabled:opacity-30">
              <SkipForward size={24} fill="currentColor" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition">
              {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 accent-white"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 min-w-0">
          <LyricsPanel
            trackId={track.id}
            progress={displayedProgress}
            onSeek={canControl ? commitSeek : undefined}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}