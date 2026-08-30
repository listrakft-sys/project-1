import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    email: z.string().email('Invalid email'),
    username: z.string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['TEACHER', 'STUDENT', 'PARENT']).default('STUDENT'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    preferredLang: z.enum(['es', 'de', 'en']).default('es'),
  }),
};

export const loginSchema = {
  body: z.object({
    emailOrUsername: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),
};
