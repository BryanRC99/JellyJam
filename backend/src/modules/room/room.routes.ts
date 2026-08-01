import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth';
import {
  createRoomController,
  getRoomController,
  joinRoomController,
  leaveRoomController,
  setGuestControlController,
  getRoomStatsController,
} from './room.controller';

export const roomRouter = Router();
roomRouter.post('/', requireAuth, createRoomController);
roomRouter.get('/:code', requireAuth, getRoomController);
roomRouter.post('/:code/join', requireAuth, joinRoomController);
roomRouter.post('/:roomId/leave', requireAuth, leaveRoomController);
roomRouter.patch('/:roomId/permissions', requireAuth, setGuestControlController);
roomRouter.get('/:roomId/stats', requireAuth, getRoomStatsController);