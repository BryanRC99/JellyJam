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
  reconnecting: boolean;
  joinRoom: (code: string) => void;
  addToQueue: (trackId: string) => void;
  setPlayback: (updates: Partial<Pick<RoomState, 'currentIndex' | 'isPlaying' | 'basePosition'>>) => void;
  seek: (positionSeconds: number) => void;
  transferHost: (targetUserId: string) => void;
  kickMember: (targetUserId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  removeFromQueue: (index: number) => void;
  leaveRoom: () => void;
  clearKicked: () => void;
  sendReaction: (emoji: string) => void;
}

// Vive fuera del store porque necesitamos leerlo/escribirlo desde los
// listeners de socket sin pasar por el ciclo de render de React.
let lastJoinedCode: string | null = null;

export const useRoomStore = create<RoomStore>((set, get) => {
  const socket = getSocket();

  socket.on('room:state', (room: RoomState) => set({ room, error: null, reconnecting: false }));

  socket.on('room:error', ({ message }: { message: string }) =>
    set({ error: message, reconnecting: false })
  );

  socket.on('room:kicked', () => {
    lastJoinedCode = null;
    set({ room: null, kicked: true });
  });

  // Reconexión de socket.io tras un corte de red (no un "disconnect" intencional
  // del usuario): si veníamos de estar en una sala, nos reunimos automáticamente
  // en vez de quedar fuera silenciosamente.
  socket.on('connect', () => {
    if (lastJoinedCode) {
      set({ reconnecting: true, error: null });
      socket.emit('room:join', { code: lastJoinedCode });
    }
  });

  socket.on('disconnect', (reason) => {
    // "io client disconnect" = lo pedimos nosotros (leaveRoom), no hay que hacer nada más.
    // Cualquier otro motivo (transporte cerrado, timeout, error de red) es involuntario:
    // mantenemos lastJoinedCode para que el próximo 'connect' intente recuperar la sala,
    // pero avisamos en la UI que estamos reconectando en vez de vaciar el estado.
    if (reason === 'io client disconnect') {
      set({ room: null });
    } else {
      set({ reconnecting: true });
    }
  });

  return {
    room: null,
    error: null,
    kicked: false,
    reconnecting: false,

    joinRoom: (code) => {
      lastJoinedCode = code;
      if (!socket.connected) socket.connect();
      else socket.emit('room:join', { code });
    },

    addToQueue: (trackId) => socket.emit('room:queue-add', { trackId }),
    setPlayback: (updates) => socket.emit('room:playback', updates),
    seek: (positionSeconds) => socket.emit('room:playback', { basePosition: positionSeconds }),
    transferHost: (targetUserId) => socket.emit('room:transfer-host', { targetUserId }),
    kickMember: (targetUserId) => socket.emit('room:kick', { targetUserId }),
    reorderQueue: (fromIndex, toIndex) => socket.emit('room:queue-reorder', { fromIndex, toIndex }),
    removeFromQueue: (index) => socket.emit('room:queue-remove', { index }),
    sendReaction: (emoji) => socket.emit('room:reaction', { emoji }),

    leaveRoom: () => {
      lastJoinedCode = null;
      socket.disconnect();
      set({ room: null });
    },

    clearKicked: () => set({ kicked: false }),
  };
});