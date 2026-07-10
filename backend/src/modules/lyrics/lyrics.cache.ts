import fs from 'node:fs';
import path from 'node:path';
import { LyricsResult } from './lyrics.types';

const CACHE_DIR = path.resolve(process.cwd(), 'cache', 'lyrics');
fs.mkdirSync(CACHE_DIR, { recursive: true });

function cachePathFor(itemId: string) {
  return path.join(CACHE_DIR, `${itemId}.json`);
}

export function getCachedLyrics(itemId: string): LyricsResult | null {
  const filePath = cachePathFor(itemId);
  if (!fs.existsSync(filePath)) return null;

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as LyricsResult;
  } catch {
    return null;
  }
}

export function setCachedLyrics(itemId: string, result: LyricsResult) {
  const filePath = cachePathFor(itemId);
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;

  fs.writeFileSync(tmpPath, JSON.stringify(result));
  fs.renameSync(tmpPath, filePath);
}