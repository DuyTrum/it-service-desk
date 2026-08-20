import { query } from '../../config/db';

export class DashboardService {
  async getStats() {
    // 1. Ticket metrics
    const ticketStats = await query(`
      SELECT
        COUNT(*) as total_tickets,
        COUNT(*) FILTER (WHERE status = 'Open') as open_tickets,
        COUNT(*) FILTER (WHERE status = 'In Progress') as in_progress_tickets,
        COUNT(*) FILTER (WHERE status = 'Waiting for User') as waiting_user_tickets,
        COUNT(*) FILTER (WHERE status = 'Resolved') as resolved_tickets,
        COUNT(*) FILTER (WHERE status = 'Closed') as closed_tickets,
        COUNT(*) FILTER (WHERE priority = 'Critical' AND status NOT IN ('Resolved', 'Closed')) as critical_open_tickets,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_hours,
        AVG(satisfaction_rating) FILTER (WHERE satisfaction_rating IS NOT NULL) as avg_satisfaction_rating
      FROM tickets
    `);

    // 2. Asset metrics
    const assetStats = await query(`
      SELECT
        COUNT(*) as total_assets,
        COUNT(*) FILTER (WHERE status = 'Available') as available_assets,
        COUNT(*) FILTER (WHERE status = 'Assigned') as assigned_assets,
        COUNT(*) FILTER (WHERE status = 'Under Maintenance') as maintenance_assets,
        COUNT(*) FILTER (WHERE status = 'Broken') as broken_assets,
        COUNT(*) FILTER (WHERE status = 'Retired') as retired_assets
      FROM assets
    `);

    // 3. Monitoring & Alert metrics
    const alertStats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE is_resolved = FALSE) as active_alerts,
        COUNT(*) FILTER (WHERE is_resolved = FALSE AND severity = 'Critical') as critical_alerts,
        COUNT(*) FILTER (WHERE is_resolved = FALSE AND alert_type = 'DISK_HIGH') as disk_alerts
      FROM system_alerts
    `);

    // 4. Offline devices
    const deviceStats = await query(`
      WITH latest_logs AS (
        SELECT DISTINCT ON (hostname) hostname, disk_usage, created_at
        FROM device_health_logs
        ORDER BY hostname, created_at DESC
      )
      SELECT
        COUNT(*) as total_monitored,
        COUNT(*) FILTER (WHERE created_at < (NOW() - INTERVAL '3 minutes')) as offline_devices,
        COUNT(*) FILTER (WHERE disk_usage > 85) as high_disk_devices
      FROM latest_logs
    `);

    const t = ticketStats.rows[0];
    const a = assetStats.rows[0];
    const al = alertStats.rows[0];
    const d = deviceStats.rows[0];

    return {
      tickets: {
        total: parseInt(t.total_tickets, 10),
        open: parseInt(t.open_tickets, 10),
        inProgress: parseInt(t.in_progress_tickets, 10),
        waitingUser: parseInt(t.waiting_user_tickets, 10),
        resolved: parseInt(t.resolved_tickets, 10),
        closed: parseInt(t.closed_tickets, 10),
        criticalOpen: parseInt(t.critical_open_tickets, 10),
        avgResolutionHours: t.avg_resolution_hours ? parseFloat(parseFloat(t.avg_resolution_hours).toFixed(1)) : 0,
        avgRating: t.avg_satisfaction_rating ? parseFloat(parseFloat(t.avg_satisfaction_rating).toFixed(1)) : 5.0,
      },
      assets: {
        total: parseInt(a.total_assets, 10),
        available: parseInt(a.available_assets, 10),
        assigned: parseInt(a.assigned_assets, 10),
        underMaintenance: parseInt(a.maintenance_assets, 10),
        broken: parseInt(a.broken_assets, 10),
        retired: parseInt(a.retired_assets, 10),
      },
      monitoring: {
        activeAlerts: parseInt(al.active_alerts, 10),
        criticalAlerts: parseInt(al.critical_alerts, 10),
        totalMonitored: parseInt(d.total_monitored || '0', 10),
        offlineDevices: parseInt(d.offline_devices || '0', 10),
        highDiskDevices: parseInt(d.high_disk_devices || '0', 10),
      },
    };
  }

  async getCharts() {
    // 1. Tickets by Category
    const categoryRes = await query(`
      SELECT category, COUNT(*) as count
      FROM tickets
      GROUP BY category
      ORDER BY count DESC
    `);

    // 2. Tickets by Priority
    const priorityRes = await query(`
      SELECT priority, COUNT(*) as count
      FROM tickets
      GROUP BY priority
      ORDER BY
        CASE
          WHEN priority = 'Critical' THEN 1
          WHEN priority = 'High' THEN 2
          WHEN priority = 'Medium' THEN 3
          ELSE 4
        END
    `);

    // 3. Asset Status breakdown
    const assetStatusRes = await query(`
      SELECT status, COUNT(*) as count
      FROM assets
      GROUP BY status
      ORDER BY count DESC
    `);

    // 4. Ticket trend (last 14 days)
    const trendRes = await query(`
      SELECT
        TO_CHAR(d.day, 'YYYY-MM-DD') as date,
        COUNT(t.id) as created_count,
        COUNT(t.id) FILTER (WHERE t.status IN ('Resolved', 'Closed')) as resolved_count
      FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day'::interval) d(day)
      LEFT JOIN tickets t ON DATE(t.created_at) = DATE(d.day)
      GROUP BY d.day
      ORDER BY d.day ASC
    `);

    return {
      ticketsByCategory: categoryRes.rows,
      ticketsByPriority: priorityRes.rows,
      assetsByStatus: assetStatusRes.rows,
      ticketTrend: trendRes.rows,
    };
  }
}
