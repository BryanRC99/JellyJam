export interface BlockCriteria {
  genre?: string;
  era?: 'old' | 'new';
  yearFrom?: number;
  yearTo?: number;
  count?: number;
}

export interface BlockTrackSummary {
  id: string;
  title: string;
  artist: string;
}

export interface DjBlock {
  id: string;
  script: string;
  trackIds: string[];
  tracks: BlockTrackSummary[];
  audio: Buffer;
  createdAt: number;
}