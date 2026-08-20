import { Request, Response } from 'express';
import { UserService } from './user.service';
import { successResponse, errorResponse } from '../../utils/response';

const userService = new UserService();

export class UserController {
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { roleId, departmentId, search } = req.query;
      const users = await userService.getAllUsers({
        roleId: roleId ? parseInt(roleId as string, 10) : undefined,
        departmentId: departmentId as string,
        search: search as string,
      });
      successResponse(res, users, 'Users retrieved successfully');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch users', 500);
    }
  }

  async getTechnicians(req: Request, res: Response): Promise<void> {
    try {
      const techs = await userService.getTechnicians();
      successResponse(res, techs, 'Technicians retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch technicians', 500);
    }
  }

  async getDepartments(req: Request, res: Response): Promise<void> {
    try {
      const depts = await userService.getDepartments();
      successResponse(res, depts, 'Departments retrieved');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch departments', 500);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.createUser(req.body);
      successResponse(res, user, 'User created successfully', 201);
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to create user', 400);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
      successResponse(res, user, 'User updated successfully');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to update user', 400);
    }
  }
}
