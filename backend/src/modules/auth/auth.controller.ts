import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { successResponse, errorResponse } from '../../utils/response';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      successResponse(res, result, 'Login successful');
    } catch (error: any) {
      errorResponse(res, error.message || 'Login failed', 401);
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await authService.getMe(userId);
      successResponse(res, result, 'User profile fetched');
    } catch (error: any) {
      errorResponse(res, error.message || 'Failed to fetch user profile', 404);
    }
  }
}
