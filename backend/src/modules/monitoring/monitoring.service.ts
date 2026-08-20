import { query, pool } from '../../config/db';
import { AuthUserPayload, DeviceHealthPayload } from '../../types';
import { emitToTechnicians } from '../../sockets/socket.server';

export class MonitoringService {
  async ingestHealth(payload: DeviceHealthPayload) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Try to correlate asset by MAC address, IP address, or Hostname/code
      let assetId: string | null = null;

      if (payload.mac_address) {
        const macMatch = await client.query(
          `SELECT id FROM assets WHERE mac_address = $1 LIMIT 1`,
          [payload.mac_address]
        );
        if (macMatch.rows.length > 0) {
          assetId = macMatch.rows[0].id;
        }
      }

      if (!assetId && payload.ip_address) {
        const ipMatch = await client.query(
          `SELECT id FROM assets WHERE ip_address = $1 LIMIT 1`,
          [payload.ip_address]
        );
        if (ipMatch.rows.length > 0) {
          assetId = ipMatch.rows[0].id;
        }
      }

      if (!assetId && payload.hostname) {
        const hostMatch = await client.query(
          `SELECT id FROM assets WHERE asset_code ILIKE $1 OR name ILIKE $1 LIMIT 1`,
          [`%${payload.hostname}%`]
        );
        if (hostMatch.rows.length > 0) {
          assetId = hostMatch.rows[0].id;
        }
      }

      // 2. Insert telemetry log
      const logRes = await client.query(
        `INSERT INTO device_health_logs (
           asset_id, hostname, os_info, cpu_usage, ram_usage, disk_usage,
           ip_address, mac_address, network_status, uptime_seconds
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          assetId,
          payload.hostname,
          payload.os_info || 'Unknown OS',
          payload.cpu_usage,
          payload.ram_usage,
          payload.disk_usage,
          payload.ip_address || null,
          payload.mac_address || null,
          payload.network_status || 'online',
          payload.uptime_seconds || 0,
        ]
      );

      const log = logRes.rows[0];

      // 3. Proactive Alert Rules Engine
      const triggeredAlerts = [];

      // Rule A: Disk Usage > 85%
      if (payload.disk_usage > 85) {
        const existing = await client.query(
          `SELECT id FROM system_alerts WHERE asset_id = $1 AND alert_type = 'DISK_HIGH' AND is_resolved = FALSE`,
          [assetId]
        );
        if (existing.rows.length === 0) {
          const alertRes = await client.query(
            `INSERT INTO system_alerts (asset_id, alert_type, severity, message)
             VALUES ($1, 'DISK_HIGH', 'Warning', $2)
             RETURNING *`,
            [assetId, `Device ${payload.hostname} System Drive C: usage is ${payload.disk_usage}% (Threshold > 85%)`]
          );
          triggeredAlerts.push(alertRes.rows[0]);
        }
      }

      // Rule B: CPU Usage > 90%
      if (payload.cpu_usage > 90) {
        const existing = await client.query(
          `SELECT id FROM system_alerts WHERE asset_id = $1 AND alert_type = 'CPU_HIGH' AND is_resolved = FALSE`,
          [assetId]
        );
        if (existing.rows.length === 0) {
          const alertRes = await client.query(
            `INSERT INTO system_alerts (asset_id, alert_type, severity, message)
             VALUES ($1, 'CPU_HIGH', 'Critical', $2)
             RETURNING *`,
            [assetId, `Critical: Device ${payload.hostname} CPU Usage is ${payload.cpu_usage}% (Threshold > 90%)`]
          );
          triggeredAlerts.push(alertRes.rows[0]);
        }
      }

      // Rule C: RAM Usage > 90%
      if (payload.ram_usage > 90) {
        const existing = await client.query(
          `SELECT id FROM system_alerts WHERE asset_id = $1 AND alert_type = 'RAM_HIGH' AND is_resolved = FALSE`,
          [assetId]
        );
        if (existing.rows.length === 0) {
          const alertRes = await client.query(
            `INSERT INTO system_alerts (asset_id, alert_type, severity, message)
             VALUES ($1, 'RAM_HIGH', 'Warning', $2)
             RETURNING *`,
            [assetId, `Warning: Device ${payload.hostname} Memory Usage is ${payload.ram_usage}% (Threshold > 90%)`]
          );
          triggeredAlerts.push(alertRes.rows[0]);
        }
      }

      await client.query('COMMIT');

      // 4. Real-time notifications for triggered alerts
      for (const alert of triggeredAlerts) {
        emitToTechnicians('monitoring:alert', {
          id: alert.id,
          assetId: alert.asset_id,
          hostname: payload.hostname,
          type: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          createdAt: alert.created_at,
        });
      }

      return { log, triggeredAlerts };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getMonitoredDevices() {
    const res = await query(
      `SELECT DISTINCT ON (COALESCE(a.id::text, hl.hostname))
              a.id as asset_id, a.asset_code, a.name as asset_name, a.category,
              u.full_name as assigned_user_name, d.name as department_name,
              hl.hostname, hl.os_info, hl.cpu_usage, hl.ram_usage, hl.disk_usage,
              hl.ip_address, hl.mac_address, hl.network_status, hl.uptime_seconds,
              hl.created_at as last_seen,
              CASE
                WHEN hl.created_at > (NOW() - INTERVAL '3 minutes') THEN 'Online'
                ELSE 'Offline'
              END as live_status,
              (SELECT COUNT(*) FROM system_alerts WHERE asset_id = a.id AND is_resolved = FALSE) as active_alert_count
       FROM device_health_logs hl
       LEFT JOIN assets a ON hl.asset_id = a.id
       LEFT JOIN users u ON a.assigned_user_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       ORDER BY COALESCE(a.id::text, hl.hostname), hl.created_at DESC`
    );

    return res.rows;
  }

  async getDeviceHistory(hostnameOrAssetId: string) {
    const res = await query(
      `SELECT * FROM device_health_logs
       WHERE asset_id::text = $1 OR hostname = $1
       ORDER BY created_at ASC
       LIMIT 100`,
      [hostnameOrAssetId]
    );
    return res.rows;
  }

  async getAlerts(isResolved?: boolean) {
    let sql = `
      SELECT sa.*, a.asset_code, a.name as asset_name, u.full_name as assigned_user,
             r.full_name as resolved_by_name
      FROM system_alerts sa
      LEFT JOIN assets a ON sa.asset_id = a.id
      LEFT JOIN users u ON a.assigned_user_id = u.id
      LEFT JOIN users r ON sa.resolved_by_user_id = r.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (isResolved !== undefined) {
      sql += ` AND sa.is_resolved = $1`;
      params.push(isResolved);
    }
    sql += ` ORDER BY sa.created_at DESC`;

    const res = await query(sql, params);
    return res.rows;
  }

  async resolveAlert(alertId: string, user: AuthUserPayload) {
    const res = await query(
      `UPDATE system_alerts SET
         is_resolved = TRUE,
         resolved_by_user_id = $1,
         resolved_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [user.id, alertId]
    );

    if (res.rows.length === 0) {
      throw new Error('Alert not found');
    }

    emitToTechnicians('monitoring:alert_resolved', { id: alertId });
    return res.rows[0];
  }
}
