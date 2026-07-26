import { env } from '../../config/env';
import { JellyfinAuthResult } from './jellyfin.types';

export class JellyfinError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'JellyfinError';
  }
}

// Único punto de la app que sabe qué status HTTP devolvió Jellyfin.
// Todas las llamadas autenticadas a Jellyfin deben pasar por aquí para que
// un 401 (token de Jellyfin inválido/expirado) se pueda distinguir de
// cualquier otro error (Jellyfin caído, 5xx, etc.) más arriba en los controllers.
async function jellyfinFetch(url: string, token: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), 'X-Emby-Token': token },
  });

  if (!res.ok) {
    throw new JellyfinError(
      res.status,
      res.status === 401
        ? 'Token de Jellyfin inválido o expirado'
        : `Jellyfin respondió ${res.status}`
    );
  }

  return res;
}

function buildDeviceId(username: string) {
  return Buffer.from(`${env.clientName}-${username}`).toString('base64');
}

function authHeader(username: string) {
  return [
    `MediaBrowser Client="${env.clientName}"`,
    `Device="Server"`,
    `DeviceId="${buildDeviceId(username)}"`,
    `Version="${env.clientVersion}"`,
  ].join(', ');
}

// El login inicial no pasa por jellyfinFetch porque todavía no hay token de sesión:
// aquí se distingue el 401 (credenciales incorrectas) manualmente.
export async function authenticateByName(
  username: string,
  password: string
): Promise<JellyfinAuthResult> {
  const res = await fetch(`${env.jellyfinServerUrl}/Users/AuthenticateByName`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Emby-Authorization': authHeader(username),
    },
    body: JSON.stringify({ Username: username, Pw: password }),
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('Usuario o contraseña incorrectos');
    throw new Error(`Error de Jellyfin (${res.status})`);
  }

  return (await res.json()) as JellyfinAuthResult;
}

export async function getAudioItems(userId: string, token: string) {
  const params = new URLSearchParams({
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    SortBy: 'SortName',
    Fields: 'Artists,Album,RunTimeTicks,UserData',
  });

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, token);
  const data = await res.json();
  return data.Items ?? [];
}

export function buildStreamUrl(itemId: string, token: string) {
  return `${env.jellyfinServerUrl}/Audio/${itemId}/stream?static=true&api_key=${token}`;
}

export function buildImageUrl(itemId: string, token: string) {
  return `${env.jellyfinServerUrl}/Items/${itemId}/Images/Primary?api_key=${token}`;
}

export async function getFavoriteAudioItems(userId: string, token: string) {
  const params = new URLSearchParams({
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    SortBy: 'SortName',
    Fields: 'Artists,Album,RunTimeTicks,UserData',
    Filters: 'IsFavorite',
  });

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, token);
  const data = await res.json();
  return data.Items ?? [];
}

// Marca/desmarca favorito directamente en Jellyfin
export async function setFavorite(
  userId: string,
  token: string,
  itemId: string,
  favorite: boolean
) {
  await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/FavoriteItems/${itemId}`, token, {
    method: favorite ? 'POST' : 'DELETE',
  });
}

export async function getAlbums(userId: string, token: string) {
  const params = new URLSearchParams({
    IncludeItemTypes: 'MusicAlbum',
    Recursive: 'true',
    SortBy: 'SortName',
    Fields: 'AlbumArtist,ChildCount,ProductionYear',
  });

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, token);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getAlbumById(userId: string, token: string, albumId: string) {
  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items/${albumId}`, token);
  return res.json();
}

export async function getAlbumTracks(userId: string, token: string, albumId: string) {
  const params = new URLSearchParams({
    ParentId: albumId,
    IncludeItemTypes: 'Audio',
    SortBy: 'ParentIndexNumber,IndexNumber',
    Fields: 'Artists,Album,RunTimeTicks,UserData,IndexNumber',
  });

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, token);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getArtists(userId: string, token: string) {
  const params = new URLSearchParams({
    UserId: userId,
    SortBy: 'SortName',
  });

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Artists?${params}`, token);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getArtistById(userId: string, token: string, artistId: string) {
  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items/${artistId}`, token);
  return res.json();
}

export async function getArtistAlbums(userId: string, token: string, artistId: string) {
  const params = new URLSearchParams({
    IncludeItemTypes: 'MusicAlbum',
    Recursive: 'true',
    ArtistIds: artistId,
    SortBy: 'ProductionYear,SortName',
    Fields: 'AlbumArtist,ChildCount,ProductionYear',
  });

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, token);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getArtistTracks(userId: string, token: string, artistId: string) {
  const params = new URLSearchParams({
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    ArtistIds: artistId,
    SortBy: 'Album,ParentIndexNumber,IndexNumber',
    Fields: 'Artists,Album,RunTimeTicks,UserData',
  });

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, token);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getUserPlaylists(userId: string, token: string) {
  const params = new URLSearchParams({
    IncludeItemTypes: 'Playlist',
    Recursive: 'true',
    SortBy: 'SortName',
  });

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, token);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getPlaylistById(userId: string, token: string, playlistId: string) {
  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items/${playlistId}`, token);
  return res.json();
}

export async function getPlaylistTracks(userId: string, token: string, playlistId: string) {
  const params = new URLSearchParams({
    UserId: userId,
    Fields: 'Artists,Album,RunTimeTicks,UserData',
  });

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Playlists/${playlistId}/Items?${params}`, token);
  const data = await res.json();
  return data.Items ?? [];
}

export async function createPlaylist(
  userId: string,
  token: string,
  name: string,
  firstItemId?: string
) {
  const body: Record<string, unknown> = { Name: name, UserId: userId, MediaType: 'Audio' };
  if (firstItemId) body.Ids = [firstItemId];

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Playlists`, token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.json(); // { Id: '...' }
}

export async function addItemToPlaylist(
  token: string,
  userId: string,
  playlistId: string,
  itemId: string
) {
  const params = new URLSearchParams({ Ids: itemId, UserId: userId });
  await jellyfinFetch(`${env.jellyfinServerUrl}/Playlists/${playlistId}/Items?${params}`, token, {
    method: 'POST',
  });
}

export async function removeItemFromPlaylist(
  token: string,
  userId: string,
  playlistId: string,
  entryId: string
) {
  const params = new URLSearchParams({ EntryIds: entryId, UserId: userId });
  await jellyfinFetch(`${env.jellyfinServerUrl}/Playlists/${playlistId}/Items?${params}`, token, {
    method: 'DELETE',
  });
}

export async function getAudioItemById(userId: string, token: string, itemId: string) {
  const params = new URLSearchParams({
    Fields: 'Artists,Album,RunTimeTicks',
  });

  const res = await jellyfinFetch(`${env.jellyfinServerUrl}/Users/${userId}/Items/${itemId}?${params}`, token);
  return res.json();
}