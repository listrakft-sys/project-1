import { Router } from 'express';
import { FilesController } from './files.controller';
import { authenticate } from '../../middleware/auth';
import { upload } from '../../config/multer';

const router = Router();

router.use(authenticate);

router.post('/upload', upload.single('file'), FilesController.upload);
router.get('/entity/:entityType/:entityId', FilesController.getByEntity);
router.get('/:id', FilesController.getById);
router.delete('/:id', FilesController.delete);

export default router;
