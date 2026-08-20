import bcrypt from 'bcryptjs';
import { query } from '../../config/db';
import { signToken } from '../../utils/jwt';
import { RoleName } from '../../types';

export class AuthService {
  async login(email: string, pass: string) {
    const userRes = await query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.phone, u.job_title,
              u.role_id, r.name as role_name, u.department_id, d.name as department_name, u.is_active
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    if (userRes.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      throw new Error('Your account has been deactivated. Please contact IT Support.');
    }

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role_name as RoleName,
      roleId: user.role_id,
      departmentId: user.department_id,
    });

    // Also get assigned assets for this user
    const assetsRes = await query(
      `SELECT id, asset_code, name, category, model, status
       FROM assets
       WHERE assigned_user_id = $1`,
      [user.id]
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phone: user.phone,
        jobTitle: user.job_title,
        role: user.role_name,
        roleId: user.role_id,
        departmentId: user.department_id,
        departmentName: user.department_name,
        assignedAssets: assetsRes.rows,
      },
    };
  }

  async getMe(userId: string) {
    const userRes = await query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.job_title,
              u.role_id, r.name as role_name, u.department_id, d.name as department_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userRes.rows[0];

    const assetsRes = await query(
      `SELECT id, asset_code, name, category, model, status
       FROM assets
       WHERE assigned_user_id = $1`,
      [user.id]
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      jobTitle: user.job_title,
      role: user.role_name,
      roleId: user.role_id,
      departmentId: user.department_id,
      departmentName: user.department_name,
      assignedAssets: assetsRes.rows,
    };
  }
}
