import { Request, Response } from 'express';
import { MonitoringService } from './monitoring.service';
import { successResponse, errorResponse } from '../../utils/response';

const monitoringService = new MonitoringService();

export class MonitoringController {
  async ingestHealth(req: Request, res: Response): Promise<void> {
    try {
      const result = await monitoringService.ingestHealth(req.body);
      successResponse(res, result, 'Health telemetry ingested', 201);
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to ingest health telemetry', 400);
    }
  }

  async getDevices(req: Request, res: Response): Promise<void> {
    try {
      const devices = await monitoringService.getMonitoredDevices();
      successResponse(res, devices, 'Monitored devices retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch devices', 500);
    }
  }

  async getDeviceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const history = await monitoringService.getDeviceHistory(id);
      successResponse(res, history, 'Device history retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch device history', 500);
    }
  }

  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { isResolved } = req.query;
      const resolvedBool = isResolved !== undefined ? isResolved === 'true' : undefined;
      const alerts = await monitoringService.getAlerts(resolvedBool);
      successResponse(res, alerts, 'Alerts retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch alerts', 500);
    }
  }

  async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alert = await monitoringService.resolveAlert(id, req.user!);
      successResponse(res, alert, 'Alert marked as resolved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to resolve alert', 400);
    }
  }
}
