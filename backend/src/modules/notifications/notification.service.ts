import { query } from '../../config/db';

export class NotificationService {
  async getUserNotifications(userId: string) {
    const res = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );
    return res.rows;
  }

  async markAsRead(notificationId: string, userId: string) {
    const res = await query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return res.rows[0];
  }

  async markAllAsRead(userId: string) {
    await query(
      `UPDATE notifications SET is_read = TRUE
       WHERE user_id = $1`,
      [userId]
    );
    return { success: true };
  }
}
