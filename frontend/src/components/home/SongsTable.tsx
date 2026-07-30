import { useState } from 'react';
import { Clock, Play, CheckSquare, Square, X, ListPlus, ListMusic } from 'lucide-react';
import type { Track } from '../../types/track';
import { formatDuration } from '../../utils/formatDuration';
import TrackInfo from '../common/TrackInfo';
import SongActions from './SongActions';
import BulkPlaylistPicker from './BulkPlaylistPicker';
import { useRoomStore } from '../../store/roomStore';
import { usePlayerStore } from '../../store/playerStore';
import { useToastStore } from '../../store/toastStore';

interface SongsTableProps {
  tracks: Track[];
  currentTrackId?: string;
  onTrackSelect?: (track: Track) => void;
  onToggleFavorite?: (track: Track) => void;
  onRemoveFromPlaylist?: (track: Track) => void;
}

// En mobile la columna "Álbum" no se renderiza (hidden), así que el grid
// tiene 4 columnas reales en vez de 5. Desde sm: se agrega la 5ta columna
// para el álbum, coincidiendo con los elementos que sí se muestran.
const GRID_COLS = 'grid-cols-[24px_1fr_72px_56px] sm:grid-cols-[24px_1fr_180px_72px_64px]';
const GRID_COLS_SELECT = 'grid-cols-[24px_24px_1fr_72px] sm:grid-cols-[24px_24px_1fr_180px_72px]';

export default function SongsTable({
  tracks,
  currentTrackId,
  onTrackSelect,
  onToggleFavorite,
  onRemoveFromPlaylist,
}: SongsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);

  const room = useRoomStore((s) => s.room);
  const roomAddToQueue = useRoomStore((s) => s.addToQueue);
  const localAddToQueue = usePlayerStore((s) => s.addToQueue);
  const showToast = useToastStore((s) => s.showToast);

  const selectedTracks = tracks.filter((t) => selectedIds.has(t.id));

  function toggleSelectionMode() {
    setSelectionMode((v) => !v);
    setSelectedIds(new Set());
  }

  function toggleSelected(trackId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }

  function handleRowClick(track: Track) {
    if (selectionMode) {
      toggleSelected(track.id);
      return;
    }
    setOpenMenuId(null);
    onTrackSelect?.(track);
  }

  function handleBulkAddToQueue() {
    selectedTracks.forEach((track) => {
      if (room) roomAddToQueue(track.id);
      else localAddToQueue(track as any);
    });
    showToast(`${selectedTracks.length} canciones añadidas a la cola`);
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  function handleBulkPlaylistDone() {
    setShowPlaylistPicker(false);
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  const cols = selectionMode ? GRID_COLS_SELECT : GRID_COLS;

  return (
    <div className="w-full text-left select-none">
      {/* Barra de modo selección */}
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={toggleSelectionMode}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition px-2 py-1 rounded-md hover:bg-neutral-800"
        >
          {selectionMode ? <X size={14} /> : <CheckSquare size={14} />}
          {selectionMode ? 'Cancelar' : 'Seleccionar'}
        </button>
      </div>

      {/* Header */}
      <div
        className={`grid ${cols} gap-3 sm:gap-4 px-3 sm:px-4 py-2 border-b border-neutral-800/60 text-neutral-400 text-xs font-medium uppercase tracking-wide`}
      >
        {selectionMode ? <div /> : <div className="text-center">#</div>}
        {selectionMode && <div />}
        <div>Título</div>
        <div className="hidden sm:block">Álbum</div>
        {!selectionMode && <div />}
        <div className="flex justify-end pr-2">
          <Clock size={14} />
        </div>
      </div>

      {/* Filas */}
      <div className="mt-1">
        {tracks.map((track, index) => {
          const isCurrent = track.id === currentTrackId;
          const isSelected = selectedIds.has(track.id);

          return (
            <div
              key={track.id}
              onClick={() => handleRowClick(track)}
              className={`group grid ${cols} gap-3 sm:gap-4 px-3 sm:px-4 py-2 sm:py-1.5 rounded-lg items-center cursor-pointer transition-colors duration-150 ${
                isSelected
                  ? 'bg-green-500/10'
                  : isCurrent
                  ? 'bg-neutral-800/50'
                  : 'hover:bg-neutral-800/70'
              }`}
            >
              {selectionMode ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelected(track.id);
                  }}
                  className="flex items-center justify-center w-4 h-4 text-neutral-400 hover:text-white"
                >
                  {isSelected ? (
                    <CheckSquare size={16} className="text-green-500" />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              ) : (
                <div className="flex items-center justify-center relative w-4 h-4">
                  <span
                    className={`text-sm transition-opacity md:group-hover:opacity-0 ${
                      isCurrent ? 'text-green-500 font-semibold' : 'text-neutral-500'
                    }`}
                  >
                    {index + 1}
                  </span>

                  <div className="absolute opacity-0 md:group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center">
                    <Play
                      size={13}
                      fill={isCurrent ? '#22c55e' : 'white'}
                      className={isCurrent ? 'text-green-500' : 'text-white'}
                    />
                  </div>
                </div>
              )}

              {/* Información de la canción */}
              <TrackInfo track={track} active={isCurrent} />

              {/* Álbum */}
              <div className="hidden sm:block text-sm text-neutral-400 truncate pr-2">
                {track.album}
              </div>

              {/* Acciones (ocultas en modo selección) */}
              {!selectionMode && (
                <SongActions
                  track={track}
                  isOpen={openMenuId === track.id}
                  onOpen={() => setOpenMenuId(track.id)}
                  onClose={() => setOpenMenuId(null)}
                  onToggleFavorite={onToggleFavorite}
                  onRemoveFromPlaylist={onRemoveFromPlaylist}
                />
              )}

              {/* Duración */}
              <div className="flex justify-end pr-1 sm:pr-2 text-xs text-neutral-500 font-medium tabular-nums">
                {formatDuration(track.durationSeconds)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra flotante de acciones en batch */}
      {selectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-neutral-900 border border-neutral-700 rounded-full shadow-2xl px-3 py-2">
          <span className="text-sm font-medium px-2 whitespace-nowrap">
            {selectedIds.size} seleccionadas
          </span>

          <button
            onClick={handleBulkAddToQueue}
            className="flex items-center gap-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 transition rounded-full px-3 py-1.5"
          >
            <ListMusic size={14} />
            <span className="hidden sm:inline">Cola</span>
          </button>

          <button
            onClick={() => setShowPlaylistPicker(true)}
            className="flex items-center gap-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 transition rounded-full px-3 py-1.5"
          >
            <ListPlus size={14} />
            <span className="hidden sm:inline">Playlist</span>
          </button>

          <button
            onClick={() => {
              setSelectionMode(false);
              setSelectedIds(new Set());
            }}
            className="text-neutral-400 hover:text-white transition p-1.5"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showPlaylistPicker && (
        <BulkPlaylistPicker
          tracks={selectedTracks}
          onClose={() => setShowPlaylistPicker(false)}
          onDone={handleBulkPlaylistDone}
        />
      )}
    </div>
  );
}