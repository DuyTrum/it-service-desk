import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.get('/', authenticate, authorize(['ADMIN', 'TECHNICIAN']), userController.getAll);
router.get('/technicians', authenticate, userController.getTechnicians);
router.get('/departments', authenticate, userController.getDepartments);
router.post('/', authenticate, authorize(['ADMIN']), userController.create);
router.patch('/:id', authenticate, authorize(['ADMIN']), userController.update);

export default router;
