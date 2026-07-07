import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Playlist } from '../types/playlist';

export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const data = await apiFetch('/music/playlists');
      return data.playlists as Playlist[];
    },
  });
}