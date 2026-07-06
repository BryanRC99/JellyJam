import { Request, Response } from 'express';
import {
  getAudioItems,
  getFavoriteAudioItems,
  getAlbums,
  getAlbumById,
  getAlbumTracks,
  buildImageUrl,
  setFavorite,
} from '../jellyfin/jellyfin.service';
import { env } from '../../config/env';

function mapTrack(item: any, sessionToken: string, jellyfinToken: string) {
  return {
    id: item.Id,
    title: item.Name,
    artist: item.Artists?.[0] ?? 'Desconocido',
    album: item.Album ?? '',
    durationSeconds: item.RunTimeTicks ? Math.round(item.RunTimeTicks / 10_000_000) : 0,
    streamUrl: `${env.publicApiUrl}/music/stream/${item.Id}?token=${sessionToken}`,
    coverUrl: buildImageUrl(item.Id, jellyfinToken),
    isFavorite: item.UserData?.IsFavorite ?? false,
  };
}

export async function listTracksController(req: Request, res: Response) {
  const session = req.session!;
  const sessionToken = req.rawToken!;

  try {
    const items = await getAudioItems(session.jellyfinUserId, session.jellyfinToken);
    const tracks = items.map((item: any) => mapTrack(item, sessionToken, session.jellyfinToken));
    res.json({ tracks });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener canciones' });
  }
}

export async function listFavoriteTracksController(req: Request, res: Response) {
  const session = req.session!;
  const sessionToken = req.rawToken!;

  try {
    const items = await getFavoriteAudioItems(session.jellyfinUserId, session.jellyfinToken);
    const tracks = items.map((item: any) => mapTrack(item, sessionToken, session.jellyfinToken));
    res.json({ tracks });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener favoritos' });
  }
}

export async function addFavoriteController(req: Request, res: Response) {
  const session = req.session!;
  const { itemId } = req.params;

  try {
    await setFavorite(session.jellyfinUserId, session.jellyfinToken, itemId, true);
    res.json({ isFavorite: true });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'No se pudo marcar como favorito' });
  }
}

export async function removeFavoriteController(req: Request, res: Response) {
  const session = req.session!;
  const { itemId } = req.params;

  try {
    await setFavorite(session.jellyfinUserId, session.jellyfinToken, itemId, false);
    res.json({ isFavorite: false });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'No se pudo quitar de favoritos' });
  }
}

export async function listAlbumsController(req: Request, res: Response) {
  const session = req.session!;

  try {
    const items = await getAlbums(session.jellyfinUserId, session.jellyfinToken);

    const albums = items.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      artist: item.AlbumArtist ?? 'Varios artistas',
      year: item.ProductionYear ?? null,
      trackCount: item.ChildCount ?? 0,
      coverUrl: buildImageUrl(item.Id, session.jellyfinToken),
    }));

    res.json({ albums });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener álbumes' });
  }
}

export async function getAlbumController(req: Request, res: Response) {
  const session = req.session!;
  const sessionToken = req.rawToken!;
  const { albumId } = req.params;

  try {
    const [albumInfo, items] = await Promise.all([
      getAlbumById(session.jellyfinUserId, session.jellyfinToken, albumId),
      getAlbumTracks(session.jellyfinUserId, session.jellyfinToken, albumId),
    ]);

    const tracks = items.map((item: any) => ({
      ...mapTrack(item, sessionToken, session.jellyfinToken),
      trackNumber: item.IndexNumber ?? null,
    }));

    res.json({
      id: albumInfo.Id,
      name: albumInfo.Name,
      artist: albumInfo.AlbumArtist ?? 'Varios artistas',
      year: albumInfo.ProductionYear ?? null,
      coverUrl: buildImageUrl(albumInfo.Id, session.jellyfinToken),
      tracks,
    });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener el álbum' });
  }
}