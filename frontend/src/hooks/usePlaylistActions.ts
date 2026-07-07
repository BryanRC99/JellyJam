import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useToastStore } from '../store/toastStore';

export function usePlaylistActions() {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.showToast);

  async function addTrack(playlistId: string, itemId: string, playlistName: string) {
    try {
      await apiFetch(`/music/playlists/${playlistId}/tracks/${itemId}`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      showToast(`Añadido a ${playlistName}`);
    } catch {
      showToast('No se pudo agregar la canción', 'error');
    }
  }

  async function createPlaylist(name: string, firstItemId?: string) {
    try {
      const result = await apiFetch('/music/playlists', {
        method: 'POST',
        body: JSON.stringify({ name, itemId: firstItemId }),
      });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      showToast(`Creada "${result.name}"${firstItemId ? ' con la canción añadida' : ''}`);
      return result as { id: string; name: string };
    } catch {
      showToast('No se pudo crear la playlist', 'error');
      return null;
    }
  }

  async function removeTrack(playlistId: string, entryId: string) {
    try {
      await apiFetch(`/music/playlists/${playlistId}/entries/${entryId}`, { method: 'DELETE' });
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      showToast('Canción quitada de la playlist');
    } catch {
      showToast('No se pudo quitar la canción', 'error');
    }
  }

  return { addTrack, createPlaylist, removeTrack };
}