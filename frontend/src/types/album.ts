import type { Track } from './track';

export interface Album {
  id: string;
  name: string;
  artist: string;
  year: number | null;
  trackCount: number;
  coverUrl: string | null;
}

export interface AlbumDetail extends Album {
  tracks: Array<Track & { trackNumber: number | null }>;
}