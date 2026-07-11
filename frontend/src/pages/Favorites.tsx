import { useMemo, useState } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import { usePlayerStore, useCurrentTrack } from '../store/playerStore';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import SearchBar from '../components/home/SearchBar';
import SongsTable from '../components/home/SongsTable';
import type { Track } from '../types/track';

export default function Favorites() {
  const { data: tracks, isLoading, error } = useFavorites();
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
    return (
      <div className="p-4 sm:p-8 text-neutral-400">
        Cargando favoritos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-8 text-red-400">
        No se pudieron cargar tus favoritos.
      </div>
    );
  }

  function handleSelect(track: Track) {
    playTrack(track, tracks ?? []);
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Canciones que te gustan
        </h1>

        <p className="mt-2 text-neutral-400 text-sm sm:text-base">
          {tracks?.length ?? 0} canciones favoritas
        </p>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
      />

      {filteredTracks.length === 0 ? (
        <p className="text-neutral-500 text-sm">
          No tienes canciones favoritas.
        </p>
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