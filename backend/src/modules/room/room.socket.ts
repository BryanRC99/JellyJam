import { Server, Socket } from 'socket.io';
import { joinRoom, leaveRoom, addToQueue, setPlaybackState, transferHost, kickMember, reorderQueue, removeFromQueue } from './room.store';
import type { SessionPayload } from '../auth/auth.types';


function session(socket: Socket): SessionPayload {
  return socket.data.session as SessionPayload;
}

export function registerRoomSocket(io: Server) {
  io.on('connection', (socket) => {
    const { jellyfinUserId, jellyfinUsername } = session(socket);

    socket.on('room:join', ({ code }: { code: string }) => {
      const room = joinRoom(code, jellyfinUserId, jellyfinUsername);
      if (!room) {
        socket.emit('room:error', { message: 'Sala no encontrada' });
        return;
      }

      const member = room.members.find((m) => m.userId === jellyfinUserId);
      if (member) member.socketId = socket.id;

      socket.join(room.id);
      socket.data.roomId = room.id;
      io.to(room.id).emit('room:state', room);
    });

    socket.on('room:queue-add', ({ trackId }: { trackId: string }) => {
      const roomId = socket.data.roomId as string | undefined;
      if (!roomId) return;
      const room = addToQueue(roomId, trackId);
      if (room) io.to(room.id).emit('room:state', room);
    });

    socket.on(
      'room:playback',
      (updates: { currentIndex?: number; isPlaying?: boolean; basePosition?: number }) => {
        const roomId = socket.data.roomId as string | undefined;
        if (!roomId) return;
        const room = setPlaybackState(roomId, jellyfinUserId, updates);
        if (room) io.to(room.id).emit('room:state', room);
        else socket.emit('room:error', { message: 'No tienes permiso para controlar la reproducción' });
      }
    );

    socket.on('room:ping', (data: { clientSentAt: number }) => {
      socket.emit('room:pong', { clientSentAt: data.clientSentAt, serverTime: Date.now() });
    });

    socket.on('room:transfer-host', ({ targetUserId }: { targetUserId: string }) => {
      const roomId = socket.data.roomId as string | undefined;
      if (!roomId) return;
      const room = transferHost(roomId, jellyfinUserId, targetUserId);
      if (room) io.to(room.id).emit('room:state', room);
    });

    socket.on('room:queue-reorder', ({ fromIndex, toIndex }: { fromIndex: number; toIndex: number }) => {
      const roomId = socket.data.roomId as string | undefined;
      if (!roomId) return;
      const room = reorderQueue(roomId, fromIndex, toIndex);
      if (room) io.to(room.id).emit('room:state', room);
    });

    socket.on('room:queue-remove', ({ index }: { index: number }) => {
      const roomId = socket.data.roomId as string | undefined;
      if (!roomId) return;
      const room = removeFromQueue(roomId, index);
      if (room) io.to(room.id).emit('room:state', room);
    });

    socket.on('room:kick', ({ targetUserId }: { targetUserId: string }) => {
      const roomId = socket.data.roomId as string | undefined;
      if (!roomId) return;

      const result = kickMember(roomId, jellyfinUserId, targetUserId);
      if (!result) return;

      const { room, kickedSocketId } = result;

      if (kickedSocketId) {
        const kickedSocket = io.sockets.sockets.get(kickedSocketId);
        kickedSocket?.emit('room:kicked');
        kickedSocket?.leave(room.id);
        if (kickedSocket) kickedSocket.data.roomId = undefined;
      }

      io.to(room.id).emit('room:state', room);
    });

    socket.on('room:reaction', ({ emoji }: { emoji: string }) => {
      const roomId = socket.data.roomId as string | undefined;
      if (!roomId) return;

      // Whitelist simple para evitar que se emita cualquier string arbitrario
      const ALLOWED_EMOJIS = ['❤️', '🔥', '🎉', '😂', '👏', '😮'];
      if (!ALLOWED_EMOJIS.includes(emoji)) return;

      io.to(roomId).emit('room:reaction', {
        id: `${socket.id}-${Date.now()}`,
        emoji,
        userId: jellyfinUserId,
        name: jellyfinUsername,
      });
    });

    socket.on('disconnect', () => {
      const roomId = socket.data.roomId as string | undefined;
      if (!roomId) return;
      const room = leaveRoom(roomId, jellyfinUserId);
      if (room) io.to(roomId).emit('room:state', room);
    });
  });
}