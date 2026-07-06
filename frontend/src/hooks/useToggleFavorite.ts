import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Track } from '../types/track';

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return async function toggleFavorite(track: Track) {
    const nextValue = !track.isFavorite;

    // Actualización optimista en la caché de "todas las canciones"
    queryClient.setQueryData<Track[]>(['tracks'], (old) =>
      old?.map((t) => (t.id === track.id ? { ...t, isFavorite: nextValue } : t))
    );

    // Actualización optimista en la caché de "favoritas": agrega o quita según corresponda
    queryClient.setQueryData<Track[]>(['favorites'], (old) => {
      if (!old) return old;
      if (nextValue) {
        const exists = old.some((t) => t.id === track.id);
        return exists ? old : [...old, { ...track, isFavorite: true }];
      }
      return old.filter((t) => t.id !== track.id);
    });

    try {
      await apiFetch(`/music/favorites/${track.id}`, {
        method: nextValue ? 'POST' : 'DELETE',
      });
    } catch {
      // Si falla, descarta el optimismo y vuelve a pedir la data real
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    }
  };
}