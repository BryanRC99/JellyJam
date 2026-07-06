import { Play } from 'lucide-react';

interface MusicCardProps {
  image: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
}

export default function MusicCard({
  image,
  title,
  subtitle,
  onClick,
}: MusicCardProps) {
  return (
    <button
      onClick={onClick}
      className="
        group
        w-full
        rounded-xl
        bg-neutral-900
        hover:bg-neutral-800
        transition-all
        duration-200
        p-4
        text-left
      "
    >
      <div className="relative">

        <img
          src={image}
          alt={title}
          className="
            aspect-square
            w-full
            rounded-lg
            object-cover
            bg-neutral-800
            transition-transform
            duration-300
            group-hover:scale-[1.03]
          "
        />

        <div
          className="
            absolute
            bottom-3
            right-3

            h-11
            w-11

            rounded-full

            bg-green-500

            flex
            items-center
            justify-center

            opacity-0
            translate-y-3

            group-hover:opacity-100
            group-hover:translate-y-0

            transition-all
            duration-300

            shadow-xl
          "
        >
          <Play
            size={18}
            fill="black"
            className="ml-0.5 text-black"
          />
        </div>

      </div>

      <div className="mt-4">

        <p className="font-semibold truncate">
          {title}
        </p>

        <p className="text-sm text-neutral-400 truncate mt-1">
          {subtitle}
        </p>

      </div>
    </button>
  );
}