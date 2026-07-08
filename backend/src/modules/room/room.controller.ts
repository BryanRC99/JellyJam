import { Request, Response } from 'express';
import { createRoom, getRoomByCode, joinRoom, leaveRoom, setGuestControl } from './room.store';

export function createRoomController(req: Request, res: Response) {
  const session = req.session!;
  const { allowGuestControl = true } = req.body ?? {};

  const room = createRoom(session.jellyfinUserId, session.jellyfinUsername, Boolean(allowGuestControl));
  res.json(room);
}

export function getRoomController(req: Request, res: Response) {
  const { code } = req.params;
  const room = getRoomByCode(code);

  if (!room) return res.status(404).json({ error: 'Sala no encontrada' });
  res.json(room);
}

export function joinRoomController(req: Request, res: Response) {
  const session = req.session!;
  const { code } = req.params;

  const room = joinRoom(code, session.jellyfinUserId, session.jellyfinUsername);
  if (!room) return res.status(404).json({ error: 'Sala no encontrada' });

  res.json(room);
}

export function leaveRoomController(req: Request, res: Response) {
  const session = req.session!;
  const { roomId } = req.params;

  const room = leaveRoom(roomId, session.jellyfinUserId);
  res.json({ room: room ?? null }); // null si la sala se cerró porque quedó vacía
}

export function setGuestControlController(req: Request, res: Response) {
  const session = req.session!;
  const { roomId } = req.params;
  const { allowGuestControl } = req.body ?? {};

  const room = setGuestControl(roomId, session.jellyfinUserId, Boolean(allowGuestControl));
  if (!room) return res.status(403).json({ error: 'Solo el host puede cambiar este permiso' });

  res.json(room);
}