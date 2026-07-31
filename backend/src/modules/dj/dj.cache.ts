import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const CACHE_DIR = path.resolve(
  process.cwd(),
  'cache',
  'dj-voice'
);

function ensureCacheDir(): void {
  fs.mkdirSync(CACHE_DIR, {
    recursive: true,
  });
}

function cacheKeyFor(uniqueKey: string): string {
  return crypto
    .createHash('sha256')
    .update(uniqueKey)
    .digest('hex');
}

function cachePathFor(uniqueKey: string): string {
  return path.join(
    CACHE_DIR,
    `${cacheKeyFor(uniqueKey)}.mp3`
  );
}

export function getCachedVoice(
  uniqueKey: string
): Buffer | null {
  const filePath =
    cachePathFor(uniqueKey);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath);
}

export function setCachedVoice(
  uniqueKey: string,
  audio: Buffer
): void {
  ensureCacheDir();

  const filePath =
    cachePathFor(uniqueKey);

  const temporaryPath =
    `${filePath}.${process.pid}.${Date.now()}.tmp`;

  fs.writeFileSync(
    temporaryPath,
    audio
  );

  fs.renameSync(
    temporaryPath,
    filePath
  );
}
