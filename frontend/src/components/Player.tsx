import { useEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Loader2,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Users, LogOut, Copy, ListMusic,
} from 'lucide-react';
import { usePlayerStore, useCurrentTrack, useUpcomingTracks } from '../store/playerStore';
import type { Track as LibraryTrack } from '../types/track';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import { useClockSync } from '../hooks/useClockSync';
import { useTrackLookup } from '../hooks/useTrackLookup';
import { getExpectedPosition } from '../utils/roomSync';
import { useToastStore } from '../store/toastStore';
import { useClickOutside } from '../hooks/useClickOutside';
import { useUnlockAudio } from '../hooks/useUnlockAudio';
import MemberList from './room/MemberList';

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

type Slot = 'A' | 'B';

const playerShellClass =
  'relative z-20 min-h-20 border-t border-neutral-800 bg-neutral-950/95 px-4 py-2 grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(12rem,22rem)_minmax(18rem,1fr)_minmax(10rem,16rem)] items-center gap-x-4 gap-y-1.5';

const playerControlsClass =
  'row-start-2 col-span-2 md:row-start-1 md:col-span-1 md:col-start-2 min-w-0 flex flex-col gap-1.5';

const playerActionsClass =
  'row-start-1 col-start-2 md:col-start-3 flex items-center justify-end gap-3';

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

