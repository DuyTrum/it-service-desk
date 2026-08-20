import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

router.get('/', authenticate, notificationController.getMy);
router.patch('/:id/read', authenticate, notificationController.markRead);
router.post('/read-all', authenticate, notificationController.markAllRead);

export default router;
