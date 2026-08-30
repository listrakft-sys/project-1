import { z } from 'zod';

export const createSchoolSchema = {
  body: z.object({
    name: z.string().min(1, 'School name is required'),
    description: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    website: z.string().optional(),
    logo: z.string().optional(),
    adminId: z.string().uuid('Invalid admin ID').optional().nullable(),
  }),
};

export const updateSchoolSchema = {
  body: z.object({
    name: z.string().min(1, 'School name cannot be empty').optional(),
    description: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email('Invalid email address').optional().nullable(),
    website: z.string().optional().nullable(),
    logo: z.string().optional().nullable(),
    adminId: z.string().uuid('Invalid admin ID').optional().nullable(),
  }),
};
