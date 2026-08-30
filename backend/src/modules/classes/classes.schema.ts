import { z } from 'zod';

export const createClassSchema = {
  body: z.object({
    schoolId: z.string().uuid('Invalid school ID'),
    name: z.string().min(1, 'Class name is required'), // e.g. "8B"
    grade: z
      .number()
      .int('Grade must be an integer')
      .min(1, 'Grade must be at least 1')
      .max(13, 'Grade must be at most 13'),
    section: z.string().optional(), // e.g. "B"
    capacity: z.number().int().positive().optional(),
    room: z.string().optional(),
    homeroomTeacherId: z.string().uuid('Invalid teacher ID').optional().nullable(),
  }),
};

export const updateClassSchema = {
  body: z.object({
    schoolId: z.string().uuid('Invalid school ID').optional(),
    name: z.string().min(1).optional(),
    grade: z.number().int().min(1).max(13).optional(),
    section: z.string().optional().nullable(),
    capacity: z.number().int().positive().optional().nullable(),
    room: z.string().optional().nullable(),
    homeroomTeacherId: z.string().uuid('Invalid teacher ID').optional().nullable(),
  }),
};

export const assignStudentSchema = {
  body: z.object({
    studentId: z.string().uuid('Invalid student ID').optional(),
  }),
};
