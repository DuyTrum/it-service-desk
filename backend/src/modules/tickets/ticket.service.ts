import { query, pool } from '../../config/db';
import { AuthUserPayload } from '../../types';
import { emitToAll, emitToTechnicians, emitToUser } from '../../sockets/socket.server';

export class TicketService {
  private async generateTicketCode(): Promise<string> {
    const year = new Date().getFullYear();
    const countRes = await query(
      `SELECT COUNT(*) as count FROM tickets WHERE ticket_code LIKE $1`,
      [`TKT-${year}-%`]
    );
    const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
    return `TKT-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  async getTickets(
    user: AuthUserPayload,
    filters: {
      status?: string;
      priority?: string;
      category?: string;
      assignedTechId?: string;
      departmentId?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT t.id, t.ticket_code, t.title, t.description, t.category, t.priority, t.status,
             t.created_by_user_id, u.full_name as creator_name, u.email as creator_email,
             t.assigned_tech_id, tech.full_name as tech_name,
             t.asset_id, a.asset_code, a.name as asset_name,
             t.department_id, d.name as department_name,
             t.satisfaction_rating, t.resolved_at, t.closed_at,
             t.created_at, t.updated_at,
             (SELECT COUNT(*) FROM ticket_comments WHERE ticket_id = t.id) as comment_count,
             (SELECT COUNT(*) FROM ticket_attachments WHERE ticket_id = t.id) as attachment_count
      FROM tickets t
      JOIN users u ON t.created_by_user_id = u.id
      LEFT JOIN users tech ON t.assigned_tech_id = tech.id
      LEFT JOIN assets a ON t.asset_id = a.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // RBAC: Employees can ONLY see their own tickets
    if (user.role === 'EMPLOYEE') {
      sql += ` AND t.created_by_user_id = $${paramIndex++}`;
      params.push(user.id);
    }

    if (filters.status) {
      sql += ` AND t.status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.priority) {
      sql += ` AND t.priority = $${paramIndex++}`;
      params.push(filters.priority);
    }

