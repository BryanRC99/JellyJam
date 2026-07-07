import { useState } from 'react';
import {
  Heart,
  ListPlus,
  ListMusic,
  Disc3,
  Mic2,
  Share2,
  Download,
  Info,
} from 'lucide-react';
import type { Track } from '../../types/track';
import MenuItem from './MenuItem';
import AddToPlaylistMenu from './AddToPlaylistMenu';

interface Props {
  track: Track;
  onToggleFavorite?: (track: Track) => void;
  onRemoveFromPlaylist?: (track: Track) => void;
  onClose: () => void;
}

export default function SongContextMenu({
  track,
  onToggleFavorite,
  onRemoveFromPlaylist,
  onClose,
}: Props) {
  const [view, setView] = useState<'menu' | 'add-to-playlist'>('menu');

  return (
    <div
      className="absolute right-0 top-8 z-50 w-64 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {view === 'add-to-playlist' ? (
        <AddToPlaylistMenu track={track} onBack={() => setView('menu')} onDone={onClose} />
      ) : (
        <>
          <MenuItem
            icon={Heart}
            label={track.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            onClick={() => {
              onToggleFavorite?.(track);
              onClose();
            }}
          />

          <div className="my-1 border-t border-neutral-800" />

          <MenuItem icon={ListPlus} label="Agregar a playlist" onClick={() => setView('add-to-playlist')} />

          {onRemoveFromPlaylist && (
            <MenuItem
              icon={ListMusic}
              label="Quitar de esta playlist"
              danger
              onClick={() => {
                onRemoveFromPlaylist(track);
                onClose();
              }}
            />
          )}

          <div className="my-1 border-t border-neutral-800" />

          <MenuItem icon={Disc3} label="Ir al álbum" />
          <MenuItem icon={Mic2} label="Ir al artista" />

          <div className="my-1 border-t border-neutral-800" />

          <MenuItem icon={Share2} label="Compartir" />
          <MenuItem icon={Download} label="Descargar" />
          <MenuItem icon={Info} label="Información" />
        </>
      )}
    </div>
  );
}