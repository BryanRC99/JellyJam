import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Loader2,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Users, LogOut, Copy,
} from 'lucide-react';
import { usePlayerStore, useCurrentTrack, useUpcomingTracks } from '../store/playerStore';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import { useClockSync } from '../hooks/useClockSync';
import { useTrackLookup } from '../hooks/useTrackLookup';
import { getExpectedPosition } from '../utils/roomSync';
import { useToastStore } from '../store/toastStore';
import MemberList from './room/MemberList';

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

type Slot = 'A' | 'B';

export default function Player() {
  const room = useRoomStore((s) => s.room);
  const setRoomPlayback = useRoomStore((s) => s.setPlayback);
  const seek = useRoomStore((s) => s.seek);
  const transferHost = useRoomStore((s) => s.transferHost);
  const kickMember = useRoomStore((s) => s.kickMember);
  const leaveRoom = useRoomStore((s) => s.leaveRoom);
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.showToast);

  if (room) {
    return (
      <RoomPlayer
        room={room}
        setPlayback={setRoomPlayback}
        seek={seek}
        transferHost={transferHost}
        kickMember={kickMember}
        leaveRoom={leaveRoom}
        userId={user?.id}
        showToast={showToast}
      />
    );
  }

  return <SoloPlayer />;
}

// ---------- Modo Jam ----------

