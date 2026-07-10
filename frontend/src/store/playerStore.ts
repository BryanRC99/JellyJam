import { create } from 'zustand';
import { useMemo } from 'react';
import type { Track } from '../types/track';

export type RepeatMode = 'off' | 'all' | 'one';

function sequentialOrder(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}

function shuffleOrder(length: number): number[] {
  const arr = sequentialOrder(length);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface PlayerState {
  queue: Track[];
  currentIndex: number;
  order: number[];
  isPlaying: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  volume: number;
  muted: boolean;


  playTrack: (track: Track, queue?: Track[]) => void;
  addToQueue: (track: Track) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  updateTrackFavorite: (trackId: string, isFavorite: boolean) => void;

  progress: number;
  setProgress: (seconds: number) => void;
  seekRequest: number | null;
  requestSeek: (seconds: number) => void;
  clearSeekRequest: () => void;

}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  order: [],
  isPlaying: false,
  shuffle: false,
  repeatMode: 'off',
  volume: 1,
  muted: false,

  progress: 0,
  setProgress: (seconds) => set({ progress: seconds }),
  seekRequest: null,
  requestSeek: (seconds) => set({ seekRequest: seconds }),
  clearSeekRequest: () => set({ seekRequest: null }),

  playTrack: (track, queueParam) => {
    const list = queueParam ?? get().queue;
    const index = list.findIndex((t) => t.id === track.id);
    const currentIndex = index === -1 ? 0 : index;
    const order = get().shuffle ? shuffleOrder(list.length) : sequentialOrder(list.length);
    set({ queue: list, currentIndex, order, isPlaying: true });
  },

  addToQueue: (track) => {
    set((s) => {
      const newIndex = s.queue.length;
      return { queue: [...s.queue, track], order: [...s.order, newIndex] };
    });
  },

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  next: () => {
    const { order, currentIndex, repeatMode } = get();
    if (order.length === 0) return;
    const pos = order.indexOf(currentIndex);
    if (pos < order.length - 1) {
      set({ currentIndex: order[pos + 1], isPlaying: true });
    } else if (repeatMode === 'all') {
      set({ currentIndex: order[0], isPlaying: true });
    } else {
      set({ isPlaying: false });
    }
  },

  prev: () => {
    const { order, currentIndex } = get();
    if (order.length === 0) return;
    const pos = order.indexOf(currentIndex);
    if (pos > 0) set({ currentIndex: order[pos - 1], isPlaying: true });
  },

  toggleShuffle: () => {
    const { queue, shuffle } = get();
    const newShuffle = !shuffle;
    const order = newShuffle ? shuffleOrder(queue.length) : sequentialOrder(queue.length);
    set({ shuffle: newShuffle, order });
  },

  cycleRepeat: () => {
    const nextMode: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };
    set((s) => ({ repeatMode: nextMode[s.repeatMode] }));
  },

  setVolume: (v) => set({ volume: v, muted: v === 0 }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),

  updateTrackFavorite: (trackId, isFavorite) =>
    set((s) => ({ queue: s.queue.map((t) => (t.id === trackId ? { ...t, isFavorite } : t)) })),
}));

export function useCurrentTrack() {
  return usePlayerStore((s) => s.queue[s.currentIndex] ?? null);
}

export function useUpcomingTracks(limit = 10) {
  const order = usePlayerStore((s) => s.order);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const queue = usePlayerStore((s) => s.queue);

  return useMemo(() => {
    const pos = order.indexOf(currentIndex);
    return order.slice(pos + 1, pos + 1 + limit).map((i) => queue[i]);
  }, [order, currentIndex, queue, limit]);
}