import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import { testVoiceController } from './dj.controller';

export const djRouter = Router();
djRouter.post('/test-voice', requireAuth, testVoiceController);