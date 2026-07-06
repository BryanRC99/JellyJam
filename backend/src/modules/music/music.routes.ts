import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import {
  listTracksController,
  listFavoriteTracksController,
  addFavoriteController,
  removeFavoriteController,
  listAlbumsController,
  getAlbumController,
} from './music.controller';
import { streamController } from './stream.controller';

export const musicRouter = Router();
musicRouter.get('/tracks', requireAuth, listTracksController);
musicRouter.get('/stream/:itemId', requireAuth, streamController);
musicRouter.get('/favorites', requireAuth, listFavoriteTracksController);
musicRouter.post('/favorites/:itemId', requireAuth, addFavoriteController);
musicRouter.delete('/favorites/:itemId', requireAuth, removeFavoriteController);
musicRouter.get('/albums', requireAuth, listAlbumsController);
musicRouter.get('/albums/:albumId', requireAuth, getAlbumController);