import { VercelResponse } from '@vercel/node';
import { sendError } from './response';

export class ApiError extends Error {
  statusCode: number;
  originalError?: any;

  constructor(message: string, statusCode = 500, originalError?: any) {
    super(message);
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.name = 'ApiError';
  }
}

export function handleError(res: VercelResponse, error: unknown, context: string) {
  console.error(`[API] Error in ${context}:`, error);

  if (error instanceof ApiError) {
    sendError(res, error.message, error.statusCode);
    return;
  }

  // Handle generic errors
  sendError(res, 'Internal server error', 500); // Don't expose internal error details to client by default
}
