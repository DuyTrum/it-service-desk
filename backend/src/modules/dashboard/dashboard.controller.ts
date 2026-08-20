import { Request, Response } from 'express';
import { DashboardService } from './dashboard.service';
import { successResponse, errorResponse } from '../../utils/response';

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await dashboardService.getStats();
      successResponse(res, stats, 'Dashboard stats retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch dashboard stats', 500);
    }
  }

  async getCharts(req: Request, res: Response): Promise<void> {
    try {
      const charts = await dashboardService.getCharts();
      successResponse(res, charts, 'Dashboard charts data retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch dashboard charts', 500);
    }
  }
}
