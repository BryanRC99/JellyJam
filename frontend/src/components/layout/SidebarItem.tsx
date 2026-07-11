import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface SidebarItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

export default function SidebarItem({
  to,
  icon: Icon,
  label,
}: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 md:py-1.5 transition-colors ${
          isActive
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'
        }`
      }
    >
      <Icon size={20} className="shrink-0" />
      <span className="truncate text-sm font-medium">{label}</span>
    </NavLink>
  );
}