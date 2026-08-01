import { getAudioItems } from '../jellyfin/jellyfin.service';
import { getOrCreateVoiceAudio } from '../dj/dj.service';
import { buildIntroScript } from './dj-blocks.templates';
import { saveBlock } from './dj-blocks.store';
import { ARTIST_GENRE_MAP } from './dj-blocks.artist-map';
import { BlockCriteria, BlockTrackSummary, DjBlock } from './dj-blocks.types';

const DEFAULT_COUNT = 8;
const OLD_THRESHOLD_YEAR = 2015; // criterio simple: "viejo" = antes de este año

function matchesGenre(item: any, genre: string): boolean {
  const target = genre.trim().toLowerCase();

  // 1. Intento con el tag "Genre" de Jellyfin (poco confiable en esta librería, pero se intenta primero)
  const genres: string[] = item.Genres ?? [];
  if (genres.some((g) => g.toLowerCase().includes(target))) return true;

  // 2. Fallback: mapa manual de artistas conocidos
  const artistList = ARTIST_GENRE_MAP[target];
  if (!artistList) return false;

  const itemArtists: string[] = item.Artists ?? [];
  return itemArtists.some((a: string) =>
    artistList.some((known) => known.toLowerCase() === a.toLowerCase())
  );
}

function matchesYearRange(item: any, yearFrom?: number, yearTo?: number): boolean {
  const year = item.ProductionYear;
  if (!year) return false;
  if (yearFrom && year < yearFrom) return false;
  if (yearTo && year > yearTo) return false;
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function buildDjBlock(
  userId: string,
  token: string,
  criteria: BlockCriteria
): Promise<DjBlock> {
  const items = await getAudioItems(userId, token);

  let { yearFrom, yearTo } = criteria;
  if (criteria.era === 'old' && yearTo === undefined) yearTo = OLD_THRESHOLD_YEAR;
  if (criteria.era === 'new' && yearFrom === undefined) yearFrom = OLD_THRESHOLD_YEAR;

  let filtered = items;

  if (criteria.genre) {
    filtered = filtered.filter((item: any) => matchesGenre(item, criteria.genre!));
  }

  if (yearFrom !== undefined || yearTo !== undefined) {
    filtered = filtered.filter((item: any) => matchesYearRange(item, yearFrom, yearTo));
  }

  if (filtered.length === 0) {
    throw new Error('No se encontraron canciones que coincidan con ese bloque');
  }

  const count = criteria.count ?? DEFAULT_COUNT;
  const selected = shuffle(filtered).slice(0, count);

  const tracks: BlockTrackSummary[] = selected.map((item: any) => ({
    id: item.Id,
    title: item.Name,
    artist: item.Artists?.[0] ?? 'Desconocido',
  }));

  const isOld = criteria.era === 'old' || (yearTo !== undefined && yearTo <= OLD_THRESHOLD_YEAR);
  const script = buildIntroScript({ genre: criteria.genre, isOld });

  const audio = await getOrCreateVoiceAudio(script);

  return saveBlock({
    script,
    trackIds: tracks.map((t) => t.id),
    tracks,
    audio,
  });
}

export async function inspectLibrary(userId: string, token: string) {
  const items = await getAudioItems(userId, token);
  const genreCounts: Record<string, number> = {};
  let withYear = 0;
  let withGenre = 0;

  for (const item of items) {
    const genres: string[] = item.Genres ?? [];
    if (genres.length > 0) withGenre++;
    genres.forEach((g: string) => {
      genreCounts[g] = (genreCounts[g] ?? 0) + 1;
    });
    if (item.ProductionYear) withYear++;
  }

  return {
    totalTracks: items.length,
    tracksWithGenre: withGenre,
    tracksWithYear: withYear,
    genreCounts,
  };
}

export async function listLibraryArtists(userId: string, token: string) {
  const items = await getAudioItems(userId, token);
  const artistCounts: Record<string, number> = {};

  for (const item of items) {
    const artists: string[] = item.Artists ?? [];
    artists.forEach((artist: string) => {
      artistCounts[artist] = (artistCounts[artist] ?? 0) + 1;
    });
  }

  const sorted = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([artist, trackCount]) => ({ artist, trackCount }));

  return {
    totalUniqueArtists: sorted.length,
    artists: sorted,
  };
}