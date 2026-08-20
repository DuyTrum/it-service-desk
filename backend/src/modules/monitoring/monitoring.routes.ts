import { Router } from 'express';
import { MonitoringController } from './monitoring.controller';
import { authenticate, authorize, authenticateAgent } from '../../middleware/auth.middleware';

const router = Router();
const monitoringController = new MonitoringController();

// Telemetry from Python Agent
router.post('/health', authenticateAgent, monitoringController.ingestHealth);

// Technician & Admin dashboards
router.get('/devices', authenticate, authorize(['TECHNICIAN', 'ADMIN']), monitoringController.getDevices);
router.get('/devices/:id/history', authenticate, authorize(['TECHNICIAN', 'ADMIN']), monitoringController.getDeviceHistory);
router.get('/alerts', authenticate, authorize(['TECHNICIAN', 'ADMIN']), monitoringController.getAlerts);
router.patch('/alerts/:id/resolve', authenticate, authorize(['TECHNICIAN', 'ADMIN']), monitoringController.resolveAlert);

export default router;
