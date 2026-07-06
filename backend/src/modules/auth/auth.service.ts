import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { authenticateByName } from '../jellyfin/jellyfin.service';
import { SessionPayload } from './auth.types';

export async function login(username: string, password: string) {
  const result = await authenticateByName(username, password);

  const payload: SessionPayload = {
    jellyfinUserId: result.User.Id,
    jellyfinUsername: result.User.Name,
    jellyfinToken: result.AccessToken,
    serverId: result.ServerId,
  };

  const sessionToken = jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return {
    sessionToken,
    user: { id: result.User.Id, name: result.User.Name },
  };
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, env.jwtSecret) as SessionPayload;
}