import { z } from 'zod';

export const createTeacherSchema = {
  body: z.object({
    userId: z.string().uuid('Invalid user ID format').optional(),
    email: z.string().email('Invalid email address').optional(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    schoolId: z.string().uuid('Valid school ID is required'),
    employeeId: z.string().optional(),
    qualification: z.string().optional(),
    specialization: z.string().optional(),
    joinDate: z.string().optional(),
    subjectIds: z.array(z.string().uuid('Invalid subject ID format')).optional(),
  }),
};

export const updateTeacherSchema = {
  body: z.object({
    schoolId: z.string().uuid('Invalid school ID format').optional(),
    employeeId: z.string().optional().nullable(),
    qualification: z.string().optional().nullable(),
    specialization: z.string().optional().nullable(),
    joinDate: z.string().optional(),
    subjectIds: z.array(z.string().uuid('Invalid subject ID format')).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
  }),
};
