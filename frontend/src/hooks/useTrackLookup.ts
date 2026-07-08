import { useQueryClient } from '@tanstack/react-query';
import type { Track } from '../types/track';

export function useTrackLookup() {
  const queryClient = useQueryClient();
  return function lookup(trackId: string): Track | undefined {
    const tracks = queryClient.getQueryData<Track[]>(['tracks']);
    return tracks?.find((t) => t.id === trackId);
  };
}