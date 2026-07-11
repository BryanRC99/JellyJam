import type { Track } from '../../types/track';

interface TrackInfoProps {
  track: Track;
  active?: boolean;
}

export default function TrackInfo({
  track,
  active = false,
}: TrackInfoProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">

      <img
        src={track.coverUrl}
        alt={track.title}
        className="
          w-9
          h-9
          sm:w-10
          sm:h-10

          rounded-md
          object-cover
          bg-neutral-800
          flex-shrink-0
        "
      />

      <div className="overflow-hidden min-w-0">

        <p
          className={`
            truncate
            text-sm
            sm:text-base
            font-medium

            ${
              active
                ? 'text-green-500'
                : 'text-white'
            }
          `}
        >
          {track.title}
        </p>

        <p className="text-xs sm:text-sm text-neutral-400 truncate">
          {track.artist}
        </p>

      </div>

    </div>
  );
}