import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { AlbumDetail } from '../types/album';

export function useAlbum(albumId: string | undefined) {
  return useQuery({
    queryKey: ['album', albumId],
    queryFn: async () => {
      const data = await apiFetch(`/music/albums/${albumId}`);
      return data as AlbumDetail;
    },
    enabled: !!albumId,
  });
}