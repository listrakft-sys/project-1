import { Router } from 'express';
import { NotificationController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { queryNotificationsSchema } from './notifications.schema';

const router = Router();

router.use(authenticate);

// GET /notifications — Paginated list of notifications with type/isRead filters
router.get('/', validate(queryNotificationsSchema), NotificationController.findAll);

// GET /notifications/unread-count — Get count of unread notifications
router.get('/unread-count', NotificationController.getUnreadCount);

// PUT /notifications/read-all — Mark all notifications as read
router.put('/read-all', NotificationController.markAllAsRead);

// PUT /notifications/:id/read — Mark single notification as read
router.put('/:id/read', NotificationController.markAsRead);

// DELETE /notifications/:id — Delete own notification
router.delete('/:id', NotificationController.delete);

export default router;
