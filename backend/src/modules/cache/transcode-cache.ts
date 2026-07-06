import fs from 'node:fs';
import path from 'node:path';

const CACHE_DIR = path.resolve(process.cwd(), 'cache', 'audio');
fs.mkdirSync(CACHE_DIR, { recursive: true });

export function cachePathFor(itemId: string, bitrate: number) {
  return path.join(CACHE_DIR, `${itemId}-${bitrate}.m4a`);
}

export function isCached(itemId: string, bitrate: number) {
  return fs.existsSync(cachePathFor(itemId, bitrate));
}