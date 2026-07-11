import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { usePlaylist } from '../hooks/usePlaylist';
import { usePlaylistActions } from '../hooks/usePlaylistActions';
import { usePlayerStore, useCurrentTrack } from '../store/playerStore';
import { useToggleFavorite } from '../hooks/useToggleFavorite';
import CoverImage from '../components/common/CoverImage';
import SongsTable from '../components/home/SongsTable';
import { formatDuration } from '../utils/formatDuration';
import type { Track } from '../types/track';

export default function PlaylistDetail() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { data: playlist, isLoading, error } = usePlaylist(playlistId);
  const { removeTrack } = usePlaylistActions();
  const playTrack = usePlayerStore((s) => s.playTrack);
  const current = useCurrentTrack();
  const toggleFavorite = useToggleFavorite();

  if (isLoading) return <div className="p-4 sm:p-8 text-neutral-400">Cargando playlist...</div>;
  if (error || !playlist) return <div className="p-4 sm:p-8 text-red-400">No se pudo cargar la playlist.</div>;

  const totalSeconds = playlist.tracks.reduce((sum, t) => sum + t.durationSeconds, 0);

  function handleSelect(track: Track) {
    playTrack(track, playlist!.tracks);
  }

  function handlePlayAll() {
    if (playlist!.tracks.length > 0) playTrack(playlist!.tracks[0], playlist!.tracks);
  }

  function handleRemove(track: Track) {
    const entryId = (track as any).playlistItemId;
    if (entryId) removeTrack(playlist!.id, entryId);
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

      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-8 text-center sm:text-left">
        <CoverImage
          src={playlist.coverUrl}
          name={playlist.name}
          className="w-40 h-40 sm:w-48 sm:h-48 text-4xl sm:text-5xl shadow-2xl flex-shrink-0"
        />
        <div className="min-w-0 w-full">
          <p className="text-sm text-neutral-400 uppercase tracking-wide mb-2">Playlist</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white truncate">{playlist.name}</h1>
          <p className="mt-3 text-neutral-300 text-sm sm:text-base">
            {playlist.tracks.length} canciones · {formatDuration(totalSeconds)}
          </p>

          {playlist.tracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="mt-6 flex items-center gap-2 bg-green-500 hover:bg-green-400 transition text-neutral-950 font-medium px-6 py-2.5 rounded-full mx-auto sm:mx-0"
            >
              <Play size={16} fill="currentColor" />
              Reproducir
            </button>
          )}
        </div>
      </div>

      {playlist.tracks.length === 0 ? (
        <p className="text-neutral-500 text-sm">Esta playlist todavía no tiene canciones.</p>
      ) : (
        <SongsTable
          tracks={playlist.tracks}
          currentTrackId={current?.id}
          onTrackSelect={handleSelect}
          onToggleFavorite={toggleFavorite}
          onRemoveFromPlaylist={handleRemove}
        />
      )}
    </div>
  );
}