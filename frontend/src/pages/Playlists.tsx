import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { usePlaylists } from '../hooks/usePlaylists';
import { usePlaylistActions } from '../hooks/usePlaylistActions';
import SearchBar from '../components/home/SearchBar';
import MusicCard from '../components/home/MusicCard';

export default function Playlists() {
  const { data: playlists, isLoading, error } = usePlaylists();
  const { createPlaylist } = usePlaylistActions();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const filtered = useMemo(() => {
    if (!playlists) return [];
    const q = search.trim().toLowerCase();
    if (!q) return playlists;
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, search]);

  async function handleCreate() {
    if (!name.trim()) return;
    const result = await createPlaylist(name.trim());
    setName('');
    setCreating(false);
    if (result?.id) navigate(`/playlists/${result.id}`);
  }

  if (isLoading) return <div className="p-8 text-neutral-400">Cargando playlists...</div>;
  if (error) return <div className="p-8 text-red-400">No se pudieron cargar tus playlists.</div>;

  return (
    <div className="px-8 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Playlists</h1>
          <p className="mt-2 text-neutral-400">{playlists?.length ?? 0} playlists</p>
        </div>

        {creating ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nombre de la playlist"
              className="bg-neutral-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleCreate}
              className="bg-green-500 hover:bg-green-400 transition text-neutral-950 font-medium px-4 py-2 rounded-lg text-sm flex-shrink-0"
            >
              Crear
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 transition px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
          >
            <Plus size={16} />
            Nueva playlist
          </button>
        )}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar playlists..." />

      {filtered.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          {playlists?.length === 0 ? 'Aún no tienes playlists.' : 'No encontramos playlists que coincidan con tu búsqueda.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((playlist) => (
            <MusicCard
              key={playlist.id}
              image={playlist.coverUrl}
              title={playlist.name}
              subtitle={`${playlist.trackCount} canciones`}
              onClick={() => navigate(`/playlists/${playlist.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}