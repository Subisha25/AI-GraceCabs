import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Schedule } from '../models/schedule';
import { Company } from '../models/company';
import { VehicleType } from '../models/vehicleType';

// ── GET all schedules (operator-scoped) ──────────────────────
export const getAllSchedules = async (req: Request, res: Response) => {
  try {
    const operatorId = (req as any).operatorId;
    const schedules = await Schedule.findAll({
      where: { operatorId },
      include: [
        { model: Company, attributes: ['companyId', 'companyName'] },
        { model: VehicleType, attributes: ['vehicleTypeId', 'vehicleTypeName'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    return res.status(200).json(schedules);
  } catch (err: any) {
    console.error('getAllSchedules error:', err);
    return res.status(500).json({ message: 'Failed to fetch schedules', error: err.message });
  }
};

// ── GET one schedule ──────────────────────────────────────────
export const getScheduleById = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const operatorId = (req as any).operatorId;
    const schedule = await Schedule.findOne({
      where: { scheduleId, operatorId },
      include: [
        { model: Company, attributes: ['companyId', 'companyName'] },
        { model: VehicleType, attributes: ['vehicleTypeId', 'vehicleTypeName'] },
      ],
    });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    return res.status(200).json(schedule);
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to fetch schedule', error: err.message });
  }
};

// ── POST create schedule ──────────────────────────────────────
export const createSchedule = async (req: Request, res: Response) => {
  try {
    const operatorId = (req as any).operatorId;
    const {
      scheduleName, organizationId, pickupLocation, dropLocation,
      days, pickupTime, startDate, endDate, vehicleTypeId,
      passengerCount, notes,
    } = req.body;

    if (!scheduleName || !organizationId || !pickupLocation || !dropLocation) {
      return res.status(400).json({ message: 'scheduleName, organizationId, pickupLocation and dropLocation are required' });
    }

    const schedule = await Schedule.create({
      scheduleId: uuidv4(),
      scheduleName,
      organizationId,
      pickupLocation,
      dropLocation,
      days: days || '',
      pickupTime: pickupTime || null,
      startDate: startDate || null,
      endDate: endDate || null,
      vehicleTypeId: vehicleTypeId || null,
      passengerCount: passengerCount || 1,
      notes: notes || '',
      status: 'active',
      operatorId,
    } as any);

    return res.status(201).json({ message: 'Schedule created successfully', schedule });
  } catch (err: any) {
    console.error('createSchedule error:', err);
    return res.status(500).json({ message: 'Failed to create schedule', error: err.message });
  }
};

// ── PUT update schedule ───────────────────────────────────────
export const updateSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const operatorId = (req as any).operatorId;
    const schedule = await Schedule.findOne({ where: { scheduleId, operatorId } });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    await schedule.update(req.body);
    return res.status(200).json({ message: 'Schedule updated', schedule });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to update schedule', error: err.message });
  }
};

// ── DELETE (soft-deactivate) schedule ────────────────────────
export const deactivateSchedule = async (req: Request, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const operatorId = (req as any).operatorId;
    const schedule = await Schedule.findOne({ where: { scheduleId, operatorId } });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    await schedule.update({ status: 'inactive' });
    return res.status(200).json({ message: 'Schedule deactivated' });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to deactivate schedule', error: err.message });
  }
};
