export interface Track {
  id: string;

  title: string;

  artist: string;

  album: string;

  durationSeconds: number;

  streamUrl: string;

  coverUrl: string;

  isFavorite?: boolean;
}