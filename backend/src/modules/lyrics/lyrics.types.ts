export interface LyricsResult {
  hasLyrics: boolean;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null; // formato LRC: [mm:ss.xx] texto
}