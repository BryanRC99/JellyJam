import type { Track } from './track';
import type { Album } from './album';

export interface Artist {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface ArtistDetail extends Artist {
  albums: Album[];
  tracks: Track[];
}