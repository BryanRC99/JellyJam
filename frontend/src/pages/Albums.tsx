import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlbums } from '../hooks/useAlbums';
import SearchBar from '../components/home/SearchBar';
import MusicCard from '../components/home/MusicCard';

export default function Albums() {
  const { data: albums, isLoading, error } = useAlbums();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filteredAlbums = useMemo(() => {
    if (!albums) return [];
    const q = search.trim().toLowerCase();
    if (!q) return albums;
    return albums.filter(
      (a) => a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
    );
  }, [albums, search]);

  if (isLoading) {
    return <div className="p-8 text-neutral-400">Cargando álbumes...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-400">No se pudieron cargar los álbumes.</div>;
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Álbumes</h1>
        <p className="mt-2 text-neutral-400">{albums?.length ?? 0} álbumes en tu biblioteca</p>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Buscar álbumes o artistas..." />

      {filteredAlbums.length === 0 ? (
        <p className="text-neutral-500 text-sm">No encontramos álbumes que coincidan con tu búsqueda.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredAlbums.map((album) => (
            <MusicCard
              key={album.id}
              image={album.coverUrl}
              title={album.name}
              subtitle={album.year ? `${album.artist} · ${album.year}` : album.artist}
              onClick={() => navigate(`/albums/${album.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}