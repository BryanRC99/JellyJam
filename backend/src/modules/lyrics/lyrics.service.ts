import { env } from '../../config/env';
import { LyricsResult } from './lyrics.types';
import { getCachedLyrics, setCachedLyrics } from './lyrics.cache';

const LRCLIB_BASE_URL = 'https://lrclib.net/api';

// LRCLIB pide un User-Agent descriptivo del cliente que consume la API
const USER_AGENT = `${env.clientName}/${env.clientVersion} (+https://github.com/)`;

const NOT_FOUND_RESULT: LyricsResult = {
  hasLyrics: false,
  instrumental: false,
  plainLyrics: null,
  syncedLyrics: null,
};

interface TrackMeta {
  title: string;
  artist: string;
  album: string;
  durationSeconds: number;
}

const inFlight = new Map<string, Promise<LyricsResult>>();

export async function getLyricsForTrack(itemId: string, meta: TrackMeta): Promise<LyricsResult> {
  const cached = getCachedLyrics(itemId);
  if (cached) return cached;

  if (inFlight.has(itemId)) return inFlight.get(itemId)!;

  const job = fetchAndCache(itemId, meta);
  inFlight.set(itemId, job);

  try {
    return await job;
  } finally {
    inFlight.delete(itemId);
  }
}

async function fetchAndCache(itemId: string, meta: TrackMeta): Promise<LyricsResult> {
  const result = await fetchFromLrclib(meta);
  setCachedLyrics(itemId, result); // cacheamos también el "no encontrado" para no repetir la consulta
  return result;
}

async function fetchFromLrclib(meta: TrackMeta): Promise<LyricsResult> {
  const params = new URLSearchParams({
    track_name: meta.title,
    artist_name: meta.artist,
    album_name: meta.album,
  });

  if (meta.durationSeconds > 0) {
    params.set('duration', String(Math.round(meta.durationSeconds)));
  }

  const res = await fetch(`${LRCLIB_BASE_URL}/get?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (res.status === 404) {
    return fetchFromSearchFallback(meta);
  }

  if (!res.ok) {
    throw new Error(`LRCLIB respondió ${res.status}`);
  }

  return mapLrclibResponse(await res.json());
}

// Fallback: si /get falla por coincidencia exacta (duración distinta, "feat.", etc.)
// probamos /search y usamos el mejor resultado disponible
async function fetchFromSearchFallback(meta: TrackMeta): Promise<LyricsResult> {
  const params = new URLSearchParams({
    track_name: meta.title,
    artist_name: meta.artist,
  });

  const res = await fetch(`${LRCLIB_BASE_URL}/search?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) return NOT_FOUND_RESULT;

  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return NOT_FOUND_RESULT;

  const best = results.find((r: any) => r.syncedLyrics) ?? results[0];
  return mapLrclibResponse(best);
}

function mapLrclibResponse(data: any): LyricsResult {
  if (!data) return NOT_FOUND_RESULT;

  return {
    hasLyrics: Boolean(data.plainLyrics || data.syncedLyrics || data.instrumental),
    instrumental: Boolean(data.instrumental),
    plainLyrics: data.plainLyrics ?? null,
    syncedLyrics: data.syncedLyrics ?? null,
  };
}