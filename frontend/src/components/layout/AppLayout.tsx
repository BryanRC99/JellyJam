import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Player from '../Player';
import ToastContainer from '../common/ToastContainer';
import { useTracks } from '../../hooks/useTracks';
import { useRoomKickWatcher } from '../../hooks/useRoomKickWatcher';
import NowPlaying from '../NowPlaying';

export default function AppLayout() {
  useTracks();
  useRoomKickWatcher();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col">
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Barra superior — solo visible en mobile */}
          <header className="md:hidden shrink-0 flex items-center gap-3 px-4 h-14 border-b border-neutral-900 bg-neutral-950">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-neutral-300 hover:text-white transition p-1 -ml-1"
              aria-label="Abrir menú"
            >
              <Menu size={22} />
            </button>
            <span className="text-base font-bold tracking-tight text-white">JellyJam</span>
          </header>

          <main className="flex-1 min-w-0 overflow-y-auto bg-neutral-950">
            <Outlet />
          </main>
        </div>
      </div>
      <Player />
      <ToastContainer />
      <NowPlaying />
    </div>
  );
}