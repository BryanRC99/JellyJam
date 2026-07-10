import { Request, Response } from 'express';
import { getAudioItemById } from '../jellyfin/jellyfin.service';
import { getLyricsForTrack } from './lyrics.service';

export async function getLyricsController(req: Request, res: Response) {
  const session = req.session!;
  const { itemId } = req.params as { itemId: string };

  try {
    const item = await getAudioItemById(session.jellyfinUserId, session.jellyfinToken, itemId);

    const meta = {
      title: item.Name as string,
      artist: item.Artists?.[0] ?? '',
      album: item.Album ?? '',
      durationSeconds: item.RunTimeTicks ? Math.round(item.RunTimeTicks / 10_000_000) : 0,
    };

    const lyrics = await getLyricsForTrack(itemId, meta);
    res.json(lyrics);
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'No se pudieron obtener las letras' });
  }
}