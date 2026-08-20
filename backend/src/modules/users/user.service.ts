import bcrypt from 'bcryptjs';
import { query } from '../../config/db';

export class UserService {
  async getAllUsers(options: { roleId?: number; departmentId?: string; search?: string }) {
    let sql = `
      SELECT u.id, u.email, u.full_name, u.phone, u.job_title,
             u.role_id, r.name as role_name, u.department_id, d.name as department_name,
             u.is_active, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (options.roleId) {
      sql += ` AND u.role_id = $${paramIndex++}`;
      params.push(options.roleId);
    }

    if (options.departmentId) {
      sql += ` AND u.department_id = $${paramIndex++}`;
      params.push(options.departmentId);
    }

    if (options.search) {
      sql += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    sql += ` ORDER BY u.full_name ASC`;

    const res = await query(sql, params);
    return res.rows;
  }

  async getTechnicians() {
    const res = await query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.job_title, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name IN ('TECHNICIAN', 'ADMIN') AND u.is_active = TRUE
       ORDER BY u.full_name ASC`
    );
    return res.rows;
  }

  async getDepartments() {
    const res = await query(`SELECT * FROM departments ORDER BY name ASC`);
    return res.rows;
  }

  async createUser(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    jobTitle?: string;
    roleId: number;
    departmentId?: string;
  }) {
    const existing = await query(`SELECT id FROM users WHERE LOWER(email) = LOWER($1)`, [data.email]);
    if (existing.rows.length > 0) {
      throw new Error('A user with this email already exists');
    }

    const hash = await bcrypt.hash(data.password, 10);

    const res = await query(
      `INSERT INTO users (email, password_hash, full_name, phone, job_title, role_id, department_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, role_id, department_id, created_at`,
      [data.email, hash, data.fullName, data.phone || null, data.jobTitle || null, data.roleId, data.departmentId || null]
    );

    return res.rows[0];
  }

  async updateUser(id: string, data: {
    fullName?: string;
    phone?: string;
    jobTitle?: string;
    roleId?: number;
    departmentId?: string;
    isActive?: boolean;
    password?: string;
  }) {
    let hash: string | undefined;
    if (data.password) {
      hash = await bcrypt.hash(data.password, 10);
    }

    const res = await query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         job_title = COALESCE($3, job_title),
         role_id = COALESCE($4, role_id),
         department_id = COALESCE($5, department_id),
         is_active = COALESCE($6, is_active),
         password_hash = COALESCE($7, password_hash),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, email, full_name, role_id, department_id, is_active, updated_at`,
      [
        data.fullName || null,
        data.phone || null,
        data.jobTitle || null,
        data.roleId || null,
        data.departmentId || null,
        data.isActive !== undefined ? data.isActive : null,
        hash || null,
        id
      ]
    );

    if (res.rows.length === 0) {
      throw new Error('User not found');
    }

    return res.rows[0];
  }
}
