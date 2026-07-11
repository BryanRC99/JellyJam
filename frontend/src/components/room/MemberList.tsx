import { Crown, UserX } from 'lucide-react';
import type { RoomState } from '../../store/roomStore';

interface Props {
  room: RoomState;
  currentUserId: string | undefined;
  onTransferHost: (userId: string) => void;
  onKick: (userId: string) => void;
}

export default function MemberList({
  room,
  currentUserId,
  onTransferHost,
  onKick,
}: Props) {
  const isHost = room.hostUserId === currentUserId;

  return (
    <div className="space-y-1">
      {room.members.map((m) => {
        const memberIsHost = m.userId === room.hostUserId;
        const isSelf = m.userId === currentUserId;

        return (
          <div
            key={m.userId}
            className="group flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-lg px-3 py-2 text-sm"
          >
            <span className="flex-1 truncate">
              {m.name}{' '}
              {isSelf && (
                <span className="text-neutral-500">(tú)</span>
              )}
            </span>

            {memberIsHost ? (
              <Crown
                size={14}
                className="text-yellow-500 flex-shrink-0"
              />
            ) : (
              isHost && (
                <>
                  {/* Mobile */}
                  <div className="flex sm:hidden items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onTransferHost(m.userId)}
                      title="Hacer host"
                      className="text-neutral-400 hover:text-yellow-500 transition p-1"
                    >
                      <Crown size={14} />
                    </button>

                    <button
                      onClick={() => onKick(m.userId)}
                      title="Expulsar de la sala"
                      className="text-neutral-400 hover:text-red-400 transition p-1"
                    >
                      <UserX size={14} />
                    </button>
                  </div>

                  {/* Desktop */}
                  <div className="hidden sm:group-hover:flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onTransferHost(m.userId)}
                      title="Hacer host"
                      className="text-neutral-400 hover:text-yellow-500 transition p-1"
                    >
                      <Crown size={14} />
                    </button>

                    <button
                      onClick={() => onKick(m.userId)}
                      title="Expulsar de la sala"
                      className="text-neutral-400 hover:text-red-400 transition p-1"
                    >
                      <UserX size={14} />
                    </button>
                  </div>
                </>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}