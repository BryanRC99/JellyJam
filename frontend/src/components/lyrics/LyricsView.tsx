import { useEffect, useRef } from 'react';
import { useLyrics } from '../../hooks/useLyrics';
import { parseLrc, getActiveLineIndex } from '../../utils/parseLrc';

interface Props {
  trackId: string | undefined;
  progress: number;
  onSeek?: (seconds: number) => void;
  compact?: boolean;
}

export default function LyricsView({
  trackId,
  progress,
  onSeek,
  compact = false,
}: Props) {
  const { data, isLoading, error } = useLyrics(trackId);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  const syncedLines = data?.syncedLyrics ? parseLrc(data.syncedLyrics) : [];
  const activeIndex =
    syncedLines.length > 0
      ? getActiveLineIndex(syncedLines, progress)
      : -1;

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 text-sm px-4 sm:px-6">
        Buscando letras...
      </div>
    );
  }

  if (error || !data || !data.hasLyrics) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 text-sm px-4 sm:px-6 text-center">
        No encontramos letras para esta canción
      </div>
    );
  }

  if (data.instrumental) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 text-sm px-4 sm:px-6 text-center">
        Esta canción es instrumental
      </div>
    );
  }

  if (syncedLines.length === 0) {
    return (
      <div className="h-full overflow-y-auto px-4 sm:px-6 py-6 sm:py-8">
        <p className="whitespace-pre-line text-neutral-300 leading-relaxed text-sm sm:text-base">
          {data.plainLyrics}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-y-auto px-4 sm:px-6 md:px-10 ${
        compact ? 'py-4' : 'py-[28vh] sm:py-[35vh]'
      }`}
      style={
        !compact
          ? {
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
              maskImage:
                'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
            }
          : undefined
      }
    >
      <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-2.5 sm:gap-3'}`}>
        {syncedLines.map((line, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;

          let fillPercent = isPast ? 100 : 0;

          if (isActive) {
            const nextTime =
              syncedLines[index + 1]?.time ?? line.time + 4;

            const span = Math.max(nextTime - line.time, 0.1);

            fillPercent = Math.min(
              100,
              Math.max(
                0,
                ((progress - line.time) / span) * 100
              )
            );
          }

          const fillStyle: React.CSSProperties = isActive
            ? {
                backgroundImage: `linear-gradient(to right, #fff 0%, #fff ${fillPercent}%, rgba(163,163,163,0.5) ${fillPercent}%, rgba(163,163,163,0.5) 100%)`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }
            : {};

          return (
            <p
              key={`${line.time}-${index}`}
              ref={isActive ? activeLineRef : undefined}
              onClick={() => onSeek?.(line.time)}
              style={fillStyle}
              className={`font-bold text-left transition-transform duration-200 ${
                compact
                  ? 'text-sm'
                  : 'text-xl sm:text-2xl md:text-3xl'
              } ${
                isActive ? '' : 'text-neutral-500'
              } ${
                onSeek
                  ? 'cursor-pointer hover:opacity-80'
                  : ''
              }`}
            >
              {line.text || '♪'}
            </p>
          );
        })}
      </div>
    </div>
  );
}