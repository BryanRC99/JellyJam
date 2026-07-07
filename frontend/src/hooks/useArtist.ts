import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { ArtistDetail } from '../types/artist';

export function useArtist(artistId: string | undefined) {
  return useQuery({
    queryKey: ['artist', artistId],
    queryFn: async () => {
      const data = await apiFetch(`/music/artists/${artistId}`);
      return data as ArtistDetail;
    },
    enabled: !!artistId,
  });
}