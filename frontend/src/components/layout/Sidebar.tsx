import {
  Home,
  Heart,
  Music2,
  Disc3,
  Users,
  ListMusic,
  Radio,
  Plus,
} from 'lucide-react';

import SidebarItem from './SidebarItem';

export default function Sidebar() {
  return (
    <aside className="w-72 bg-neutral-950 border-r border-neutral-900 flex flex-col">

      {/* Logo */}

      <div className="px-6 py-7 border-b border-neutral-900">

        <h1 className="text-2xl font-bold tracking-tight">
          JellyJam
        </h1>

        <p className="text-sm text-neutral-500 mt-1">
          Music powered by Jellyfin
        </p>

      </div>

      {/* Navegación */}

      <div className="px-4 py-6">

        <p className="text-xs uppercase text-neutral-500 mb-3 tracking-widest">
          Explorar
        </p>

        <div className="space-y-1">

          <SidebarItem
            to="/"
            icon={Home}
            label="Inicio"
          />

          <SidebarItem
            to="/favorites"
            icon={Heart}
            label="Canciones que te gustan"
          />

          <SidebarItem
            to="/songs"
            icon={Music2}
            label="Canciones"
          />

          <SidebarItem
            to="/albums"
            icon={Disc3}
            label="Álbumes"
          />

          <SidebarItem
            to="/artists"
            icon={Users}
            label="Artistas"
          />

          <SidebarItem
            to="/playlists"
            icon={ListMusic}
            label="Playlists"
          />

        </div>

      </div>

      {/* Jam */}

      <div className="px-4 py-6 border-t border-neutral-900">

        <p className="text-xs uppercase text-neutral-500 mb-3 tracking-widest">
          Music Jam
        </p>

        <div className="space-y-1">

          <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition">

            <Plus size={20} />

            <span className="text-sm font-medium">
              Crear sala
            </span>

          </button>

          <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition">

            <Radio size={20} />

            <span className="text-sm font-medium">
              Unirse
            </span>

          </button>

        </div>

      </div>

      {/* Footer */}

      <div className="mt-auto p-5 border-t border-neutral-900">

        <div className="rounded-lg bg-neutral-900 p-4">

          <p className="font-medium">
            JellyJam
          </p>

          <p className="text-xs text-neutral-500 mt-1">
            Versión 0.1.0
          </p>

        </div>

      </div>

    </aside>
  );
}