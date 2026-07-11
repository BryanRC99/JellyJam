import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4 sm:mb-5">
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
          {title}
        </h2>

        {subtitle && (
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>

      {actionLabel && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs sm:text-sm text-neutral-400 hover:text-white transition shrink-0"
        >
          {actionLabel}

          <ChevronRight
            size={15}
            className="sm:hidden"
          />

          <ChevronRight
            size={16}
            className="hidden sm:block"
          />
        </button>
      )}
    </div>
  );
}