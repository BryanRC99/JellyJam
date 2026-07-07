import { useState } from 'react';
import { ArrowLeft, Plus, Check } from 'lucide-react';
import { usePlaylists } from '../../hooks/usePlaylists';
import { usePlaylistActions } from '../../hooks/usePlaylistActions';
import type { Track } from '../../types/track';

interface Props {
  track: Track;
  onBack: () => void;
  onDone: () => void;
}

export default function AddToPlaylistMenu({ track, onBack, onDone }: Props) {
  const { data: playlists, isLoading } = usePlaylists();
  const { addTrack, createPlaylist } = usePlaylistActions();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  async function handleAdd(playlistId: string, playlistName: string) {
    await addTrack(playlistId, track.id, playlistName);
    onDone();
  }

  async function handleCreate() {
    if (!name.trim()) return;
    await createPlaylist(name.trim(), track.id);
    onDone();
  }

  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-800">
        <button onClick={onBack} className="text-neutral-400 hover:text-white">
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-medium">Agregar a playlist</span>
      </div>

      <div className="max-h-56 overflow-y-auto">
        {isLoading && <p className="px-3 py-3 text-xs text-neutral-500">Cargando playlists...</p>}

        {!isLoading && playlists?.length === 0 && (
          <p className="px-3 py-3 text-xs text-neutral-500">Aún no tienes playlists.</p>
        )}

        {playlists?.map((playlist) => (
          <button
            key={playlist.id}
            onClick={() => handleAdd(playlist.id, playlist.name)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <span className="truncate">{playlist.name}</span>
            <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">{playlist.trackCount}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-neutral-800">
        {creating ? (
          <div className="p-2 flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre de la playlist"
              className="flex-1 bg-neutral-800 rounded px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <button onClick={handleCreate} className="text-green-500 hover:text-green-400 flex-shrink-0">
              <Check size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <Plus size={16} />
            Crear nueva playlist
          </button>
        )}
      </div>
    </div>
  );
}