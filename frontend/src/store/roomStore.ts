import { create } from 'zustand';
import { getSocket } from '../lib/socket';

export interface RoomMember {
  userId: string;
  name: string;
  socketId: string | null;
}

export interface RoomState {
  id: string;
  code: string;
  hostUserId: string;
  allowGuestControl: boolean;
  members: RoomMember[];
  queue: string[];
  currentIndex: number;
  isPlaying: boolean;
  startedAt: number | null;
  basePosition: number;
}

interface RoomStore {
  room: RoomState | null;
  error: string | null;
  kicked: boolean;
  joinRoom: (code: string) => void;
  addToQueue: (trackId: string) => void;
  setPlayback: (updates: Partial<Pick<RoomState, 'currentIndex' | 'isPlaying' | 'basePosition'>>) => void;
  seek: (positionSeconds: number) => void;
  transferHost: (targetUserId: string) => void;
  kickMember: (targetUserId: string) => void;
  leaveRoom: () => void;
  clearKicked: () => void;
}

export const useRoomStore = create<RoomStore>((set) => {
  const socket = getSocket();

  socket.on('room:state', (room: RoomState) => set({ room, error: null }));
  socket.on('room:error', ({ message }: { message: string }) => set({ error: message }));
  socket.on('room:kicked', () => set({ room: null, kicked: true }));
  socket.on('disconnect', () => set({ room: null }));

  return {
    room: null,
    error: null,
    kicked: false,
    joinRoom: (code) => {
      if (!socket.connected) socket.connect();
      socket.emit('room:join', { code });
    },
    addToQueue: (trackId) => socket.emit('room:queue-add', { trackId }),
    setPlayback: (updates) => socket.emit('room:playback', updates),
    seek: (positionSeconds) => socket.emit('room:playback', { basePosition: positionSeconds }),
    transferHost: (targetUserId) => socket.emit('room:transfer-host', { targetUserId }),
    kickMember: (targetUserId) => socket.emit('room:kick', { targetUserId }),
    leaveRoom: () => {
      socket.disconnect();
      set({ room: null });
    },
    clearKicked: () => set({ kicked: false }),
  };
});