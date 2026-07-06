import { Request, Response } from 'express';
import { login } from './auth.service';

export async function loginController(req: Request, res: Response) {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username y password son requeridos' });
  }

  try {
    const result = await login(username, password);
    return res.json(result);
  } catch (err: any) {
    const message = err?.message ?? 'Error de autenticación';
    const status = message.includes('incorrectos') ? 401 : 502;
    return res.status(status).json({ error: message });
  }
}