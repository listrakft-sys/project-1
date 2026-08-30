import { Router } from 'express';
import { AnnouncementController } from './announcements.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from './announcements.schema';

const router = Router();

router.use(authenticate);

// GET /announcements — List announcements with filter and pagination
router.get('/', AnnouncementController.findAll);

// GET /announcements/feed — Personalized feed for current user
router.get('/feed', AnnouncementController.getFeed);

// POST /announcements — Create new announcement
router.post(
  '/',
  requirePermission('announcements', 'create'),
  validate(createAnnouncementSchema),
  AnnouncementController.create
);

// GET /announcements/:id — Get single announcement by ID
router.get('/:id', AnnouncementController.findById);

// PUT /announcements/:id — Update announcement (author or admin)
router.put(
  '/:id',
  validate(updateAnnouncementSchema),
  AnnouncementController.update
);

// DELETE /announcements/:id — Delete announcement (author or admin)
router.delete('/:id', AnnouncementController.delete);

// POST /announcements/:id/pin — Toggle pin status (admin only)
router.post(
  '/:id/pin',
  requireRole('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  AnnouncementController.pin
);

export default router;
