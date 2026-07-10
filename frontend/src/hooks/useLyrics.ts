import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { LyricsResult } from '../types/lyrics';

export function useLyrics(trackId: string | undefined) {
  return useQuery({
    queryKey: ['lyrics', trackId],
    queryFn: async () => {
      const data = await apiFetch(`/music/lyrics/${trackId}`);
      return data as LyricsResult;
    },
    enabled: !!trackId,
    staleTime: Infinity, // las letras no cambian; ya vienen cacheadas del backend
    retry: false,
  });
}