function RoomPlayer({ room, setPlayback, seek, transferHost, kickMember, leaveRoom, userId, showToast }: any) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lookup = useTrackLookup();
  const { getServerNow } = useClockSync();
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const membersMenuRef = useRef<HTMLDivElement>(null);
  const queueMenuRef = useRef<HTMLDivElement>(null);
  const volume = usePlayerStore((s) => s.volume);
  const muted = usePlayerStore((s) => s.muted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);

  const canControl = room.hostUserId === userId || room.allowGuestControl;
  const currentTrackId = room.currentIndex >= 0 ? room.queue[room.currentIndex] : null;
  const track = currentTrackId ? lookup(currentTrackId) : null;
  const queueTracks: Array<LibraryTrack | undefined> = room.queue.map((trackId: string) => lookup(trackId));

  useClickOutside(membersMenuRef, () => setShowMembers(false), showMembers);
  useClickOutside(queueMenuRef, () => setShowQueue(false), showQueue);
  useUnlockAudio([audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.src !== track.streamUrl) {
      setIsBuffering(true);
      audio.src = track.streamUrl;
      audio.load();
    }
  }, [track?.id, track?.streamUrl]);

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
  }, [room, getServerNow, seekPreview]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

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
      <div className="relative z-20 border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-neutral-400">
          <Users size={16} className="text-green-500 shrink-0" />
          <span className="truncate">Sala {room.code} - la cola está vacía</span>
        </div>
        <button onClick={handleLeave} className="text-neutral-400 hover:text-white transition shrink-0" title="Salir de la sala">
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  const displayedProgress = seekPreview ?? progress;

  return (
    <div className={playerShellClass}>
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
        onEnded={() => handleSkip(1)}
      />

      <div className="min-w-0 flex items-center gap-3">
        <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-md object-cover bg-neutral-800 shrink-0 shadow-lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{track.title}</p>
          <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
        </div>
      </div>

      <div className={playerControlsClass}>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => handleSkip(-1)} disabled={!canControl} className="text-neutral-300 hover:text-white transition disabled:opacity-30" title="Anterior">
            <SkipBack size={17} fill="currentColor" />
          </button>

          <button
            onClick={handleTogglePlay}
            disabled={!canControl || isBuffering}
            className="w-10 h-10 rounded-full bg-white text-neutral-950 flex items-center justify-center disabled:opacity-60 shrink-0 shadow-lg shadow-black/20"
            title={room.isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isBuffering ? (
              <Loader2 size={18} className="animate-spin" />
            ) : room.isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button onClick={() => handleSkip(1)} disabled={!canControl} className="text-neutral-300 hover:text-white transition disabled:opacity-30" title="Siguiente">
            <SkipForward size={17} fill="currentColor" />
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-xl items-center gap-3 min-w-0">
          <span className="text-xs text-neutral-500 w-9 text-right tabular-nums shrink-0">{formatTime(displayedProgress)}</span>
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
          <span className="text-xs text-neutral-500 w-9 tabular-nums shrink-0">{formatTime(duration)}</span>
        </div>
      </div>

      <div className={playerActionsClass}>
        <button onClick={toggleMute} className="md:hidden text-neutral-400 hover:text-white transition shrink-0" title="Volumen">
          {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <div className="hidden md:flex items-center gap-2 w-28 lg:w-32 shrink-0">
          <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition" title="Volumen">
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="min-w-0 flex-1 accent-green-500"
          />
        </div>

        <div ref={queueMenuRef} className="relative">
          <button
            onClick={() => {
              setShowQueue((v) => !v);
              setShowMembers(false);
            }}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 transition rounded-full px-3 py-1.5 shrink-0"
            title="Cola de la sala"
          >
            <ListMusic size={15} className="text-neutral-300" />
            <span className="text-xs font-medium hidden sm:inline">{room.queue.length}</span>
          </button>

          {showQueue && (
            <div className="fixed right-3 bottom-20 z-50 w-[min(22rem,calc(100vw-1.5rem))] bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-3 border-b border-neutral-800">
                <p className="text-sm font-semibold">Cola del Jam</p>
                <p className="text-xs text-neutral-500 mt-0.5">{room.queue.length} canciones en sala</p>
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {room.queue.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-neutral-500">La cola está vacía</p>
                ) : (
                  <div className="space-y-1">
                    {queueTracks.map((queuedTrack, index: number) => (
                      <div
                        key={`${room.queue[index]}-${index}`}
                        className={`flex min-w-0 items-center gap-3 rounded-lg px-2 py-2 text-sm ${
                          index === room.currentIndex ? 'bg-green-500/10 text-white' : 'text-neutral-300'
                        }`}
                      >
                        <span className="w-5 shrink-0 text-xs text-neutral-500 tabular-nums">{index + 1}</span>
                        {queuedTrack?.coverUrl ? (
                          <img src={queuedTrack.coverUrl} alt="" className="w-8 h-8 rounded object-cover bg-neutral-800 shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-neutral-800 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{queuedTrack?.title ?? 'Canción no cargada'}</p>
                          <p className="truncate text-xs text-neutral-500">{queuedTrack?.artist ?? 'Sin detalles'}</p>
                        </div>
                        {index === room.currentIndex && (
                          <span className="shrink-0 text-[11px] font-semibold text-green-500">Ahora</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={membersMenuRef} className="relative">
          <button
            onClick={() => {
              setShowMembers((v) => !v);
              setShowQueue(false);
            }}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 transition rounded-full px-3 py-1.5 shrink-0"
            title="Miembros de la sala"
          >
            <Users size={15} className="text-green-500" />
            <span className="text-xs font-medium hidden sm:inline">{room.members.length}</span>
          </button>

          {showMembers && (
            <div className="fixed right-3 bottom-20 z-50 w-[min(18rem,calc(100vw-1.5rem))] bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
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
    </div>
  );
}

function SoloPlayer() {
  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);
  const slotTrackId = useRef<{ A: string | null; B: string | null }>({ A: null, B: null });

  useUnlockAudio([audioRefA, audioRefB]);

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
    onTimeUpdate: (e: SyntheticEvent<HTMLAudioElement>) => {
      if (slot === activeSlot) setProgress(e.currentTarget.currentTime);
    },
    onLoadedMetadata: (e: SyntheticEvent<HTMLAudioElement>) => {
      if (slot === activeSlot) setDuration(e.currentTarget.duration);
    },
    onWaiting: () => slot === activeSlot && setIsBuffering(true),
    onPlaying: () => slot === activeSlot && setIsBuffering(false),
    onCanPlay: () => slot === activeSlot && setIsBuffering(false),
    onEnded: () => slot === activeSlot && handleEnded(),
  });

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <div className={playerShellClass}>
      <audio ref={audioRefA} {...bind('A')} />
      <audio ref={audioRefB} {...bind('B')} />

      <div className="min-w-0 flex items-center gap-3">
        <img src={track.coverUrl} alt="" className="w-10 h-10 rounded-md object-cover bg-neutral-800 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{track.title}</p>
          <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
        </div>
      </div>

      <div className={playerControlsClass}>
        <div className="flex items-center justify-center gap-4">
          <button onClick={toggleShuffle} className={`transition ${shuffle ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`} title="Aleatorio">
            <Shuffle size={16} />
          </button>

          <button onClick={prev} className="text-neutral-300 hover:text-white transition" title="Anterior">
            <SkipBack size={17} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isBuffering}
            className="w-10 h-10 rounded-full bg-white text-neutral-950 flex items-center justify-center disabled:opacity-60 shrink-0 shadow-lg shadow-black/20"
            title={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isBuffering ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button onClick={next} className="text-neutral-300 hover:text-white transition" title="Siguiente">
            <SkipForward size={17} fill="currentColor" />
          </button>

          <button onClick={cycleRepeat} className={`transition ${repeatMode !== 'off' ? 'text-green-500' : 'text-neutral-400 hover:text-white'}`} title={`Repetir: ${repeatMode}`}>
            <RepeatIcon size={16} />
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-xl items-center gap-3 min-w-0">
          <span className="text-xs text-neutral-500 w-9 text-right tabular-nums shrink-0">{formatTime(progress)}</span>
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
          <span className="text-xs text-neutral-500 w-9 tabular-nums shrink-0">{formatTime(duration)}</span>
        </div>
      </div>

      <div className={playerActionsClass}>
        <button onClick={toggleMute} className="md:hidden text-neutral-400 hover:text-white transition shrink-0" title="Volumen">
          {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <div className="hidden md:flex items-center gap-2 w-28 lg:w-32 shrink-0">
          <button onClick={toggleMute} className="text-neutral-400 hover:text-white transition" title="Volumen">
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="min-w-0 flex-1 accent-green-500"
          />
        </div>
      </div>
    </div>
  );
}
