export interface DjBlockTrackSummary {
  id: string;
  title: string;
  artist: string;
}

export interface DjBlockResult {
  blockId: string;
  script: string;
  trackIds: string[];
  tracks: DjBlockTrackSummary[];
  topArtist?: string;
}