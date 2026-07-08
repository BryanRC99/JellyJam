import { RoomState } from './room.types';

const rooms = new Map<string, RoomState>();
const codeIndex = new Map<string, string>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code: string;
  do {
    code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (codeIndex.has(code));
  return code;
}

export function createRoom(hostUserId: string, hostName: string, allowGuestControl: boolean): RoomState {
  const id = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const code = generateCode();

  const room: RoomState = {
    id,
    code,
    hostUserId,
    allowGuestControl,
    members: [{ userId: hostUserId, name: hostName, socketId: null }],
    createdAt: Date.now(),
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    startedAt: null,
    basePosition: 0,
  };

  rooms.set(id, room);
  codeIndex.set(code, id);
  return room;
}

export function getRoomByCode(code: string): RoomState | undefined {
  const id = codeIndex.get(code.toUpperCase());
  return id ? rooms.get(id) : undefined;
}

export function getRoomById(id: string): RoomState | undefined {
  return rooms.get(id);
}

export function joinRoom(code: string, userId: string, name: string): RoomState | undefined {
  const room = getRoomByCode(code);
  if (!room) return undefined;

  const alreadyIn = room.members.some((m) => m.userId === userId);
  if (!alreadyIn) {
    room.members.push({ userId, name, socketId: null });
  }
  return room;
}

export function leaveRoom(roomId: string, userId: string): RoomState | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;

  room.members = room.members.filter((m) => m.userId !== userId);

  if (room.members.length === 0) {
    rooms.delete(roomId);
    codeIndex.delete(room.code);
    return undefined;
  }

  if (room.hostUserId === userId) {
    room.hostUserId = room.members[0].userId;
  }

  return room;
}

export function setGuestControl(roomId: string, requesterId: string, allow: boolean): RoomState | undefined {
  const room = rooms.get(roomId);
  if (!room || room.hostUserId !== requesterId) return undefined;
  room.allowGuestControl = allow;
  return room;
}

export function canControlPlayback(room: RoomState, userId: string): boolean {
  return room.hostUserId === userId || room.allowGuestControl;
}

export function addToQueue(roomId: string, trackId: string): RoomState | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;

  room.queue.push(trackId);
  if (room.currentIndex === -1) room.currentIndex = 0;
  return room;
}

export function setPlaybackState(
  roomId: string,
  requesterId: string,
  updates: Partial<Pick<RoomState, 'currentIndex' | 'isPlaying' | 'basePosition'>>
): RoomState | undefined {
  const room = rooms.get(roomId);
  if (!room || !canControlPlayback(room, requesterId)) return undefined;

  Object.assign(room, updates);
  room.startedAt = room.isPlaying ? Date.now() : null;
  return room;
}

export function transferHost(roomId: string, requesterId: string, targetUserId: string): RoomState | undefined {
  const room = rooms.get(roomId);
  if (!room || room.hostUserId !== requesterId) return undefined;

  const targetExists = room.members.some((m) => m.userId === targetUserId);
  if (!targetExists) return undefined;

  room.hostUserId = targetUserId;
  return room;
}

export function kickMember(
  roomId: string,
  requesterId: string,
  targetUserId: string
): { room: RoomState; kickedSocketId: string | null } | undefined {
  const room = rooms.get(roomId);
  if (!room || room.hostUserId !== requesterId || requesterId === targetUserId) return undefined;

  const target = room.members.find((m) => m.userId === targetUserId);
  if (!target) return undefined;

  const kickedSocketId = target.socketId;
  room.members = room.members.filter((m) => m.userId !== targetUserId);

  return { room, kickedSocketId };
}