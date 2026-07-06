import { Outlet } from 'react-router-dom';

import Sidebar from './Sidebar';
import Player from '../Player';

export default function AppLayout() {
  return (
    <div className="h-screen bg-neutral-950 text-neutral-100 flex flex-col">

      <div className="flex flex-1 overflow-hidden">

        <Sidebar />

        <main className="flex-1 overflow-y-auto bg-neutral-950">

          <Outlet />

        </main>

      </div>

      <Player />

    </div>
  );
}