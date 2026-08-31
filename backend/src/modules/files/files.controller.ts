import { Request, Response, NextFunction } from 'express';
import { FilesService } from './files.service';
import { success } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiResponse';

export class FilesController {
  static async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ApiError(400, 'FILE_REQUIRED', 'No file was uploaded');
      }

      const { entityType, entityId } = req.body;
      if (!entityType || !entityId) {
        throw new ApiError(400, 'MISSING_FIELDS', 'entityType and entityId are required');
      }

      const result = await FilesService.uploadFile(
        req.file,
        entityType,
        entityId,
        req.user!.userId
      );
      res.status(201).json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async getByEntity(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId } = req.params;
      const result = await FilesService.getFilesByEntity(entityType, entityId);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await FilesService.getFile(id);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await FilesService.deleteFile(id, req.user!);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}
