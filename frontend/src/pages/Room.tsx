import { useNavigate } from 'react-router-dom';
import { Copy, Users, LogOut } from 'lucide-react';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { apiFetch } from '../lib/api';
import MemberList from '../components/room/MemberList';

export default function Room() {
  const room = useRoomStore((s) => s.room);
  const leaveRoom = useRoomStore((s) => s.leaveRoom);
  const transferHost = useRoomStore((s) => s.transferHost);
  const kickMember = useRoomStore((s) => s.kickMember);
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.showToast);
  const navigate = useNavigate();

  if (!room) {
    return <div className="p-8 text-neutral-400">Conectando a la sala...</div>;
  }

  const isHost = room.hostUserId === user?.id;
  const inviteLink = `${window.location.origin}/room/join?code=${room.code}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(inviteLink);
    showToast('Link de invitación copiado');
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(room!.code);
    showToast('Código copiado');
  }

  async function handleToggleGuestControl() {
    try {
      await apiFetch(`/rooms/${room!.id}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ allowGuestControl: !room!.allowGuestControl }),
      });
    } catch {
      showToast('No se pudo cambiar el permiso', 'error');
    }
  }

  function handleTransferHost(targetUserId: string) {
    transferHost(targetUserId);
    showToast('Host transferido');
  }

  function handleKick(targetUserId: string) {
    kickMember(targetUserId);
    showToast('Miembro expulsado');
  }

  function handleLeave() {
    leaveRoom();
    showToast('Saliste de la sala');
    navigate('/');
  }

  return (
    <div className="p-8 text-white max-w-lg">
      <div className="flex items-center gap-2 mb-1">
        <Users size={20} className="text-green-500" />
        <h1 className="text-2xl font-bold">Sala {room.code}</h1>
      </div>
      <p className="text-neutral-400 mb-6">Comparte el código o el link para invitar amigos</p>

      <div className="flex gap-2 mb-8">
        <button
          onClick={handleCopyCode}
          className="flex-1 flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 transition rounded-lg px-4 py-2.5 text-sm font-mono font-bold"
        >
          {room.code}
          <Copy size={14} />
        </button>
        <button
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 transition text-neutral-950 rounded-lg px-4 py-2.5 text-sm font-medium"
        >
          Copiar link
          <Copy size={14} />
        </button>
      </div>

      <h2 className="font-semibold mb-3">Miembros ({room.members.length})</h2>
      <div className="mb-8">
        <MemberList room={room} currentUserId={user?.id} onTransferHost={handleTransferHost} onKick={handleKick} />
      </div>

      {isHost && (
        <div className="flex items-center justify-between bg-neutral-900 rounded-lg px-4 py-3 mb-8">
          <div>
            <p className="text-sm font-medium">Control de invitados</p>
            <p className="text-xs text-neutral-500">Permitir que cualquiera pause/salte canciones</p>
          </div>
          <button
            onClick={handleToggleGuestControl}
            className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
              room.allowGuestControl ? 'bg-green-500' : 'bg-neutral-700'
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                room.allowGuestControl ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      )}

      <p className="text-sm text-neutral-500 mb-4">
        Agrega canciones a la cola desde cualquier lista — usa el menú de 3 puntos y elige "Agregar a la cola".
      </p>

      <button onClick={handleLeave} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition text-sm">
        <LogOut size={16} />
        Salir de la sala
      </button>
    </div>
  );
}