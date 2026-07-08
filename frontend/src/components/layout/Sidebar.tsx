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
import { useNavigate } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import { apiFetch } from '../../lib/api';
import { useRoomStore } from '../../store/roomStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const joinRoom = useRoomStore((s) => s.joinRoom);

  async function handleCreateRoom() {
    const room = await apiFetch('/rooms', {
      method: 'POST',
      body: JSON.stringify({ allowGuestControl: true }),
    });
    joinRoom(room.code);
    navigate('/room');
  }

  return (
    <aside className="w-64 lg:w-72 shrink-0 bg-neutral-950 border-r border-neutral-900 flex flex-col min-h-0">
      <div className="shrink-0 px-5 lg:px-6 py-5 border-b border-neutral-900">
        <h1 className="text-2xl font-bold tracking-tight">JellyJam</h1>
        <p className="text-sm text-neutral-500 mt-1">Music powered by Jellyfin</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="px-3 lg:px-4 py-3">
          <p className="text-xs uppercase text-neutral-500 mb-2 tracking-widest">Explorar</p>

          <div className="space-y-1">
            <SidebarItem to="/" icon={Home} label="Inicio" />
            <SidebarItem to="/favorites" icon={Heart} label="Canciones que te gustan" />
            <SidebarItem to="/songs" icon={Music2} label="Canciones" />
            <SidebarItem to="/albums" icon={Disc3} label="Álbumes" />
            <SidebarItem to="/artists" icon={Users} label="Artistas" />
            <SidebarItem to="/playlists" icon={ListMusic} label="Playlists" />
          </div>
        </div>

        <div className="px-3 lg:px-4 py-3 border-t border-neutral-900">
          <p className="text-xs uppercase text-neutral-500 mb-2 tracking-widest">Music Jam</p>

          <div className="space-y-1">
            <button
              onClick={handleCreateRoom}
              className="w-full flex min-w-0 items-center gap-3 rounded-lg px-3 py-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
            >
              <Plus size={20} className="shrink-0" />
              <span className="truncate text-sm font-medium">Crear sala</span>
            </button>

            <button
              onClick={() => navigate('/room/join')}
              className="w-full flex min-w-0 items-center gap-3 rounded-lg px-3 py-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
            >
              <Radio size={20} className="shrink-0" />
              <span className="truncate text-sm font-medium">Unirse</span>
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 p-3 lg:p-4 border-t border-neutral-900">
        <div className="rounded-lg bg-neutral-900 px-3 py-2.5">
          <p className="text-sm font-semibold">JellyJam</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Versión 0.1.0</p>
        </div>
      </div>
    </aside>
  );
}
