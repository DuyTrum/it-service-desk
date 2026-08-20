import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { errorResponse } from '../utils/response';
import { AuthUserPayload, RoleName } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'Authentication token missing or invalid', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    errorResponse(res, 'Invalid or expired token', 401);
  }
};

export const authorize = (allowedRoles: RoleName[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Unauthorized', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      errorResponse(
        res,
        `Access forbidden: Requires one of [${allowedRoles.join(', ')}]`,
        403
      );
      return;
    }

    next();
  };
};

export const authenticateAgent = (req: Request, res: Response, next: NextFunction): void => {
  const agentKey = req.headers['x-agent-key'] || req.query.agent_key;
  const expectedKey = process.env.AGENT_SECRET_KEY || 'agent_secret_key_it_support_2026';

  if (!agentKey || agentKey !== expectedKey) {
    errorResponse(res, 'Unauthorized PC Health Agent Key', 401);
    return;
  }

  next();
};
