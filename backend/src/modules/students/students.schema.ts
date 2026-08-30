import { z } from 'zod';

export const createStudentSchema = {
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
    classId: z.string().uuid('Invalid class ID format').optional().nullable(),
    studentCardId: z.string().optional().nullable(),
    enrollmentDate: z.string().optional(),
    guardianName: z.string().optional().nullable(),
    guardianPhone: z.string().optional().nullable(),
    guardianEmail: z.string().email('Invalid guardian email').optional().nullable(),
  }),
};

export const updateStudentSchema = {
  body: z.object({
    schoolId: z.string().uuid('Invalid school ID format').optional(),
    classId: z.string().uuid('Invalid class ID format').optional().nullable(),
    studentCardId: z.string().optional().nullable(),
    enrollmentDate: z.string().optional(),
    guardianName: z.string().optional().nullable(),
    guardianPhone: z.string().optional().nullable(),
    guardianEmail: z.string().email('Invalid guardian email').optional().nullable(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
  }),
};
