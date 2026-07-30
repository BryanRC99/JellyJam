import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../../lib/socket';

interface FloatingReaction {
  id: string;
  emoji: string;
  left: number; // posición horizontal en % dentro del contenedor
}

export default function ReactionOverlay() {
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    const socket = getSocket();

    function handleReaction({ id, emoji }: { id: string; emoji: string }) {
      const left = 20 + Math.random() * 60; // evita que salgan pegadas al borde
      setReactions((prev) => [...prev, { id, emoji, left }]);

      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2200);
    }

    socket.on('room:reaction', handleReaction);
    return () => {
      socket.off('room:reaction', handleReaction);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {reactions.map((r) => (
        <span
          key={r.id}
          className="absolute bottom-24 text-3xl animate-float-up select-none"
          style={{ left: `${r.left}%` }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}