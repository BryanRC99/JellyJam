import { useMemo, useState } from 'react';
import { useTracks } from '../hooks/useTracks';
import { useFavorites } from '../hooks/useFavorites';
import { usePlayerStore, useCurrentTrack } from '../store/playerStore';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import HomeHeader from '../components/home/HomeHeader';
import SearchBar from '../components/home/SearchBar';
import SongsTable from '../components/home/SongsTable';
import RecentTracks from '../components/home/RecentTracks';
import type { Track } from '../types/track';

export default function Home() {
  const { data: tracks, isLoading, error } = useTracks();
  const { data: favorites } = useFavorites();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const current = useCurrentTrack();
  const toggleFavorite = useToggleFavorite();
  const [search, setSearch] = useState('');

  const isSearching = search.trim().length > 0;

  const filteredTracks = useMemo(() => {
    if (!tracks || !isSearching) return [];
    const q = search.trim().toLowerCase();
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [tracks, search, isSearching]);

  const stats = useMemo(() => {
    if (!tracks) return { tracksCount: 0, albumsCount: 0, artistsCount: 0 };
    return {
      tracksCount: tracks.length,
      albumsCount: new Set(tracks.map((t) => t.album).filter(Boolean)).size,
      artistsCount: new Set(tracks.map((t) => t.artist).filter(Boolean)).size,
    };
  }, [tracks]);

  // Muestra aleatoria estable durante la sesión (no se reordena en cada render)
  const discoverPicks = useMemo(() => {
    if (!tracks || tracks.length === 0) return [];
    return [...tracks].sort(() => Math.random() - 0.5).slice(0, 6);
  }, [tracks]);

  if (isLoading) {
    return <div className="p-4 sm:p-8 text-neutral-400">Cargando biblioteca...</div>;
  }

  if (error) {
    return <div className="p-4 sm:p-8 text-red-400">No se pudo cargar la biblioteca. Intenta de nuevo.</div>;
  }

  function handlePlay(track: Track, queue: Track[]) {
    playTrack(track, queue);
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
      <HomeHeader {...stats} />
      <SearchBar value={search} onChange={setSearch} />

      {isSearching ? (
        filteredTracks.length === 0 ? (
          <p className="text-neutral-500 text-sm">
            No encontramos canciones que coincidan con tu búsqueda.
          </p>
        ) : (
          <SongsTable
            tracks={filteredTracks}
            currentTrackId={current?.id}
            onTrackSelect={(t) => handlePlay(t, filteredTracks)}
            onToggleFavorite={toggleFavorite}
          />
        )
      ) : (
        <>
          {favorites && favorites.length > 0 && (
            <RecentTracks
              title="Tus favoritas"
              subtitle="Canciones que marcaste con corazón"
              tracks={favorites.slice(0, 6)}
              onPlay={handlePlay}
            />
          )}

          <RecentTracks
            title="Descubre en tu biblioteca"
            subtitle="Una selección aleatoria de tu colección"
            tracks={discoverPicks}
            onPlay={handlePlay}
          />
        </>
      )}
    </div>
  );
}