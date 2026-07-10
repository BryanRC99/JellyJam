export interface LyricsResult {
  hasLyrics: boolean;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}