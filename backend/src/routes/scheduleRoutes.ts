import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deactivateSchedule,
} from '../services/scheduleServices';

const router = express.Router();

router.get('/',     authMiddleware, getAllSchedules);
router.get('/:scheduleId', authMiddleware, getScheduleById);
router.post('/',    authMiddleware, createSchedule);
router.put('/:scheduleId',  authMiddleware, updateSchedule);
router.delete('/:scheduleId', authMiddleware, deactivateSchedule);

export default router;
