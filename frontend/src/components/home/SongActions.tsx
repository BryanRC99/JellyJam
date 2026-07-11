import { useRef } from 'react';
import { Heart, MoreHorizontal } from 'lucide-react';
import type { Track } from '../../types/track';
import SongContextMenu from './SongContextMenu';
import { useClickOutside } from '../../hooks/useClickOutside';

interface SongActionsProps {
  track: Track;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggleFavorite?: (track: Track) => void;
  onRemoveFromPlaylist?: (track: Track) => void;
}

export default function SongActions({
  track,
  isOpen,
  onOpen,
  onClose,
  onToggleFavorite,
  onRemoveFromPlaylist,
}: SongActionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Solo escucha clics afuera mientras ESTE menú está abierto (eficiente con listas grandes)
  useClickOutside(containerRef, onClose, isOpen);

  return (
    <div ref={containerRef} className="relative flex items-center justify-end gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(track);
        }}
        className="flex items-center justify-center transition-opacity"
        style={{ opacity: track.isFavorite ? 1 : undefined }}
      >
        <Heart
          size={15}
          fill={track.isFavorite ? '#22c55e' : 'none'}
          className={`transition-colors ${
            track.isFavorite ? 'text-green-500' : 'text-neutral-500 hover:text-white'
          } ${!track.isFavorite ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100' : ''}`}
        />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          isOpen ? onClose() : onOpen();
        }}
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-white"
      >
        <MoreHorizontal size={17} />
      </button>

      {isOpen && (
        <SongContextMenu track={track} onToggleFavorite={onToggleFavorite} onRemoveFromPlaylist={onRemoveFromPlaylist} onClose={onClose} />
      )}
    </div>
  );
}