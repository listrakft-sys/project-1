import { z } from 'zod';

export const createAnnouncementSchema = {
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
    content: z.string().min(1, 'Content is required'),
    audience: z.enum(['school', 'class', 'all']).optional().default('school'),
    schoolId: z.string().optional().nullable(),
    classId: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional().default([]),
    isPinned: z.boolean().optional().default(false),
  }),
};

export const updateAnnouncementSchema = {
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters').optional(),
    content: z.string().min(1, 'Content is required').optional(),
    audience: z.enum(['school', 'class', 'all']).optional(),
    schoolId: z.string().optional().nullable(),
    classId: z.string().optional().nullable(),
    attachments: z.array(z.string()).optional(),
    isPinned: z.boolean().optional(),
  }),
};

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema.body>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema.body>;
