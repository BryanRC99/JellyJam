import { useMemo, useState } from 'react';
import { useTracks } from '../hooks/useTracks';
import { usePlayerStore, useCurrentTrack } from '../store/playerStore';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import SearchBar from '../components/home/SearchBar';
import SongsTable from '../components/home/SongsTable';
import type { Track } from '../types/track';

export default function Songs() {
  const { data: tracks, isLoading, error } = useTracks();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const current = useCurrentTrack();
  const toggleFavorite = useToggleFavorite();
  const [search, setSearch] = useState('');

  const filteredTracks = useMemo(() => {
    if (!tracks) return [];
    const q = search.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [tracks, search]);

  if (isLoading) {
    return <div className="p-8 text-neutral-400">Cargando canciones...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-400">No se pudo cargar la biblioteca. Intenta de nuevo.</div>;
  }

  function handleSelect(track: Track) {
    playTrack(track, tracks ?? []);
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Canciones</h1>
        <p className="mt-2 text-neutral-400">{tracks?.length ?? 0} canciones en tu biblioteca</p>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      {filteredTracks.length === 0 ? (
        <p className="text-neutral-500 text-sm">No encontramos canciones que coincidan con tu búsqueda.</p>
      ) : (
        <SongsTable
          tracks={filteredTracks}
          currentTrackId={current?.id}
          onTrackSelect={handleSelect}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}