import { Request, Response } from 'express';
import { createRoom, getRoomByCode, joinRoom, leaveRoom, setGuestControl, getTopTracks, getTopMembers } from './room.store';

export function createRoomController(req: Request, res: Response) {
  const session = req.session!;
  const { allowGuestControl = true } = req.body ?? {};

  const room = createRoom(session.jellyfinUserId, session.jellyfinUsername, Boolean(allowGuestControl));
  res.json(room);
}

export function getRoomController(req: Request, res: Response) {
  const { code } = req.params as { code: string };
  const room = getRoomByCode(code);

  if (!room) return res.status(404).json({ error: 'Sala no encontrada' });
  res.json(room);
}

export function joinRoomController(req: Request, res: Response) {
  const session = req.session!;
  const { code } = req.params as { code: string };

  const room = joinRoom(code, session.jellyfinUserId, session.jellyfinUsername);
  if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

  res.json(room);
}

export function leaveRoomController(req: Request, res: Response) {
  const session = req.session!;
  const { roomId } = req.params as { roomId: string };

  const room = leaveRoom(roomId, session.jellyfinUserId);
  res.json({ room: room ?? null });
}

export function setGuestControlController(req: Request, res: Response) {
  const session = req.session!;
  const { roomId } = req.params as { roomId: string };
  const { allowGuestControl } = req.body ?? {};

  const room = setGuestControl(roomId, session.jellyfinUserId, Boolean(allowGuestControl));
  if (!room) return res.status(403).json({ error: 'Solo el host puede cambiar este permiso' });

  const io = req.app.get('io');
  io.to(room.id).emit('room:state', room);

  res.json(room);
}

export function getRoomStatsController(req: Request, res: Response) {
  const { roomId } = req.params as { roomId: string };
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  res.json({
    topTracks: getTopTracks(roomId, limit),
    topMembers: getTopMembers(roomId, limit),
  });
}