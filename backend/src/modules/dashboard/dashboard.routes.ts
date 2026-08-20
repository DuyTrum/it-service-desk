import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

router.get('/stats', authenticate, authorize(['TECHNICIAN', 'ADMIN']), dashboardController.getStats);
router.get('/charts', authenticate, authorize(['TECHNICIAN', 'ADMIN']), dashboardController.getCharts);

export default router;