    if (filters.category) {
      sql += ` AND t.category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters.assignedTechId) {
      sql += ` AND t.assigned_tech_id = $${paramIndex++}`;
      params.push(filters.assignedTechId);
    }

    if (filters.departmentId) {
      sql += ` AND t.department_id = $${paramIndex++}`;
      params.push(filters.departmentId);
    }

    if (filters.search) {
      sql += ` AND (t.title ILIKE $${paramIndex} OR t.ticket_code ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Count Total
    const countSql = `SELECT COUNT(*) FROM (${sql}) as total_rows`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Apply Pagination & Ordering
    sql += ` ORDER BY
      CASE
        WHEN t.priority = 'Critical' THEN 1
        WHEN t.priority = 'High' THEN 2
        WHEN t.priority = 'Medium' THEN 3
        ELSE 4
      END,
      t.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const res = await query(sql, params);

    return {
      tickets: res.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketById(id: string, user: AuthUserPayload) {
    const ticketRes = await query(
      `SELECT t.*,
              u.full_name as creator_name, u.email as creator_email, u.phone as creator_phone,
              tech.full_name as tech_name, tech.email as tech_email,
              a.asset_code, a.name as asset_name, a.category as asset_category, a.model as asset_model,
              a.serial_number as asset_serial, a.status as asset_status, a.specs as asset_specs,
              d.name as department_name
       FROM tickets t
       JOIN users u ON t.created_by_user_id = u.id
       LEFT JOIN users tech ON t.assigned_tech_id = tech.id
       LEFT JOIN assets a ON t.asset_id = a.id
       LEFT JOIN departments d ON t.department_id = d.id
       WHERE t.id = $1`,
      [id]
    );

    if (ticketRes.rows.length === 0) {
      throw new Error('Ticket not found');
    }

    const ticket = ticketRes.rows[0];

    // RBAC: If employee, ensure they own this ticket
    if (user.role === 'EMPLOYEE' && ticket.created_by_user_id !== user.id) {
      throw new Error('Access denied: You can only view your own tickets');
    }

    // Fetch comments
    let commentsSql = `
      SELECT tc.id, tc.comment, tc.is_internal_note, tc.created_at,
             u.id as user_id, u.full_name as user_name, u.email as user_email,
             r.name as role_name
      FROM ticket_comments tc
      JOIN users u ON tc.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE tc.ticket_id = $1
    `;
    if (user.role === 'EMPLOYEE') {
      commentsSql += ` AND tc.is_internal_note = FALSE`;
    }
    commentsSql += ` ORDER BY tc.created_at ASC`;
    const commentsRes = await query(commentsSql, [id]);

    // Fetch history
    const historyRes = await query(
      `SELECT th.id, th.field_changed, th.old_value, th.new_value, th.comment, th.created_at,
              u.full_name as changed_by_name, r.name as changed_by_role
       FROM ticket_history th
       LEFT JOIN users u ON th.changed_by_user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE th.ticket_id = $1
       ORDER BY th.created_at ASC`,
      [id]
    );

    // Fetch attachments
    const attachmentsRes = await query(
      `SELECT ta.id, ta.file_name, ta.file_url, ta.file_type, ta.file_size, ta.created_at,
              u.full_name as uploaded_by_name
       FROM ticket_attachments ta
       LEFT JOIN users u ON ta.uploaded_by_user_id = u.id
       WHERE ta.ticket_id = $1
       ORDER BY ta.created_at ASC`,
      [id]
    );

    // If there is a linked asset, fetch its latest health telemetry
    let assetTelemetry = null;
    if (ticket.asset_id) {
      const telemetryRes = await query(
        `SELECT hostname, os_info, cpu_usage, ram_usage, disk_usage, network_status, uptime_seconds, created_at
         FROM device_health_logs
         WHERE asset_id = $1
         ORDER BY created_at DESC
         LIMIT 1`,
        [ticket.asset_id]
      );
      if (telemetryRes.rows.length > 0) {
        assetTelemetry = telemetryRes.rows[0];
      }
    }

    return {
      ...ticket,
      comments: commentsRes.rows,
      history: historyRes.rows,
      attachments: attachmentsRes.rows,
      assetTelemetry,
    };
  }

  async createTicket(
    user: AuthUserPayload,
    data: {
      title: string;
      description: string;
      category: string;
      priority: string;
      assetId?: string | null;
      departmentId?: string | null;
    }
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const ticketCode = await this.generateTicketCode();
      const departmentId = data.departmentId || user.departmentId || null;

      const insertRes = await client.query(
        `INSERT INTO tickets (
           ticket_code, title, description, category, priority, status,
           created_by_user_id, asset_id, department_id
         )
         VALUES ($1, $2, $3, $4, $5, 'Open', $6, $7, $8)
         RETURNING *`,
        [
          ticketCode,
          data.title,
          data.description,
          data.category,
          data.priority || 'Medium',
          user.id,
          data.assetId || null,
          departmentId,
        ]
      );

      const ticket = insertRes.rows[0];

      // Add creation audit history
      await client.query(
        `INSERT INTO ticket_history (ticket_id, changed_by_user_id, field_changed, old_value, new_value, comment)
         VALUES ($1, $2, 'status', NULL, 'Open', 'Ticket created by employee')`,
        [ticket.id, user.id]
      );

      // Create notification for IT Technicians
      await client.query(
        `INSERT INTO notifications (user_id, title, message, type, link_url)
         SELECT id, 'New Ticket #' || $1, $2, 'TICKET', '/tickets/' || $3
         FROM users WHERE role_id IN (2, 3)`,
        [ticket.ticket_code, `[${ticket.priority}] ${ticket.title}`, ticket.id]
      );

      await client.query('COMMIT');

      // Real-time broadcast to all technicians
      emitToTechnicians('ticket:created', {
        id: ticket.id,
        ticketCode: ticket.ticket_code,
        title: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        creatorName: user.fullName,
        createdAt: ticket.created_at,
      });

      return ticket;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateTicket(
    id: string,
    user: AuthUserPayload,
    data: {
      status?: string;
      priority?: string;
      assignedTechId?: string | null;
      resolutionNotes?: string;
      rootCause?: string;
      comment?: string;
    }
  ) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existingRes = await client.query(`SELECT * FROM tickets WHERE id = $1`, [id]);
      if (existingRes.rows.length === 0) {
        throw new Error('Ticket not found');
      }
      const current = existingRes.rows[0];

      let resolvedAt = current.resolved_at;
      let closedAt = current.closed_at;

      if (data.status === 'Resolved' && current.status !== 'Resolved') {
        resolvedAt = new Date();
      }
      if (data.status === 'Closed' && current.status !== 'Closed') {
        closedAt = new Date();
      }

      // Update ticket fields
      const updateRes = await client.query(
        `UPDATE tickets SET
           status = COALESCE($1, status),
           priority = COALESCE($2, priority),
           assigned_tech_id = CASE WHEN $3::text IS NOT NULL THEN $3::uuid ELSE assigned_tech_id END,
           resolution_notes = COALESCE($4, resolution_notes),
           root_cause = COALESCE($5, root_cause),
           resolved_at = $6,
           closed_at = $7,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $8
         RETURNING *`,
        [
          data.status || null,
          data.priority || null,
          data.assignedTechId !== undefined ? data.assignedTechId : null,
          data.resolutionNotes || null,
          data.rootCause || null,
          resolvedAt,
          closedAt,
          id,
        ]
      );

      const updatedTicket = updateRes.rows[0];

      // Record audit history for status change
      if (data.status && data.status !== current.status) {
        await client.query(
          `INSERT INTO ticket_history (ticket_id, changed_by_user_id, field_changed, old_value, new_value, comment)
           VALUES ($1, $2, 'status', $3, $4, $5)`,
          [id, user.id, current.status, data.status, data.comment || `Status updated to ${data.status}`]
        );
      }

      // Record audit history for tech assignment
      if (data.assignedTechId !== undefined && data.assignedTechId !== current.assigned_tech_id) {
        const techRes = await client.query(`SELECT full_name FROM users WHERE id = $1`, [data.assignedTechId]);
        const techName = techRes.rows[0]?.full_name || 'Unassigned';
        await client.query(
          `INSERT INTO ticket_history (ticket_id, changed_by_user_id, field_changed, old_value, new_value, comment)
           VALUES ($1, $2, 'assigned_tech_id', $3, $4, $5)`,
          [id, user.id, current.assigned_tech_id, data.assignedTechId, `Assigned to ${techName}`]
        );

        if (data.assignedTechId) {
          emitToUser(data.assignedTechId, 'ticket:assigned', {
            ticketId: id,
            ticketCode: current.ticket_code,
            title: current.title,
          });
        }
      }

      // Record audit history for priority change
      if (data.priority && data.priority !== current.priority) {
        await client.query(
          `INSERT INTO ticket_history (ticket_id, changed_by_user_id, field_changed, old_value, new_value, comment)
           VALUES ($1, $2, 'priority', $3, $4, 'Priority changed')`,
          [id, user.id, current.priority, data.priority]
        );
      }

      await client.query('COMMIT');

      // Real-time broadcast
      emitToAll('ticket:updated', {
        id,
        ticketCode: updatedTicket.ticket_code,
        status: updatedTicket.status,
        priority: updatedTicket.priority,
        assignedTechId: updatedTicket.assigned_tech_id,
        updatedAt: updatedTicket.updated_at,
      });

      // Notify the ticket creator
      emitToUser(current.created_by_user_id, 'ticket:status_changed', {
        id,
        ticketCode: current.ticket_code,
        status: updatedTicket.status,
      });

      return updatedTicket;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async addComment(
    ticketId: string,
    user: AuthUserPayload,
    commentText: string,
    isInternalNote = false
  ) {
    // If Employee, prevent setting internal notes
    const internalNote = user.role === 'EMPLOYEE' ? false : isInternalNote;

    const res = await query(
      `INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal_note)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [ticketId, user.id, commentText, internalNote]
    );

