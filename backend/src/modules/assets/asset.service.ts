import { query, pool } from '../../config/db';
import { AuthUserPayload } from '../../types';

export class AssetService {
  async getAllAssets(filters: {
    status?: string;
    category?: string;
    departmentId?: string;
    assignedUserId?: string;
    search?: string;
  }) {
    let sql = `
      SELECT a.*,
             u.full_name as assigned_user_name, u.email as assigned_user_email,
             d.name as department_name,
             (SELECT COUNT(*) FROM tickets WHERE asset_id = a.id) as ticket_count,
             (SELECT COUNT(*) FROM system_alerts WHERE asset_id = a.id AND is_resolved = FALSE) as active_alert_count,
             hl.cpu_usage as last_cpu, hl.ram_usage as last_ram, hl.disk_usage as last_disk,
             hl.network_status as last_network_status, hl.created_at as last_telemetry_at
      FROM assets a
      LEFT JOIN users u ON a.assigned_user_id = u.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN LATERAL (
        SELECT cpu_usage, ram_usage, disk_usage, network_status, created_at
        FROM device_health_logs
        WHERE asset_id = a.id
        ORDER BY created_at DESC
        LIMIT 1
      ) hl ON TRUE
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      sql += ` AND a.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.category) {
      sql += ` AND a.category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters.departmentId) {
      sql += ` AND a.department_id = $${paramIndex++}`;
      params.push(filters.departmentId);
    }

    if (filters.assignedUserId) {
      sql += ` AND a.assigned_user_id = $${paramIndex++}`;
      params.push(filters.assignedUserId);
    }

    if (filters.search) {
      sql += ` AND (a.asset_code ILIKE $${paramIndex} OR a.name ILIKE $${paramIndex} OR a.serial_number ILIKE $${paramIndex} OR a.model ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY a.created_at DESC`;

    const res = await query(sql, params);
    return res.rows;
  }

  async getMyAssets(userId: string) {
    const res = await query(
      `SELECT a.*, d.name as department_name,
              hl.cpu_usage as last_cpu, hl.ram_usage as last_ram, hl.disk_usage as last_disk,
              hl.network_status as last_network_status, hl.created_at as last_telemetry_at
       FROM assets a
       LEFT JOIN departments d ON a.department_id = d.id
       LEFT JOIN LATERAL (
         SELECT cpu_usage, ram_usage, disk_usage, network_status, created_at
         FROM device_health_logs
         WHERE asset_id = a.id
         ORDER BY created_at DESC
         LIMIT 1
       ) hl ON TRUE
       WHERE a.assigned_user_id = $1
       ORDER BY a.name ASC`,
      [userId]
    );
    return res.rows;
  }

  async getAssetById(id: string) {
    const assetRes = await query(
      `SELECT a.*,
              u.full_name as assigned_user_name, u.email as assigned_user_email, u.phone as assigned_user_phone,
              d.name as department_name
       FROM assets a
       LEFT JOIN users u ON a.assigned_user_id = u.id
       LEFT JOIN departments d ON a.department_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    if (assetRes.rows.length === 0) {
      throw new Error('Asset not found');
    }

    const asset = assetRes.rows[0];

    // Fetch history
    const historyRes = await query(
      `SELECT ah.*,
              p.full_name as performed_by_name,
              t.full_name as target_user_name
       FROM asset_history ah
       LEFT JOIN users p ON ah.performed_by_user_id = p.id
       LEFT JOIN users t ON ah.target_user_id = t.id
       WHERE ah.asset_id = $1
       ORDER BY ah.created_at DESC`,
      [id]
    );

    // Fetch related tickets
    const ticketsRes = await query(
      `SELECT id, ticket_code, title, category, priority, status, created_at, resolved_at
       FROM tickets
       WHERE asset_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    // Fetch recent health telemetry
    const healthLogsRes = await query(
      `SELECT * FROM device_health_logs
       WHERE asset_id = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [id]
    );

    // Fetch active alerts
    const alertsRes = await query(
      `SELECT * FROM system_alerts
       WHERE asset_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    return {
      ...asset,
      history: historyRes.rows,
      tickets: ticketsRes.rows,
      healthLogs: healthLogsRes.rows,
      alerts: alertsRes.rows,
    };
  }

  async createAsset(user: AuthUserPayload, data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertRes = await client.query(
        `INSERT INTO assets (
           asset_code, name, category, brand, model, serial_number,
           purchase_date, warranty_expires, status, assigned_user_id,
           department_id, location, ip_address, mac_address, specs, notes
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING *`,
        [
          data.assetCode,
          data.name,
          data.category,
          data.brand || null,
          data.model || null,
          data.serialNumber || null,
          data.purchaseDate || null,
          data.warrantyExpires || null,
          data.status || 'Available',
          data.assignedUserId || null,
          data.departmentId || null,
          data.location || null,
          data.ipAddress || null,
          data.macAddress || null,
          data.specs ? JSON.stringify(data.specs) : '{}',
          data.notes || null,
        ]
      );

      const asset = insertRes.rows[0];

      // Add history log
      await client.query(
        `INSERT INTO asset_history (asset_id, action, performed_by_user_id, target_user_id, notes)
         VALUES ($1, 'Purchased', $2, $3, $4)`,
        [asset.id, user.id, data.assignedUserId || null, 'Asset created and registered in inventory']
      );

      if (data.assignedUserId) {
        await client.query(
          `INSERT INTO asset_history (asset_id, action, performed_by_user_id, target_user_id, notes)
           VALUES ($1, 'Assigned', $2, $3, 'Initial assignment upon creation')`,
          [asset.id, user.id, data.assignedUserId]
        );
      }

      await client.query('COMMIT');
      return asset;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateAsset(id: string, user: AuthUserPayload, data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existing = await client.query(`SELECT * FROM assets WHERE id = $1`, [id]);
      if (existing.rows.length === 0) {
        throw new Error('Asset not found');
      }
      const current = existing.rows[0];

      const updateRes = await client.query(
        `UPDATE assets SET
           name = COALESCE($1, name),
           category = COALESCE($2, category),
           brand = COALESCE($3, brand),
           model = COALESCE($4, model),
           serial_number = COALESCE($5, serial_number),
           purchase_date = COALESCE($6, purchase_date),
           warranty_expires = COALESCE($7, warranty_expires),
           status = COALESCE($8, status),
           assigned_user_id = CASE WHEN $9::text IS NOT NULL THEN $9::uuid ELSE assigned_user_id END,
           department_id = CASE WHEN $10::text IS NOT NULL THEN $10::uuid ELSE department_id END,
           location = COALESCE($11, location),
           ip_address = COALESCE($12, ip_address),
           mac_address = COALESCE($13, mac_address),
           specs = CASE WHEN $14::jsonb IS NOT NULL THEN $14::jsonb ELSE specs END,
           notes = COALESCE($15, notes),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $16
         RETURNING *`,
        [
          data.name || null,
          data.category || null,
          data.brand || null,
          data.model || null,
          data.serialNumber || null,
          data.purchaseDate || null,
          data.warrantyExpires || null,
          data.status || null,
          data.assignedUserId !== undefined ? data.assignedUserId : null,
          data.departmentId !== undefined ? data.departmentId : null,
          data.location || null,
          data.ipAddress || null,
          data.macAddress || null,
          data.specs ? JSON.stringify(data.specs) : null,
          data.notes || null,
          id,
        ]
      );

      const updatedAsset = updateRes.rows[0];

      // Audit status or assignment change
      if (data.status && data.status !== current.status) {
        let action = 'Status Changed';
        if (data.status === 'Under Maintenance') action = 'Sent for Maintenance';
        else if (data.status === 'Available' && current.status === 'Under Maintenance') action = 'Repaired';
        else if (data.status === 'Retired') action = 'Retired';

        await client.query(
          `INSERT INTO asset_history (asset_id, action, performed_by_user_id, notes)
           VALUES ($1, $2, $3, $4)`,
          [id, action, user.id, data.actionNote || `Status changed from ${current.status} to ${data.status}`]
        );
      }

      if (data.assignedUserId !== undefined && data.assignedUserId !== current.assigned_user_id) {
        const action = data.assignedUserId ? 'Assigned' : 'Returned';
        await client.query(
          `INSERT INTO asset_history (asset_id, action, performed_by_user_id, target_user_id, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, action, user.id, data.assignedUserId || null, data.actionNote || (data.assignedUserId ? 'Assigned to new user' : 'Returned to inventory pool')]
        );
      }

      await client.query('COMMIT');
      return updatedAsset;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
