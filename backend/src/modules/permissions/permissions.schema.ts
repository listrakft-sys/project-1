import { z } from 'zod';

export const createPermissionSchema = {
  body: z.object({
    name: z.string().min(1, 'Permission name is required'),
    resource: z.string().min(1, 'Resource is required'),
    action: z.string().min(1, 'Action is required'),
    description: z.string().optional(),
  }),
};

export const updateUserPermissionSchema = {
  body: z.object({
    permissionId: z.string().uuid('Invalid permission ID'),
    granted: z.boolean(),
  }),
};

export type CreatePermissionInput = z.infer<typeof createPermissionSchema.body>;
export type UpdateUserPermissionInput = z.infer<typeof updateUserPermissionSchema.body>;
