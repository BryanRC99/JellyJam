import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Track } from '../types/track';

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const data = await apiFetch('/music/favorites');
      return data.tracks as Track[];
    },
  });
}