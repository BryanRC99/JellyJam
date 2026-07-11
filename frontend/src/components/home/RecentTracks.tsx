import SectionHeader from './SectionHeader';
import MusicCard from './MusicCard';
import type { Track } from '../../types/track';

interface RecentTracksProps {
  title: string;
  subtitle?: string;
  tracks: Track[];
  onPlay: (track: Track, queue: Track[]) => void;
}

export default function RecentTracks({
  title,
  subtitle,
  tracks,
  onPlay,
}: RecentTracksProps) {
  if (tracks.length === 0) return null;

  return (
    <section className="mb-8 sm:mb-10">
      <SectionHeader title={title} subtitle={subtitle} />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {tracks.map((track) => (
          <MusicCard
            key={track.id}
            image={track.coverUrl}
            title={track.title}
            subtitle={track.artist}
            onClick={() => onPlay(track, tracks)}
          />
        ))}
      </div>
    </section>
  );
}