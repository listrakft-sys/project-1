import { z } from 'zod';

const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;

export const createScheduleSchema = {
  body: z.object({
    schoolId: z.string().uuid('Invalid school ID'),
    classId: z.string().uuid('Invalid class ID'),
    subjectId: z.string().uuid('Invalid subject ID').optional().nullable(),
    teacherId: z.string().uuid('Invalid teacher ID').optional().nullable(),
    dayOfWeek: z.number().int().min(0, 'Day of week must be between 0 (Sunday) and 6 (Saturday)').max(6, 'Day of week must be between 0 and 6'),
    startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format'),
    endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format'),
    room: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
};

export const updateScheduleSchema = {
  body: z.object({
    schoolId: z.string().uuid('Invalid school ID').optional(),
    classId: z.string().uuid('Invalid class ID').optional(),
    subjectId: z.string().uuid('Invalid subject ID').optional().nullable(),
    teacherId: z.string().uuid('Invalid teacher ID').optional().nullable(),
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format').optional(),
    endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format').optional(),
    room: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
};

export const createBulkScheduleSchema = {
  body: z.object({
    schedules: z.array(
      z.object({
        schoolId: z.string().uuid('Invalid school ID'),
        classId: z.string().uuid('Invalid class ID'),
        subjectId: z.string().uuid('Invalid subject ID').optional().nullable(),
        teacherId: z.string().uuid('Invalid teacher ID').optional().nullable(),
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(timeRegex, 'Start time must be in HH:mm format'),
        endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format'),
        room: z.string().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    ).min(1, 'At least one schedule entry is required'),
  }),
};

export type CreateScheduleInput = z.infer<typeof createScheduleSchema.body>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema.body>;
export type CreateBulkScheduleInput = z.infer<typeof createBulkScheduleSchema.body>;
