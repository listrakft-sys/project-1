import { Request, Response, NextFunction } from 'express';
import { ConversationService } from './conversations.service';
import { success, paginated } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';

export class ConversationController {
  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req);
      const result = await ConversationService.findAll(req.user!.userId, pagination);
      res.json(paginated(result.conversations, result.total, result.page, result.limit));
    } catch (e) {
      next(e);
    }
  }

  static async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConversationService.findById(req.params.id, req.user!.userId);
      res.json(success(result));
    } catch (e) {
      next(e);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConversationService.create(req.user!.userId, req.body);
      res.status(201).json(success(result));
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConversationService.update(req.params.id, req.user!.userId, req.body);
      res.json(success(result));
    } catch (e) {
      next(e);
    }
  }

  static async leave(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConversationService.leave(req.params.id, req.user!.userId);
      res.json(success(result));
    } catch (e) {
      next(e);
    }
  }

  static async addParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConversationService.addParticipant(
        req.params.id,
        req.user!.userId,
        req.body.userId,
        req.body.role,
      );
      res.status(201).json(success(result));
    } catch (e) {
      next(e);
    }
  }

  static async removeParticipant(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConversationService.removeParticipant(
        req.params.id,
        req.user!.userId,
        req.params.userId,
      );
      res.json(success(result));
    } catch (e) {
      next(e);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConversationService.getUnreadCount(req.user!.userId);
      res.json(success(result));
    } catch (e) {
      next(e);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ConversationService.markAsRead(req.params.id, req.user!.userId);
      res.json(success(result));
    } catch (e) {
      next(e);
    }
  }
}
