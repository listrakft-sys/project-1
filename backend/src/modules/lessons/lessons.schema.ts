import { z } from 'zod';

export const createLessonSchema = {
  body: z.object({
    classId: z.string().uuid('Invalid class ID'),
    subjectId: z.string().uuid('Invalid subject ID'),
    teacherId: z.string().uuid('Invalid teacher ID'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    materials: z.array(z.string()).optional().default([]),
    room: z.string().optional(),
    startDate: z.string().datetime('Invalid start date (must be ISO datetime)'),
    endDate: z.string().datetime('Invalid end date (must be ISO datetime)'),
  }),
};

export const updateLessonSchema = {
  body: z.object({
    classId: z.string().uuid('Invalid class ID').optional(),
    subjectId: z.string().uuid('Invalid subject ID').optional(),
    teacherId: z.string().uuid('Invalid teacher ID').optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    materials: z.array(z.string()).optional(),
    room: z.string().optional().nullable(),
    status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    startDate: z.string().datetime('Invalid start date').optional(),
    endDate: z.string().datetime('Invalid end date').optional(),
  }),
};

export type CreateLessonInput = z.infer<typeof createLessonSchema.body>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema.body>;
