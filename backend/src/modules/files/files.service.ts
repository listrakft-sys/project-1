import fs from 'fs';
import path from 'path';
import prisma from '../../config/prisma';
import { ApiError } from '../../utils/apiResponse';
import { JwtPayload } from '../../utils/jwt';

export class FilesService {
  /**
   * Upload a new file attachment
   */
  static async uploadFile(
    file: Express.Multer.File,
    entityType: string,
    entityId: string,
    userId: string
  ) {
    if (!file) {
      throw new ApiError(400, 'FILE_REQUIRED', 'No file was provided');
    }

    if (!entityType || !entityId) {
      throw new ApiError(400, 'MISSING_FIELDS', 'entityType and entityId are required');
    }

    const url = `/uploads/${file.filename}`;

    const attachment = await prisma.fileAttachment.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        entityType,
        entityId,
        uploadedBy: userId,
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return attachment;
  }

  /**
   * Get file attachment by ID
   */
  static async getFile(id: string) {
    const attachment = await prisma.fileAttachment.findUnique({
      where: { id },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new ApiError(404, 'FILE_NOT_FOUND', 'File attachment not found');
    }

    return attachment;
  }

  /**
   * Get file attachments for a given entity (e.g. HOMEWORK, MESSAGE, ANNOUNCEMENT)
   */
  static async getFilesByEntity(entityType: string, entityId: string) {
    const attachments = await prisma.fileAttachment.findMany({
      where: { entityType, entityId },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return attachments;
  }

  /**
   * Delete a file attachment
   */
  static async deleteFile(id: string, currentUser: JwtPayload) {
    const attachment = await prisma.fileAttachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new ApiError(404, 'FILE_NOT_FOUND', 'File attachment not found');
    }

    const isOwner = attachment.uploadedBy === currentUser.userId;
    const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SCHOOL_ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to delete this file');
    }

    // Remove physical file from uploads folder
    const filePath = path.resolve(process.cwd(), 'uploads', attachment.filename);
    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.unlink(filePath);
      } catch {
        // file system error ignored
      }
    }

    // Delete record from DB
    await prisma.fileAttachment.delete({
      where: { id },
    });

    return { id };
  }
}
