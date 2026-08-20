import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled Server Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  errorResponse(res, message, statusCode, err.errors || undefined);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  errorResponse(res, `API route not found: ${req.method} ${req.originalUrl}`, 404);
};
