import { Play } from 'lucide-react';
import CoverImage from '../common/CoverImage';

interface MusicCardProps {
  image: string | null;
  title: string;
  subtitle?: string;
  rounded?: boolean;
  onClick?: () => void;
}

export default function MusicCard({ image, title, subtitle, rounded = false, onClick }: MusicCardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 transition-all duration-200 p-4 text-left"
    >
      <div className="relative">
        <CoverImage
          src={image}
          name={title}
          rounded={rounded}
          className="aspect-square w-full text-2xl transition-transform duration-300 group-hover:scale-[1.03]"
        />

        <div
          className={`absolute h-11 w-11 rounded-full bg-green-500 flex items-center justify-center opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl ${
            rounded ? 'right-2 bottom-2' : 'right-3 bottom-3'
          }`}
        >
          <Play size={18} fill="black" className="ml-0.5 text-black" />
        </div>
      </div>

      <div className={`mt-4 ${rounded ? 'text-center' : ''}`}>
        <p className="font-semibold truncate">{title}</p>
        {subtitle && <p className="text-sm text-neutral-400 truncate mt-1">{subtitle}</p>}
      </div>
    </button>
  );
}