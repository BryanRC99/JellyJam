import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Album } from '../types/album';

export function useAlbums() {
  return useQuery({
    queryKey: ['albums'],
    queryFn: async () => {
      const data = await apiFetch('/music/albums');
      return data.albums as Album[];
    },
  });
}