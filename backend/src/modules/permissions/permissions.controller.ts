import { Request, Response, NextFunction } from 'express';
import { PermissionService } from './permissions.service';
import { success } from '../../utils/apiResponse';

export class PermissionController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await PermissionService.findAll();
      res.json(success(permissions));
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const permission = await PermissionService.create(req.body);
      res.status(201).json(success(permission));
    } catch (error) {
      next(error);
    }
  }

  static async getUserPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await PermissionService.getUserPermissions(req.params.id);
      res.json(success(permissions));
    } catch (error) {
      next(error);
    }
  }

  static async updateUserPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PermissionService.updateUserPermission(req.params.id, req.body);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }
}
