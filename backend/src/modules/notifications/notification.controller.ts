import { Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { successResponse, errorResponse } from '../../utils/response';

const notificationService = new NotificationService();

export class NotificationController {
  async getMy(req: Request, res: Response): Promise<void> {
    try {
      const notifications = await notificationService.getUserNotifications(req.user!.id);
      successResponse(res, notifications, 'Notifications retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch notifications', 500);
    }
  }

  async markRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id, req.user!.id);
      successResponse(res, notification, 'Notification marked as read');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to update notification', 400);
    }
  }

  async markAllRead(req: Request, res: Response): Promise<void> {
    try {
      await notificationService.markAllAsRead(req.user!.id);
      successResponse(res, null, 'All notifications marked as read');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to update notifications', 500);
    }
  }
}
