import { z } from 'zod';
import { ConversationType, ParticipantRole } from '@prisma/client';

export const createConversationSchema = {
  body: z.object({
    type: z.nativeEnum(ConversationType),
    name: z.string().trim().min(1).max(100).optional(),
    avatar: z.string().min(1).optional(),
    participantIds: z
      .array(z.string().min(1))
      .min(1, 'At least one participant is required'),
  }),
};

export const updateConversationSchema = {
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    avatar: z.string().min(1).optional(),
  }),
};

export const addParticipantSchema = {
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    role: z.nativeEnum(ParticipantRole).optional(),
  }),
};
