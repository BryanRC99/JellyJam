import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { PlaylistDetail } from '../types/playlist';

export function usePlaylist(playlistId: string | undefined) {
  return useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: async () => {
      const data = await apiFetch(`/music/playlists/${playlistId}`);
      return data as PlaylistDetail;
    },
    enabled: !!playlistId,
  });
}