import { Request, Response, NextFunction } from 'express';
import { ParentChatService } from './parent-chat.service';
import { success } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiResponse';

export class ParentChatController {
  /**
   * GET /parent-chat/children
   * Returns all children linked to the logged-in parent.
   */
  static async getChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const children = await ParentChatService.getChildren(req.user!.userId);
      res.json(success(children));
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /parent-chat/link
   * Body: { studentId, relationship?, isPrimary? }
   * Links a parent to a student.
   */
  static async linkChild(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId, relationship, isPrimary } = req.body;
      if (!studentId) throw new ApiError(400, 'MISSING_FIELD', 'studentId is required');
      const result = await ParentChatService.linkChild(
        req.user!.userId,
        studentId,
        relationship,
        isPrimary || false,
      );
      res.status(result.alreadyLinked ? 200 : 201).json(success(result));
    } catch (e) {
      next(e);
    }
  }

  /**
   * DELETE /parent-chat/unlink/:studentId
   * Unlinks a child from the logged-in parent.
   */
  static async unlinkChild(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ParentChatService.unlinkChild(req.user!.userId, req.params.studentId);
      res.json(success(result));
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /parent-chat/teachers
   * Returns all teachers associated with the parent's children.
   */
  static async getTeachers(req: Request, res: Response, next: NextFunction) {
    try {
      const teachers = await ParentChatService.getTeachersForParent(req.user!.userId);
      res.json(success(teachers));
    } catch (e) {
      next(e);
    }
  }

  /**
   * POST /parent-chat/start
   * Body: { teacherUserId, studentId? }
   * Starts or retrieves a PARENT_TEACHER conversation.
   */
  static async startChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { teacherUserId, studentId } = req.body;
      if (!teacherUserId) throw new ApiError(400, 'MISSING_FIELD', 'teacherUserId is required');
      const result = await ParentChatService.startParentTeacherChat(req.user!.userId, teacherUserId, studentId);
      res.status(result.created ? 201 : 200).json(success(result));
    } catch (e) {
      next(e);
    }
  }

  /**
   * GET /parent-chat/conversations
   * Returns all PARENT_TEACHER conversations for the user.
   */
  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const conversations = await ParentChatService.getParentTeacherConversations(req.user!.userId);
      res.json(success(conversations));
    } catch (e) {
      next(e);
    }
  }
}
