import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { createBlockController, getBlockAudioController, debugController, listArtistsController} from './dj-blocks.controller';

export const djBlocksRouter = Router();
djBlocksRouter.post('/', requireAuth, createBlockController);
djBlocksRouter.get('/debug', requireAuth, debugController);
djBlocksRouter.get('/:blockId/audio', requireAuth, getBlockAudioController);
djBlocksRouter.get('/artists', requireAuth, listArtistsController);