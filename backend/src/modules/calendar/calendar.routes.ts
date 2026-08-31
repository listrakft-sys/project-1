import { Router } from 'express';
import { CalendarController } from './calendar.controller';
import { authenticate, requireRole } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// GET /calendar — List events (role-based scoping, date range filter)
router.get('/', CalendarController.getEvents);

// GET /calendar/:id — Single event
router.get('/:id', CalendarController.getEventById);

// POST /calendar — Create event (teachers and admins only)
router.post('/', requireRole('TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'), CalendarController.createEvent);

// PUT /calendar/:id — Update event (creator or admin)
router.put('/:id', CalendarController.updateEvent);

// DELETE /calendar/:id — Delete event (creator or admin)
router.delete('/:id', CalendarController.deleteEvent);

export default router;
