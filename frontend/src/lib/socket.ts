import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL.replace(/\/api$/, '');

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('session_token');
    socket = io(SOCKET_URL, { auth: { token }, autoConnect: false });
  }
  return socket;
}