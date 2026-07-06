import { useState } from 'react';
import { Clock, Play } from 'lucide-react';
import type { Track } from '../../types/track';
import { formatDuration } from '../../utils/formatDuration';
import TrackInfo from '../common/TrackInfo';
import SongActions from './SongActions';

interface SongsTableProps {
  tracks: Track[];
  currentTrackId?: string;
  onTrackSelect?: (track: Track) => void;
  onToggleFavorite?: (track: Track) => void;
}

const GRID_COLS = 'grid-cols-[24px_1fr_180px_72px_64px]';

export default function SongsTable({
  tracks,
  currentTrackId,
  onTrackSelect,
  onToggleFavorite,
}: SongsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div className="w-full text-left select-none">
      {/* Header */}
      <div
        className={`grid ${GRID_COLS} gap-4 px-4 py-2 border-b border-neutral-800/60 text-neutral-400 text-xs font-medium uppercase tracking-wide`}
      >
        <div className="text-center">#</div>
        <div>Título</div>
        <div className="hidden sm:block">Álbum</div>
        <div />
        <div className="flex justify-end pr-2">
          <Clock size={14} />
        </div>
      </div>

      {/* Filas */}
      <div className="mt-1">
        {tracks.map((track, index) => {
          const isCurrent = track.id === currentTrackId;

          return (
            <div
              key={track.id}
              onClick={() => {
                setOpenMenuId(null);
                onTrackSelect?.(track);
              }}
              className={`group grid ${GRID_COLS} gap-4 px-4 py-1.5 rounded-lg items-center cursor-pointer transition-colors duration-150 ${
                isCurrent
                  ? 'bg-neutral-800/50'
                  : 'hover:bg-neutral-800/70'
              }`}
            >
              {/* Número / Play */}
              <div className="flex items-center justify-center relative w-4 h-4">
                <span
                  className={`text-sm transition-opacity group-hover:opacity-0 ${
                    isCurrent
                      ? 'text-green-500 font-semibold'
                      : 'text-neutral-500'
                  }`}
                >
                  {index + 1}
                </span>

                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play
                    size={13}
                    fill={isCurrent ? '#22c55e' : 'white'}
                    className={
                      isCurrent
                        ? 'text-green-500'
                        : 'text-white'
                    }
                  />
                </div>
              </div>

              {/* Información de la canción */}
              <TrackInfo
                track={track}
                active={isCurrent}
              />

              {/* Álbum */}
              <div className="hidden sm:block text-sm text-neutral-400 truncate pr-2">
                {track.album}
              </div>

              {/* Acciones */}
              <SongActions
                track={track}
                isOpen={openMenuId === track.id}
                onOpen={() => setOpenMenuId(track.id)}
                onClose={() => setOpenMenuId(null)}
                onToggleFavorite={onToggleFavorite}
              />

              {/* Duración */}
              <div className="flex justify-end pr-2 text-xs text-neutral-500 font-medium tabular-nums">
                {formatDuration(track.durationSeconds)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}