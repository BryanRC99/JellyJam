import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { useAlbum } from '../hooks/useAlbum';
import { usePlayerStore, useCurrentTrack } from '../store/playerStore';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import SongsTable from '../components/home/SongsTable';
import { formatDuration } from '../utils/formatDuration';
import type { Track } from '../types/track';

export default function AlbumDetail() {
  const { albumId } = useParams<{ albumId: string }>();
  const navigate = useNavigate();
  const { data: album, isLoading, error } = useAlbum(albumId);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const current = useCurrentTrack();
  const toggleFavorite = useToggleFavorite();

  if (isLoading) {
    return <div className="p-8 text-neutral-400">Cargando álbum...</div>;
  }

  if (error || !album) {
    return <div className="p-8 text-red-400">No se pudo cargar el álbum.</div>;
  }

  const totalSeconds = album.tracks.reduce((sum, t) => sum + t.durationSeconds, 0);

  function handleSelect(track: Track) {
    playTrack(track, album!.tracks);
  }

  function handlePlayAlbum() {
    if (album.tracks.length > 0) playTrack(album.tracks[0], album.tracks);
  }

  return (
    <div className="px-8 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-neutral-400 hover:text-white transition mb-6 text-sm"
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      <div className="flex items-end gap-6 mb-8">
        <img
          src={album.coverUrl}
          alt={album.name}
          className="w-48 h-48 rounded-lg object-cover bg-neutral-800 shadow-2xl flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm text-neutral-400 uppercase tracking-wide mb-2">Álbum</p>
          <h1 className="text-4xl font-bold text-white truncate">{album.name}</h1>
          <p className="mt-3 text-neutral-300">
            {album.artist}
            {album.year ? ` · ${album.year}` : ''} · {album.tracks.length} canciones · {formatDuration(totalSeconds)}
          </p>

          <button
            onClick={handlePlayAlbum}
            className="mt-6 flex items-center gap-2 bg-green-500 hover:bg-green-400 transition text-neutral-950 font-medium px-6 py-2.5 rounded-full"
          >
            <Play size={16} fill="currentColor" />
            Reproducir
          </button>
        </div>
      </div>

      <SongsTable
        tracks={album.tracks}
        currentTrackId={current?.id}
        onTrackSelect={handleSelect}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}