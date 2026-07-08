import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Player from '../Player';
import ToastContainer from '../common/ToastContainer';
import { useTracks } from '../../hooks/useTracks';
import { useRoomKickWatcher } from '../../hooks/useRoomKickWatcher';

export default function AppLayout() {
  useTracks();
  useRoomKickWatcher();

  return (
    <div className="h-screen overflow-hidden bg-neutral-950 text-neutral-100 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-neutral-950">
          <Outlet />
        </main>
      </div>
      <Player />
      <ToastContainer />
    </div>
  );
}