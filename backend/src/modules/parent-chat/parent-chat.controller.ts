import { Request, Response, NextFunction } from 'express';
import { ParentChatService } from './parent-chat.service';
import { success } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiResponse';

export class ParentChatController {
  // ── Parent-Student linking ──

  static async getChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const children = await ParentChatService.getChildren(req.user!.userId);
      res.json(success(children));
    } catch (e) { next(e); }
  }

  static async linkChild(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, relationship, isPrimary } = req.body;
      if (!studentId) throw new ApiError(400, 'MISSING_FIELD', 'studentId is required');
      const result = await ParentChatService.linkChild(req.user!.userId, studentId, relationship, isPrimary || false);
      res.status(result.alreadyLinked ? 200 : 201).json(success(result));
    } catch (e) { next(e); }
  }

  static async unlinkChild(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ParentChatService.unlinkChild(req.user!.userId, req.params.studentId);
      res.json(success(result));
    } catch (e) { next(e); }
  }

  // ── Parent-Teacher 1-on-1 chat ──

  static async getTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const teachers = await ParentChatService.getTeachersForParent(req.user!.userId);
      res.json(success(teachers));
    } catch (e) { next(e); }
  }

  static async startChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherUserId, studentId } = req.body;
      if (!teacherUserId) throw new ApiError(400, 'MISSING_FIELD', 'teacherUserId is required');
      const result = await ParentChatService.startParentTeacherChat(req.user!.userId, teacherUserId, studentId);
      res.status(result.created ? 201 : 200).json(success(result));
    } catch (e) { next(e); }
  }

  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const conversations = await ParentChatService.getParentTeacherConversations(req.user!.userId);
      res.json(success(conversations));
    } catch (e) { next(e); }
  }

  // ── Parent Group Chat (parents of same class) ──

  static async getGroupConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const conversations = await ParentChatService.getParentGroupConversations(req.user!.userId);
      res.json(success(conversations));
    } catch (e) { next(e); }
  }

  static async getAvailableGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await ParentChatService.getAvailableClassGroups(req.user!.userId);
      res.json(success(groups));
    } catch (e) { next(e); }
  }

  static async createOrJoinGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId } = req.body;
      if (!classId) throw new ApiError(400, 'MISSING_FIELD', 'classId is required');
      const result = await ParentChatService.getOrCreateClassParentGroup(req.user!.userId, classId);
      res.status(result.created ? 201 : 200).json(success(result));
    } catch (e) { next(e); }
  }
}
