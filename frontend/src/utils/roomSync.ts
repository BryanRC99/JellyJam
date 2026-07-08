import type { RoomState } from '../store/roomStore';

export function getExpectedPosition(room: RoomState, getServerNow: () => number): number {
  if (!room.isPlaying || room.startedAt === null) return room.basePosition;
  const elapsedSeconds = (getServerNow() - room.startedAt) / 1000;
  return room.basePosition + elapsedSeconds;
}