import { env } from '../../config/env';
import { JellyfinAuthResult } from './jellyfin.types';

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

  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener biblioteca (${res.status})`);
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

  const res = await fetch(
    `${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`,
    {
      headers: {
        'X-Emby-Token': token,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Error al obtener favoritos (${res.status})`);
  }

  const data = await res.json();
  return data.Items ?? [];
}

// NUEVO: marca/desmarca favorito directamente en Jellyfin
export async function setFavorite(
  userId: string,
  token: string,
  itemId: string,
  favorite: boolean
) {
  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/FavoriteItems/${itemId}`, {
    method: favorite ? 'POST' : 'DELETE',
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al actualizar favorito (${res.status})`);
}

export async function getAlbums(userId: string, token: string) {
  const params = new URLSearchParams({
    IncludeItemTypes: 'MusicAlbum',
    Recursive: 'true',
    SortBy: 'SortName',
    Fields: 'AlbumArtist,ChildCount,ProductionYear',
  });

  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener álbumes (${res.status})`);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getAlbumById(userId: string, token: string, albumId: string) {
  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/Items/${albumId}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener el álbum (${res.status})`);
  return res.json();
}

export async function getAlbumTracks(userId: string, token: string, albumId: string) {
  const params = new URLSearchParams({
    ParentId: albumId,
    IncludeItemTypes: 'Audio',
    SortBy: 'ParentIndexNumber,IndexNumber',
    Fields: 'Artists,Album,RunTimeTicks,UserData,IndexNumber',
  });

  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener canciones del álbum (${res.status})`);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getArtists(userId: string, token: string) {
  const params = new URLSearchParams({
    UserId: userId,
    SortBy: 'SortName',
  });

  const res = await fetch(`${env.jellyfinServerUrl}/Artists?${params}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener artistas (${res.status})`);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getArtistById(userId: string, token: string, artistId: string) {
  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/Items/${artistId}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener el artista (${res.status})`);
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

  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener álbumes del artista (${res.status})`);
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

  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener canciones del artista (${res.status})`);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getUserPlaylists(userId: string, token: string) {
  const params = new URLSearchParams({
    IncludeItemTypes: 'Playlist',
    Recursive: 'true',
    SortBy: 'SortName',
  });

  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/Items?${params}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener playlists (${res.status})`);
  const data = await res.json();
  return data.Items ?? [];
}

export async function getPlaylistById(userId: string, token: string, playlistId: string) {
  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/Items/${playlistId}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener la playlist (${res.status})`);
  return res.json();
}

export async function getPlaylistTracks(userId: string, token: string, playlistId: string) {
  const params = new URLSearchParams({
    UserId: userId,
    Fields: 'Artists,Album,RunTimeTicks,UserData',
  });

  const res = await fetch(`${env.jellyfinServerUrl}/Playlists/${playlistId}/Items?${params}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener canciones de la playlist (${res.status})`);
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

  const res = await fetch(`${env.jellyfinServerUrl}/Playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Emby-Token': token },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Error al crear la playlist (${res.status})`);
  return res.json(); // { Id: '...' }
}

export async function addItemToPlaylist(
  token: string,
  userId: string,
  playlistId: string,
  itemId: string
) {
  const params = new URLSearchParams({ Ids: itemId, UserId: userId });
  const res = await fetch(`${env.jellyfinServerUrl}/Playlists/${playlistId}/Items?${params}`, {
    method: 'POST',
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al agregar la canción a la playlist (${res.status})`);
}

export async function removeItemFromPlaylist(
  token: string,
  userId: string, 
  playlistId: string,
  entryId: string
) {
  const params = new URLSearchParams({ EntryIds: entryId, UserId: userId });
  const res = await fetch(`${env.jellyfinServerUrl}/Playlists/${playlistId}/Items?${params}`, {
    method: 'DELETE',
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al quitar la canción de la playlist (${res.status})`);
}

export async function getAudioItemById(userId: string, token: string, itemId: string) {
  const params = new URLSearchParams({
    Fields: 'Artists,Album,RunTimeTicks',
  });

  const res = await fetch(`${env.jellyfinServerUrl}/Users/${userId}/Items/${itemId}?${params}`, {
    headers: { 'X-Emby-Token': token },
  });

  if (!res.ok) throw new Error(`Error al obtener la canción (${res.status})`);
  return res.json();
}