import { create } from 'zustand';

interface UiState {
  nowPlayingOpen: boolean;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  nowPlayingOpen: false,
  openNowPlaying: () => set({ nowPlayingOpen: true }),
  closeNowPlaying: () => set({ nowPlayingOpen: false }),
}));