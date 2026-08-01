import { Request, Response } from 'express';
import { buildDjBlock } from './dj-blocks.service';
import { getBlock } from './dj-blocks.store';
import { JellyfinError } from '../jellyfin/jellyfin.service';
import { inspectLibrary } from './dj-blocks.service';
import { listLibraryArtists } from './dj-blocks.service';

export async function createBlockController(req: Request, res: Response) {
  const session = req.session!;
  const { genre, era, yearFrom, yearTo, count } = req.body ?? {};

  try {
    const block = await buildDjBlock(session.jellyfinUserId, session.jellyfinToken, {
      genre,
      era,
      yearFrom,
      yearTo,
      count,
    });

    res.json({
      blockId: block.id,
      script: block.script,
      trackIds: block.trackIds,
      tracks: block.tracks,
    });
  } catch (err: any) {
    console.error('Error generando bloque de DJ', err);
    if (err instanceof JellyfinError && err.status === 401) {
      return res.status(401).json({ error: 'Sesión de Jellyfin expirada' });
    }
    res.status(400).json({ error: err.message ?? 'No se pudo generar el bloque' });
  }
}

export function getBlockAudioController(req: Request, res: Response) {
  const { blockId } = req.params as { blockId: string };
  const block = getBlock(blockId);

  if (!block) {
    return res.status(404).json({ error: 'Bloque no encontrado o expirado' });
  }

  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Content-Length', block.audio.length);
  res.send(block.audio);
}

export async function debugController(req: Request, res: Response) {
  const session = req.session!;
  try {
    const data = await inspectLibrary(session.jellyfinUserId, session.jellyfinToken);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? 'No se pudo inspeccionar la librería' });
  }
}

export async function listArtistsController(req: Request, res: Response) {
  const session = req.session!;
  try {
    const data = await listLibraryArtists(session.jellyfinUserId, session.jellyfinToken);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? 'No se pudo listar artistas' });
  }
}