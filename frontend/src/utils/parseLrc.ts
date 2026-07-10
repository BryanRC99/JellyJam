export interface LyricLine {
  time: number; // segundos
  text: string;
}

// Parsea el formato LRC estándar: [mm:ss.xx] texto (puede haber varias marcas por línea)
export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timeTag = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

  for (const rawLine of lrc.split('\n')) {
    const tags = [...rawLine.matchAll(timeTag)];
    if (tags.length === 0) continue;

    const text = rawLine.replace(timeTag, '').trim();

    for (const tag of tags) {
      const minutes = Number(tag[1]);
      const seconds = Number(tag[2]);
      const fraction = tag[3] ? Number(tag[3].padEnd(3, '0')) / 1000 : 0;
      lines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

export function getActiveLineIndex(lines: LyricLine[], progress: number): number {
  let active = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= progress) active = i;
    else break;
  }
  return active;
}