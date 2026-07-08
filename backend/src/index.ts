import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { Server } from 'socket.io';
import { env } from './config/env';
import { musicRouter } from './modules/music/music.routes';
import { authRouter } from './modules/auth/auth.routes';
import { roomRouter } from './modules/room/room.routes';
import { requireAuth } from './middleware/require-auth';
import { verifySession } from './modules/auth/auth.service';
import { registerRoomSocket } from './modules/room/room.socket';

const app = express();

// Mientras el frontend siga corriendo local en tu PC durante desarrollo.
// Cuando despliegues el frontend en su URL final, cambia esto a esa URL.
const ALLOWED_ORIGIN = 'http://localhost:5173';

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

app.use('/api/music', musicRouter);
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ session: req.session });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGIN },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('No autenticado'));
  try {
    socket.data.session = verifySession(token);
    next();
  } catch {
    next(new Error('Sesión inválida'));
  }
});

registerRoomSocket(io);

httpServer.listen(env.port, () => {
  console.log(`Backend escuchando en http://localhost:${env.port}`);
});