import { Request, Response } from 'express';
import {
  getAudioItems,
  getFavoriteAudioItems,
  getAlbums,
  getAlbumById,
  getAlbumTracks,
  getArtists,
  getArtistById,
  getArtistAlbums,
  getArtistTracks,
  getUserPlaylists,
  getPlaylistById,
  getPlaylistTracks,
  createPlaylist,
  addItemToPlaylist,
  removeItemFromPlaylist,
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

function imageUrlOrNull(item: any, jellyfinToken: string): string | null {
  return item.ImageTags?.Primary ? buildImageUrl(item.Id, jellyfinToken) : null;
}

export async function listTracksController(req: Request, res: Response) {
  const session = req.session!;
  const sessionToken = req.rawToken!;
  try {
    const items = await getAudioItems(session.jellyfinUserId, session.jellyfinToken);
    res.json({ tracks: items.map((item: any) => mapTrack(item, sessionToken, session.jellyfinToken)) });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener canciones' });
  }
}

export async function listFavoriteTracksController(req: Request, res: Response) {
  const session = req.session!;
  const sessionToken = req.rawToken!;
  try {
    const items = await getFavoriteAudioItems(session.jellyfinUserId, session.jellyfinToken);
    res.json({ tracks: items.map((item: any) => mapTrack(item, sessionToken, session.jellyfinToken)) });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener favoritos' });
  }
}

export async function addFavoriteController(req: Request, res: Response) {
  const session = req.session!;
  const { itemId } = req.params as { itemId: string };
  try {
    await setFavorite(session.jellyfinUserId, session.jellyfinToken, itemId, true);
    res.json({ isFavorite: true });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'No se pudo marcar como favorito' });
  }
}

export async function removeFavoriteController(req: Request, res: Response) {
  const session = req.session!;
  const { itemId } = req.params as { itemId: string };
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
      coverUrl: imageUrlOrNull(item, session.jellyfinToken),
    }));
    res.json({ albums });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener álbumes' });
  }
}

export async function getAlbumController(req: Request, res: Response) {
  const session = req.session!;
  const sessionToken = req.rawToken!;
  const { albumId } = req.params as { albumId: string };

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
      coverUrl: imageUrlOrNull(albumInfo, session.jellyfinToken),
      tracks,
    });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener el álbum' });
  }
}

export async function listArtistsController(req: Request, res: Response) {
  const session = req.session!;
  try {
    const items = await getArtists(session.jellyfinUserId, session.jellyfinToken);
    const artists = items.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      imageUrl: imageUrlOrNull(item, session.jellyfinToken),
    }));
    res.json({ artists });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener artistas' });
  }
}

export async function getArtistController(req: Request, res: Response) {
  const session = req.session!;
  const sessionToken = req.rawToken!;
  const { artistId } = req.params as { artistId: string };

  try {
    const [artistInfo, albumItems, trackItems] = await Promise.all([
      getArtistById(session.jellyfinUserId, session.jellyfinToken, artistId),
      getArtistAlbums(session.jellyfinUserId, session.jellyfinToken, artistId),
      getArtistTracks(session.jellyfinUserId, session.jellyfinToken, artistId),
    ]);

    const albums = albumItems.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      artist: item.AlbumArtist ?? artistInfo.Name,
      year: item.ProductionYear ?? null,
      trackCount: item.ChildCount ?? 0,
      coverUrl: imageUrlOrNull(item, session.jellyfinToken),
    }));

    const tracks = trackItems.map((item: any) => mapTrack(item, sessionToken, session.jellyfinToken));

    res.json({
      id: artistInfo.Id,
      name: artistInfo.Name,
      imageUrl: imageUrlOrNull(artistInfo, session.jellyfinToken),
      albums,
      tracks,
    });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener el artista' });
  }
}

export async function listPlaylistsController(req: Request, res: Response) {
  const session = req.session!;
  try {
    const items = await getUserPlaylists(session.jellyfinUserId, session.jellyfinToken);
    const playlists = items.map((item: any) => ({
      id: item.Id,
      name: item.Name,
      trackCount: item.ChildCount ?? 0,
      coverUrl: imageUrlOrNull(item, session.jellyfinToken),
    }));
    res.json({ playlists });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener playlists' });
  }
}

export async function getPlaylistController(req: Request, res: Response) {
  const session = req.session!;
  const sessionToken = req.rawToken!;
  const { playlistId } = req.params as { playlistId: string };

  try {
    const [playlistInfo, items] = await Promise.all([
      getPlaylistById(session.jellyfinUserId, session.jellyfinToken, playlistId),
      getPlaylistTracks(session.jellyfinUserId, session.jellyfinToken, playlistId),
    ]);

    const tracks = items.map((item: any) => ({
      ...mapTrack(item, sessionToken, session.jellyfinToken),
      playlistItemId: item.PlaylistItemId,
    }));

    res.json({
      id: playlistInfo.Id,
      name: playlistInfo.Name,
      coverUrl: imageUrlOrNull(playlistInfo, session.jellyfinToken),
      tracks,
    });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'Error al obtener la playlist' });
  }
}

export async function createPlaylistController(req: Request, res: Response) {
  const session = req.session!;
  const { name, itemId } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la playlist es requerido' });
  }

  try {
    const result = await createPlaylist(session.jellyfinUserId, session.jellyfinToken, name.trim(), itemId);
    res.json({ id: result.Id, name: name.trim() });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'No se pudo crear la playlist' });
  }
}

export async function addTrackToPlaylistController(req: Request, res: Response) {
  const session = req.session!;
  const { playlistId, itemId } = req.params as { playlistId: string; itemId: string };

  try {
    await addItemToPlaylist(session.jellyfinToken, session.jellyfinUserId, playlistId, itemId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'No se pudo agregar la canción' });
  }
}

export async function removeTrackFromPlaylistController(req: Request, res: Response) {
  const session = req.session!;
  const { playlistId, entryId } = req.params as { playlistId: string; entryId: string };

  try {
    await removeItemFromPlaylist(session.jellyfinToken, session.jellyfinUserId, playlistId, entryId);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(502).json({ error: err.message ?? 'No se pudo quitar la canción' });
  }
}