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
  createdAt: number;

  queue: string[]; // IDs de canciones de Jellyfin
  currentIndex: number;
  isPlaying: boolean;
  startedAt: number | null; // timestamp del servidor cuando empezó a sonar
  basePosition: number; // segundos donde iba la canción al pausar/reanudar

  // Fase 2: estadísticas de la Jam para el bloque "lo que más suena"
  playCounts: Record<string, number>; // trackId -> veces que arrancó a sonar en esta sala
  queueAddsByMember: Record<string, number>; // userId -> canciones que agregó a la cola
  lastCountedIndex: number; // evita recontar un pause/resume de la misma pista
}