import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '../lib/socket';

const PING_INTERVAL_MS = 15000; // recalibra cada 15s, sin saturar de mensajes
const SAMPLE_COUNT = 5; // promedia las últimas 5 mediciones para suavizar jitter de red

export function useClockSync() {
  const offsetRef = useRef(0); // ms: serverNow ≈ Date.now() + offset
  const [, forceRender] = useState(0); // solo para refrescar el valor mostrado en UI de debug

  useEffect(() => {
    const socket = getSocket();
    const samples: number[] = [];

    function ping() {
      socket.emit('room:ping', { clientSentAt: Date.now() });
    }

    function handlePong({ clientSentAt, serverTime }: { clientSentAt: number; serverTime: number }) {
      const clientReceivedAt = Date.now();
      const rtt = clientReceivedAt - clientSentAt;
      const sampleOffset = serverTime - clientSentAt - rtt / 2;

      samples.push(sampleOffset);
      if (samples.length > SAMPLE_COUNT) samples.shift();

      offsetRef.current = samples.reduce((a, b) => a + b, 0) / samples.length;
      forceRender((n) => n + 1);
    }

    socket.on('room:pong', handlePong);
    ping();
    const interval = setInterval(ping, PING_INTERVAL_MS);

    return () => {
      socket.off('room:pong', handlePong);
      clearInterval(interval);
    };
  }, []);

  const getServerNow = useCallback(() => Date.now() + offsetRef.current, []);

  return { offset: offsetRef.current, getServerNow };
}