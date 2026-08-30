import { z } from 'zod';

export const createSubjectSchema = {
  body: z.object({
    schoolId: z.string().uuid('Invalid school ID'),
    name: z.string().min(1, 'Subject name is required'),
    code: z.string().min(1, 'Subject code is required').toUpperCase(),
    description: z.string().optional(),
    color: z.string().optional(),
    language: z.string().optional(), // language of the subject material (independent of UI language)
  }),
};

export const updateSubjectSchema = {
  body: z.object({
    schoolId: z.string().uuid('Invalid school ID').optional(),
    name: z.string().min(1).optional(),
    code: z.string().min(1).toUpperCase().optional(),
    description: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    language: z.string().optional().nullable(),
  }),
};

export const assignTeacherSchema = {
  body: z.object({
    teacherId: z.string().uuid('Invalid teacher ID').optional(),
  }),
};
