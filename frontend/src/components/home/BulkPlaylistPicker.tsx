import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { usePlaylists } from '../../hooks/usePlaylists';
import { usePlaylistActions } from '../../hooks/usePlaylistActions';
import { useToastStore } from '../../store/toastStore';
import type { Track } from '../../types/track';

interface Props {
  tracks: Track[];
  onClose: () => void;
  onDone: () => void;
}

export default function BulkPlaylistPicker({ tracks, onClose, onDone }: Props) {
  const { data: playlists, isLoading } = usePlaylists();
  const { addTrack } = usePlaylistActions();
  const showToast = useToastStore((s) => s.showToast);
  const [adding, setAdding] = useState(false);

  async function handleAdd(playlistId: string, playlistName: string) {
    setAdding(true);
    try {
      for (const track of tracks) {
        await addTrack(playlistId, track.id, playlistName);
      }
      showToast(`${tracks.length} canciones añadidas a ${playlistName}`);
    } finally {
      setAdding(false);
      onDone();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-80 max-h-[70vh] bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden mb-4 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <p className="text-sm font-semibold">Agregar {tracks.length} canciones a...</p>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-0.5">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto overscroll-contain p-2">
          {isLoading && <p className="px-3 py-3 text-xs text-neutral-500">Cargando playlists...</p>}

          {!isLoading && playlists?.length === 0 && (
            <p className="px-3 py-3 text-xs text-neutral-500">Aún no tienes playlists.</p>
          )}

          {playlists?.map((playlist) => (
            <button
              key={playlist.id}
              disabled={adding}
              onClick={() => handleAdd(playlist.id, playlist.name)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              <span className="truncate">{playlist.name}</span>
              {adding && <Check size={14} className="text-neutral-500 shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}