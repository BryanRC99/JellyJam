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