import { z } from 'zod';

export const updateUserSchema = {
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username cannot exceed 30 characters')
      .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain letters, numbers, dots, underscores, and hyphens')
      .optional(),
    preferredLang: z.string().min(2).max(10).optional(),
    role: z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).optional(),
    isEmailVerified: z.boolean().optional(),
  }),
};

export const updateProfileSchema = {
  body: z.object({
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    middleName: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
    dateOfBirth: z
      .string()
      .or(z.date())
      .transform((val) => (val ? new Date(val) : val))
      .nullable()
      .optional(),
    address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    bio: z.string().max(500, 'Bio cannot exceed 500 characters').nullable().optional(),
    emergencyContact: z.string().nullable().optional(),
    emergencyPhone: z.string().nullable().optional(),
  }),
};

export const updatePrivacySchema = {
  body: z.object({
    profileVisibility: z.enum(['PUBLIC', 'STUDENTS_ONLY', 'TEACHERS_ONLY', 'SCHOOL_ONLY', 'PRIVATE']).optional(),
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    showAddress: z.boolean().optional(),
    whoCanMessage: z.enum(['EVERYONE', 'SCHOOL_ONLY', 'CLASS_ONLY', 'NO_ONE']).optional(),
    showOnlineStatus: z.boolean().optional(),
    searchableByName: z.boolean().optional(),
    searchableByUsername: z.boolean().optional(),
  }),
};

export const blockUserSchema = {
  body: z.object({
    reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
  }),
};