function RoomPlayer({ room, setPlayback, seek, transferHost, kickMember, leaveRoom, userId, showToast }: any) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lookup = useTrackLookup();
  const { getServerNow } = useClockSync();
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  const canControl = room.hostUserId === userId || room.allowGuestControl;
  const currentTrackId = room.currentIndex >= 0 ? room.queue[room.currentIndex] : null;
  const track = currentTrackId ? lookup(currentTrackId) : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.src !== track.streamUrl) {
      setIsBuffering(true);
      audio.src = track.streamUrl;
      audio.load();
    }
  }, [track?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (room.isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [room.isPlaying, track?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !room.isPlaying || seekPreview !== null) return;

    const interval = setInterval(() => {
      const expected = getExpectedPosition(room, getServerNow);
      const diff = expected - audio.currentTime;

      if (Math.abs(diff) > 1.5) {
        audio.currentTime = expected;
        audio.playbackRate = 1;
      } else if (Math.abs(diff) > 0.15) {
        audio.playbackRate = diff > 0 ? 1.05 : 0.95;
      } else {
        audio.playbackRate = 1;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room.id, room.currentIndex, room.isPlaying, room.startedAt, room.basePosition, seekPreview]);

  function handleTogglePlay() {
    if (!canControl) return;
    if (room.isPlaying) {
      setPlayback({ isPlaying: false, basePosition: audioRef.current?.currentTime ?? room.basePosition });
    } else {
      setPlayback({ isPlaying: true });
    }
  }

  function handleSkip(direction: 1 | -1) {
    if (!canControl) return;
    const newIndex = room.currentIndex + direction;
    if (newIndex < 0 || newIndex >= room.queue.length) return;
    setPlayback({ currentIndex: newIndex, isPlaying: true, basePosition: 0 });
  }

  function commitSeek(value: number) {
    if (!canControl) return;
    if (audioRef.current) audioRef.current.currentTime = value;
    seek(value);
    setSeekPreview(null);
  }

  function handleLeave() {
    leaveRoom();
    showToast('Saliste de la sala');
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(room.code);
    showToast('Código copiado');
  }

  function handleTransferHost(targetUserId: string) {
    transferHost(targetUserId);
    showToast('Host transferido');
  }

  function handleKick(targetUserId: string) {
    kickMember(targetUserId);
    showToast('Miembro expulsado');
  }

  if (!track) {
    return (
      <div className="border-t border-neutral-800 bg-neutral-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Users size={16} className="text-green-500" />
          Sala {room.code} — la cola está vacía
        </div>
        <button onClick={handleLeave} className="text-neutral-400 hover:text-white transition">
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  const displayedProgress = seekPreview ?? progress;

  return (
    <div className="border-t border-neutral-800 bg-neutral-900 px-4 py-3 flex items-center gap-3 md:gap-4 overflow-hidden">
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={(e) => {
          if (seekPreview === null) setProgress(e.currentTarget.currentTime);
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
      />

      <img src={track.coverUrl} alt="" className="w-12 h-12 rounded object-cover bg-neutral-800 flex-shrink-0 shadow-lg" />

      <div className="w-28 sm:w-40 min-w-0 flex-shrink-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => handleSkip(-1)} disabled={!canControl} className="text-neutral-300 hover:text-white transition disabled:opacity-30">
            <SkipBack size={18} fill="currentColor" />
          </button>

          <button
            onClick={handleTogglePlay}
            disabled={!canControl || isBuffering}
            className="w-9 h-9 rounded-full bg-white text-neutral-950 flex items-center justify-center disabled:opacity-60 flex-shrink-0"
          >
            {isBuffering ? (
              <Loader2 size={16} className="animate-spin" />
            ) : room.isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button onClick={() => handleSkip(1)} disabled={!canControl} className="text-neutral-300 hover:text-white transition disabled:opacity-30">
            <SkipForward size={18} fill="currentColor" />
          </button>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-neutral-400 w-9 text-right tabular-nums flex-shrink-0">{formatTime(displayedProgress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={displayedProgress}
            disabled={!canControl}
            onChange={(e) => setSeekPreview(Number(e.target.value))}
            onMouseUp={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => commitSeek(Number((e.target as HTMLInputElement).value))}
            className="flex-1 min-w-0 accent-green-500 disabled:accent-neutral-600 disabled:cursor-not-allowed"
          />
          <span className="text-xs text-neutral-400 w-9 tabular-nums flex-shrink-0">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowMembers((v) => !v)}
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 transition rounded-full px-3 py-1.5"
        >
          <Users size={15} className="text-green-500" />
          <span className="text-xs font-medium hidden sm:inline">{room.members.length}</span>
        </button>

        {showMembers && (
          <div className="absolute right-0 bottom-12 w-72 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-neutral-800">
              <p className="text-xs text-neutral-400 mb-1">Código de la sala</p>
              <button onClick={handleCopyCode} className="flex items-center gap-2 text-sm font-mono font-bold text-green-500">
                {room.code}
                <Copy size={13} />
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto p-2">
              <MemberList room={room} currentUserId={userId} onTransferHost={handleTransferHost} onKick={handleKick} />
            </div>

            <button
              onClick={handleLeave}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-neutral-800 transition border-t border-neutral-800"
            >
              <LogOut size={14} />
              Salir de la sala
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Modo solo (sin cambios respecto a la versión anterior) ----------

function SoloPlayer() {
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
    <div className="border-t border-neutral-800 bg-neutral-900 px-4 py-3 flex items-center gap-3 md:gap-4 overflow-hidden">
      <audio ref={audioRefA} {...bind('A')} />
      <audio ref={audioRefB} {...bind('B')} />

      <img src={track.coverUrl} alt="" className="w-12 h-12 rounded object-cover bg-neutral-800 flex-shrink-0" />

      <div className="w-28 sm:w-40 min-w-0 flex-shrink-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center justify-center gap-3">
          <button onClick={toggleShuffle} className={`transition ${shuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`} title="Aleatorio">
            <Shuffle size={16} />
          </button>

          <button onClick={prev} className="text-neutral-300 hover:text-white transition">
            <SkipBack size={18} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isBuffering}
            className="w-9 h-9 rounded-full bg-white text-neutral-950 flex items-center justify-center disabled:opacity-60 flex-shrink-0"
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

          <button onClick={cycleRepeat} className={`transition ${repeatMode !== 'off' ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`} title={`Repetir: ${repeatMode}`}>
            <RepeatIcon size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-neutral-400 w-9 text-right tabular-nums flex-shrink-0">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={(e) => {
              if (activeRef.current) activeRef.current.currentTime = Number(e.target.value);
            }}
            className="flex-1 min-w-0 accent-green-500"
          />
          <span className="text-xs text-neutral-400 w-9 tabular-nums flex-shrink-0">{formatTime(duration)}</span>
        </div>
      </div>

      <button onClick={toggleMute} className="md:hidden text-neutral-400 hover:text-white transition flex-shrink-0">
        {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>

      <div className="hidden md:flex items-center gap-2 w-32 flex-shrink-0">
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
          className="flex-1 accent-green-500"
        />
      </div>
    </div>
  );
}