import { Router } from 'express';
import { KnowledgeBaseController } from './kb.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const kbController = new KnowledgeBaseController();

router.get('/categories', authenticate, kbController.getCategories);
router.get('/', authenticate, kbController.search);
router.get('/:id', authenticate, kbController.getById);
router.post('/', authenticate, authorize(['TECHNICIAN', 'ADMIN']), kbController.create);
router.patch('/:id', authenticate, authorize(['TECHNICIAN', 'ADMIN']), kbController.update);

export default router;
