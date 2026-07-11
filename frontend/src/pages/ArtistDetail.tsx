import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { useArtist } from '../hooks/useArtist';
import { usePlayerStore, useCurrentTrack } from '../store/playerStore';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import MusicCard from '../components/home/MusicCard';
import SongsTable from '../components/home/SongsTable';
import SectionHeader from '../components/home/SectionHeader';
import CoverImage from '../components/common/CoverImage';
import type { Track } from '../types/track';

export default function ArtistDetail() {
  const { artistId } = useParams<{ artistId: string }>();
  const navigate = useNavigate();
  const { data: artist, isLoading, error } = useArtist(artistId);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const current = useCurrentTrack();
  const toggleFavorite = useToggleFavorite();

  if (isLoading) {
    return <div className="p-4 sm:p-8 text-neutral-400">Cargando artista...</div>;
  }

  if (error || !artist) {
    return <div className="p-4 sm:p-8 text-red-400">No se pudo cargar el artista.</div>;
  }

  function handleSelect(track: Track) {
    playTrack(track, artist!.tracks);
  }

  function handlePlayTop() {
    if (artist!.tracks.length > 0) playTrack(artist!.tracks[0], artist!.tracks);
  }

  return (
    <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-10 text-center sm:text-left">
        <CoverImage
          src={artist.imageUrl}
          name={artist.name}
          rounded
          className="w-40 h-40 sm:w-48 sm:h-48 text-4xl sm:text-5xl shadow-2xl flex-shrink-0"
        />
        <div className="min-w-0 w-full">
          <p className="text-sm text-neutral-400 uppercase tracking-wide mb-2">Artista</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white truncate">{artist.name}</h1>
          <p className="mt-3 text-neutral-300 text-sm sm:text-base">
            {artist.albums.length} álbumes · {artist.tracks.length} canciones
          </p>

          {artist.tracks.length > 0 && (
            <button
              onClick={handlePlayTop}
              className="mt-6 flex items-center gap-2 bg-green-500 hover:bg-green-400 transition text-neutral-950 font-medium px-6 py-2.5 rounded-full mx-auto sm:mx-0"
            >
              <Play size={16} fill="currentColor" />
              Reproducir
            </button>
          )}
        </div>
      </div>

      {artist.albums.length > 0 && (
        <section className="mb-10">
          <SectionHeader title="Álbumes" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {artist.albums.map((album) => (
              <MusicCard
                key={album.id}
                image={album.coverUrl}
                title={album.name}
                subtitle={album.year ? `${album.year}` : undefined}
                onClick={() => navigate(`/albums/${album.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {artist.tracks.length > 0 && (
        <section>
          <SectionHeader title="Todas las canciones" />
          <SongsTable
            tracks={artist.tracks}
            currentTrackId={current?.id}
            onTrackSelect={handleSelect}
            onToggleFavorite={toggleFavorite}
          />
        </section>
      )}
    </div>
  );
}