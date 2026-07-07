import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Artist } from '../types/artist';

export function useArtists() {
  return useQuery({
    queryKey: ['artists'],
    queryFn: async () => {
      const data = await apiFetch('/music/artists');
      return data.artists as Artist[];
    },
  });
}