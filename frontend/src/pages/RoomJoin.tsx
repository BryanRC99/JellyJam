import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoomStore } from '../store/roomStore';

export default function RoomJoin() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const joinRoom = useRoomStore((s) => s.joinRoom);
  const navigate = useNavigate();

  function handleJoin() {
    if (!code.trim()) return;
    joinRoom(code.trim().toUpperCase());
    navigate('/room');
  }

  useEffect(() => {
    if (searchParams.get('code')) handleJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 sm:p-8 text-white max-w-sm mx-auto md:mx-0">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Unirse a una sala</h1>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        placeholder="Código de sala"
        className="w-full bg-neutral-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 mb-4"
        autoFocus
      />
      <button
        onClick={handleJoin}
        className="w-full sm:w-auto bg-green-500 hover:bg-green-400 text-neutral-950 font-medium px-6 py-2 rounded-full"
      >
        Entrar
      </button>
    </div>
  );
}