import { z } from 'zod';
import { ComplaintType } from '@prisma/client';

export const createComplaintSchema = {
  body: z.object({
    againstUserId: z.string().optional().nullable(),
    type: z.nativeEnum(ComplaintType, {
      errorMap: () => ({
        message: 'Invalid complaint type. Must be HARASSMENT, SPAM, INAPPROPRIATE_CONTENT, BULLYING, or OTHER',
      }),
    }).default(ComplaintType.OTHER),
    description: z.string().min(1, 'Description is required'),
    evidence: z.array(z.string()).optional().default([]),
  }),
};

export const handleComplaintSchema = {
  body: z.object({
    status: z.enum(['REVIEWING', 'RESOLVED', 'DISMISSED'], {
      errorMap: () => ({
        message: 'Status must be REVIEWING, RESOLVED, or DISMISSED',
      }),
    }),
    resolution: z.string().optional(),
  }),
};

export type CreateComplaintInput = z.infer<typeof createComplaintSchema.body>;
export type HandleComplaintInput = z.infer<typeof handleComplaintSchema.body>;
