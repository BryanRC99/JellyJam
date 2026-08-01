import { getAudioItems } from '../jellyfin/jellyfin.service';
import { getOrCreateVoiceAudio } from '../dj/dj.service';
import { buildIntroScript, buildPersonalizedIntroScript, buildPersonalizedTransitionScript } from './dj-blocks.templates';
import { saveBlock } from './dj-blocks.store';
import { ARTIST_GENRE_MAP } from './dj-blocks.artist-map';
import { BlockCriteria, BlockTrackSummary, DjBlock } from './dj-blocks.types';
import { getAudioItemById } from '../jellyfin/jellyfin.service';
import { getTopTracks, getTopMembers } from '../room/room.store';

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

export async function buildPersonalizedBlock(
  userId: string,
  token: string,
  options: { count?: number; previousArtist?: string } = {}
): Promise<DjBlock & { topArtist?: string }> {
  const count = options.count ?? 8;
  const items = await getAudioItems(userId, token);

  if (items.length === 0) {
    throw new Error('Tu biblioteca no tiene canciones todavía');
  }

  const withPlayCount = items
    .map((item: any) => ({ item, playCount: item.UserData?.PlayCount ?? 0 }))
    .filter((entry: any) => entry.playCount > 0);

  const pool = withPlayCount.length > 0 ? withPlayCount : items.map((item: any) => ({ item, playCount: 0 }));

  const artistScores: Record<string, number> = {};
  for (const { item, playCount } of pool) {
    const artist = item.Artists?.[0];
    if (!artist) continue;
    artistScores[artist] = (artistScores[artist] ?? 0) + playCount;
  }

  // Evitamos repetir el mismo artista que ya se anunció en el bloque anterior, para dar variedad
  const sortedArtists = Object.entries(artistScores).sort((a, b) => b[1] - a[1]);
  const topArtist =
    sortedArtists.find(([artist]) => artist !== options.previousArtist)?.[0] ?? sortedArtists[0]?.[0];

  const sortedByPlayCount = [...pool].sort((a, b) => b.playCount - a.playCount);
  const topSlice = sortedByPlayCount.slice(0, Math.ceil(count * 0.6)).map((e) => e.item);

  const remainingPool = items.filter((item: any) => !topSlice.some((t: any) => t.Id === item.Id));
  const randomSlice = shuffle(remainingPool).slice(0, count - topSlice.length);

  const selected = shuffle([...topSlice, ...randomSlice]);

  const tracks: BlockTrackSummary[] = selected.map((item: any) => ({
    id: item.Id,
    title: item.Name,
    artist: item.Artists?.[0] ?? 'Desconocido',
  }));

  const script = options.previousArtist
    ? buildPersonalizedTransitionScript({ previousArtist: options.previousArtist, nextArtist: topArtist })
    : buildPersonalizedIntroScript({ topArtist });

  const audio = await getOrCreateVoiceAudio(script);

  const block = saveBlock({
    script,
    trackIds: tracks.map((t) => t.id),
    tracks,
    audio,
  });

  return { ...block, topArtist };
}