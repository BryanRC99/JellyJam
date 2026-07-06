import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 4000,
  publicApiUrl: process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT || 4000}/api`,
  jellyfinServerUrl: process.env.JELLYFIN_SERVER_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'insecure-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientName: process.env.CLIENT_NAME ?? 'JellyfinJam',
  clientVersion: process.env.CLIENT_VERSION ?? '0.1.0',
};

if (!env.jellyfinServerUrl) {
  throw new Error('JELLYFIN_SERVER_URL no está definida en .env');
}