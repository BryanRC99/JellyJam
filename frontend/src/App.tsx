import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import Songs from './pages/Songs';
import Albums from './pages/Albums';
import AlbumDetail from './pages/AlbumDetail';
import Artists from './pages/Artists';
import ArtistDetail from './pages/ArtistDetail';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Room from './pages/Room';
import RoomJoin from './pages/RoomJoin';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/songs" element={<Songs />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/albums/:albumId" element={<AlbumDetail />} />
          <Route path="/artists" element={<Artists />} />
          <Route path="/artists/:artistId" element={<ArtistDetail />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlists/:playlistId" element={<PlaylistDetail />} />
          <Route path="/room" element={<Room />} />
          <Route path="/room/join" element={<RoomJoin />} />
        </Route>
      </Route>
    </Routes>
  );
}