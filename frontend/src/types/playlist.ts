import type { Track } from './track';

export interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  coverUrl: string | null;
}

export interface PlaylistDetail extends Playlist {
  tracks: Array<Track & { playlistItemId: string }>;
}