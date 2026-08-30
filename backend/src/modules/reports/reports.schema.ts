import { z } from 'zod';
import { ReportType } from '@prisma/client';

export const createReportSchema = {
  body: z.object({
    type: z.nativeEnum(ReportType, {
      errorMap: () => ({ message: 'Invalid report type. Must be ACADEMIC, ATTENDANCE, BEHAVIOR, PROGRESS, or CUSTOM' }),
    }),
    studentId: z.string().uuid('Invalid student ID').optional(),
    classId: z.string().uuid('Invalid class ID').optional(),
    schoolId: z.string().uuid('Invalid school ID').optional(),
    forUserId: z.string().uuid('Invalid target user ID').optional(),
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(1, 'Content is required'),
    data: z.record(z.any()).optional(),
    period: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  }),
};

export const updateReportSchema = {
  body: z.object({
    type: z.nativeEnum(ReportType).optional(),
    studentId: z.string().uuid('Invalid student ID').optional().nullable(),
    classId: z.string().uuid('Invalid class ID').optional().nullable(),
    schoolId: z.string().uuid('Invalid school ID').optional().nullable(),
    forUserId: z.string().uuid('Invalid target user ID').optional().nullable(),
    title: z.string().min(1, 'Title cannot be empty').optional(),
    content: z.string().min(1, 'Content cannot be empty').optional(),
    data: z.record(z.any()).optional().nullable(),
    period: z.string().optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
  }),
};

export type CreateReportInput = z.infer<typeof createReportSchema.body>;
export type UpdateReportInput = z.infer<typeof updateReportSchema.body>;
