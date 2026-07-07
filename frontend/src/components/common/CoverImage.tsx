import { getInitials, getColorForName } from '../../utils/getInitials';

interface CoverImageProps {
  src: string | null;
  name: string;
  rounded?: boolean;
  className?: string;
}

export default function CoverImage({ src, name, rounded = false, className = '' }: CoverImageProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`object-cover bg-neutral-800 ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center text-white font-bold ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={{ backgroundColor: getColorForName(name) }}
    >
      {getInitials(name)}
    </div>
  );
}