import type { LucideIcon } from 'lucide-react';

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  danger?: boolean;
  onClick?: () => void;
}

export default function MenuItem({
  icon: Icon,
  label,
  danger = false,
  onClick,
}: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 sm:py-2 text-sm transition-colors
      ${
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-neutral-200 hover:bg-neutral-800'
      }`}
    >
      <Icon size={16} className="sm:hidden" />
      <Icon size={17} className="hidden sm:block" />
      <span>{label}</span>
    </button>
  );
}