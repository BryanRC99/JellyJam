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

// Orígenes permitidos para CORS (Desarrollo local + Producción Azure)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://158.23.60.133',
  'https://jellyjam-app.mexicocentral.cloudapp.azure.com',
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/music', musicRouter);
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ session: req.session });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions,
});

// Guardar instancia de socket.io en Express para usar req.app.get('io') en endpoints
app.set('io', io);

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