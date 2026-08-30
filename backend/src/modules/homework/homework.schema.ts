import { z } from 'zod';

export const createHomeworkSchema = {
  body: z.object({
    classId: z.string().min(1, 'Class ID is required'),
    subjectId: z.string().min(1, 'Subject ID is required'),
    title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
    description: z.string().min(1, 'Description is required'),
    dueDate: z.coerce.date({ invalid_type_error: 'Invalid due date' }),
    attachments: z.array(z.string()).optional().default([]),
    maxScore: z.number().positive('Max score must be positive').optional().nullable(),
  }),
};

export const updateHomeworkSchema = {
  body: z.object({
    classId: z.string().min(1).optional(),
    subjectId: z.string().min(1).optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).optional(),
    dueDate: z.coerce.date().optional(),
    attachments: z.array(z.string()).optional(),
    maxScore: z.number().positive().optional().nullable(),
  }),
};

export const submitHomeworkSchema = {
  body: z.object({
    content: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional().default([]),
  }),
};

export const gradeSubmissionSchema = {
  body: z.object({
    grade: z.number().min(0, 'Grade must be at least 0'),
    feedback: z.string().optional().nullable(),
  }),
};

export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema.body>;
export type UpdateHomeworkInput = z.infer<typeof updateHomeworkSchema.body>;
export type SubmitHomeworkInput = z.infer<typeof submitHomeworkSchema.body>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema.body>;
