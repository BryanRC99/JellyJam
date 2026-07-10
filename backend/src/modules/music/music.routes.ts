import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import {
  listTracksController,
  listFavoriteTracksController,
  addFavoriteController,
  removeFavoriteController,
  listAlbumsController,
  getAlbumController,
  listArtistsController,
  getArtistController,
  listPlaylistsController,
  getPlaylistController,
  createPlaylistController,
  addTrackToPlaylistController,
  removeTrackFromPlaylistController,
} from './music.controller';
import { streamController } from './stream.controller';
import { getLyricsController } from '../lyrics/lyrics.controller';

export const musicRouter = Router();
musicRouter.get('/tracks', requireAuth, listTracksController);
musicRouter.get('/stream/:itemId', requireAuth, streamController);
musicRouter.get('/favorites', requireAuth, listFavoriteTracksController);
musicRouter.post('/favorites/:itemId', requireAuth, addFavoriteController);
musicRouter.delete('/favorites/:itemId', requireAuth, removeFavoriteController);
musicRouter.get('/albums', requireAuth, listAlbumsController);
musicRouter.get('/albums/:albumId', requireAuth, getAlbumController);
musicRouter.get('/artists', requireAuth, listArtistsController);
musicRouter.get('/artists/:artistId', requireAuth, getArtistController);
musicRouter.get('/playlists', requireAuth, listPlaylistsController);
musicRouter.post('/playlists', requireAuth, createPlaylistController);
musicRouter.get('/playlists/:playlistId', requireAuth, getPlaylistController);
musicRouter.post('/playlists/:playlistId/tracks/:itemId', requireAuth, addTrackToPlaylistController);
musicRouter.delete('/playlists/:playlistId/entries/:entryId', requireAuth, removeTrackFromPlaylistController);
musicRouter.get('/lyrics/:itemId', requireAuth, getLyricsController);
