import { z } from 'zod';

export const sendMessageSchema = {
  body: z.object({
    content: z.string().trim().min(1, 'Message content cannot be empty'),
    attachments: z.array(z.string().min(1)).optional(),
  }),
};

export const editMessageSchema = {
  body: z.object({
    content: z.string().trim().min(1, 'Message content cannot be empty'),
  }),
};
