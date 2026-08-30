import { Request, Response, NextFunction } from 'express';
import { MessageService } from './messages.service';
import { success, paginated } from '../../utils/apiResponse';
import { getPagination } from '../../utils/pagination';

export class MessageController {
  static async findByConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const pagination = getPagination(req);
      const result = await MessageService.findByConversation(
        req.params.id,
        req.user!.userId,
        pagination,
      );
      res.json(paginated(result.messages, result.total, result.page, result.limit));
    } catch (e) {
      next(e);
    }
  }

  static async send(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MessageService.send(req.params.id, req.user!.userId, req.body);
      res.status(201).json(success(result));
    } catch (e) {
      next(e);
    }
  }

  static async edit(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MessageService.edit(req.params.id, req.user!.userId, req.body);
      res.json(success(result));
    } catch (e) {
      next(e);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await MessageService.delete(req.params.id, req.user!.userId);
      res.json(success(result));
    } catch (e) {
      next(e);
    }
  }
}
