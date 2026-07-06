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
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {title}
        </h2>

        {subtitle && (
          <p className="text-sm text-neutral-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {actionLabel && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition"
        >
          {actionLabel}
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}