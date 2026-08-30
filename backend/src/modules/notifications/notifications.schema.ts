import { z } from 'zod';
import { NotificationType } from '@prisma/client';

export const queryNotificationsSchema = {
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    type: z.nativeEnum(NotificationType).optional(),
    isRead: z
      .union([
        z.boolean(),
        z.string().transform((val) => val === 'true'),
      ])
      .optional(),
  }),
};

export type QueryNotificationsInput = z.infer<typeof queryNotificationsSchema.query>;
