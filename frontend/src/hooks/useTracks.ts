import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Track } from '../types/track';

export function useTracks() {
  return useQuery({
    queryKey: ['tracks'],
    queryFn: async () => {
      const data = await apiFetch('/music/tracks');
      return data.tracks as Track[];
    },
  });
}