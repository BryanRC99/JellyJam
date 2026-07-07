import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useArtists } from '../hooks/useArtists';
import SearchBar from '../components/home/SearchBar';
import MusicCard from '../components/home/MusicCard';

export default function Artists() {
  const { data: artists, isLoading, error } = useArtists();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    const q = search.trim().toLowerCase();
    if (!q) return artists;
    return artists.filter((a) => a.name.toLowerCase().includes(q));
  }, [artists, search]);

  if (isLoading) {
    return <div className="p-8 text-neutral-400">Cargando artistas...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-400">No se pudieron cargar los artistas.</div>;
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Artistas</h1>
        <p className="mt-2 text-neutral-400">{artists?.length ?? 0} artistas en tu biblioteca</p>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar artistas..." />

      {filteredArtists.length === 0 ? (
        <p className="text-neutral-500 text-sm">No encontramos artistas que coincidan con tu búsqueda.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredArtists.map((artist) => (
            <MusicCard
              key={artist.id}
              image={artist.imageUrl}
              title={artist.name}
              subtitle="Artista"
              rounded
              onClick={() => navigate(`/artists/${artist.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}