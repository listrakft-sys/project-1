import { Request, Response, NextFunction } from 'express';
import { UserService } from './users.service';
import { success, paginated } from '../../utils/apiResponse';

export class UserController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.findAll(req.user!.userId, req.query, req.user!.role);
      res.json(paginated(result.users, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.findById(req.params.id, req.user!.userId, req.user!.role);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async findByUsername(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.findByUsername(req.params.username, req.user!.userId, req.user!.role);
      res.json(success(result));
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.updateUser(req.params.id, req.user!.userId, req.user!.role, req.body);
      res.json(success(result, { message: 'User updated successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.deleteUser(req.params.id);
      res.json(success(result, { message: 'User deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserService.findById(req.params.id, req.user!.userId, req.user!.role);
      res.json(success(user.profile || null));
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.updateProfile(req.params.id, req.user!.userId, req.body);
      res.json(success(result, { message: 'Profile updated successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async updatePrivacySettings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.updatePrivacySettings(req.params.id, req.user!.userId, req.body);
      res.json(success(result, { message: 'Privacy settings updated successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async blockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.blockUser(req.user!.userId, req.params.id, req.body?.reason);
      res.status(201).json(success(result, { message: 'User blocked successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async unblockUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.unblockUser(req.user!.userId, req.params.id);
      res.json(success(result, { message: 'User unblocked successfully' }));
    } catch (error) {
      next(error);
    }
  }

  static async getBlockedUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getBlockedUsers(req.user!.userId, req.query);
      res.json(paginated(result.blockedUsers, result.total, result.page, result.limit));
    } catch (error) {
      next(error);
    }
  }
}