    const newComment = res.rows[0];

    // Fetch ticket creator to notify
    const ticketRes = await query(`SELECT created_by_user_id, assigned_tech_id, ticket_code FROM tickets WHERE id = $1`, [ticketId]);
    if (ticketRes.rows.length > 0) {
      const t = ticketRes.rows[0];
      const commentPayload = {
        id: newComment.id,
        ticketId,
        comment: newComment.comment,
        isInternalNote: newComment.is_internal_note,
        userName: user.fullName,
        userRole: user.role,
        createdAt: newComment.created_at,
      };

      if (!internalNote) {
        emitToUser(t.created_by_user_id, 'ticket:comment_added', commentPayload);
      }
      if (t.assigned_tech_id && t.assigned_tech_id !== user.id) {
        emitToUser(t.assigned_tech_id, 'ticket:comment_added', commentPayload);
      }
    }

    return newComment;
  }

  async addAttachment(
    ticketId: string,
    user: AuthUserPayload,
    file: { fileName: string; fileUrl: string; fileType: string; fileSize: number }
  ) {
    const res = await query(
      `INSERT INTO ticket_attachments (ticket_id, file_name, file_url, file_type, file_size, uploaded_by_user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [ticketId, file.fileName, file.fileUrl, file.fileType, file.fileSize, user.id]
    );

    return res.rows[0];
  }

  async closeAndRate(
    ticketId: string,
    user: AuthUserPayload,
    rating: number,
    feedback?: string
  ) {
    const ticketRes = await query(`SELECT created_by_user_id FROM tickets WHERE id = $1`, [ticketId]);
    if (ticketRes.rows.length === 0) {
      throw new Error('Ticket not found');
    }

    if (user.role === 'EMPLOYEE' && ticketRes.rows[0].created_by_user_id !== user.id) {
      throw new Error('You can only rate your own tickets');
    }

    const res = await query(
      `UPDATE tickets SET
         status = 'Closed',
         satisfaction_rating = $1,
         feedback_comment = $2,
         closed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [rating, feedback || null, ticketId]
    );

    await query(
      `INSERT INTO ticket_history (ticket_id, changed_by_user_id, field_changed, old_value, new_value, comment)
       VALUES ($1, $2, 'status', 'Resolved', 'Closed', $3)`,
      [ticketId, user.id, `Ticket closed with ${rating}-star rating`]
    );

    emitToAll('ticket:closed', {
      id: ticketId,
      rating,
    });

    return res.rows[0];
  }
}
