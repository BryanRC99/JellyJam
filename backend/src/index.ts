import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { musicRouter } from './modules/music/music.routes';
import { authRouter } from './modules/auth/auth.routes';
import { requireAuth } from './middleware/require-auth';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/music', musicRouter);
app.use('/api/auth', authRouter);

// Ruta de prueba para validar el middleware
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ session: req.session });
});

app.listen(env.port, () => {
  console.log(`Backend escuchando en http://localhost:${env.port}`);
});