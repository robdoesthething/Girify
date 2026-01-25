import type { VercelResponse } from '@vercel/node';

/**
 * Standard API Response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  uid?: string; // Legacy support for admin promote response
}

/**
 * Send a success response
 * @param res VercelResponse object
 * @param data Optional data payload
 * @param statusCode HTTP status code (default 200)
 */
export function sendSuccess<T>(res: VercelResponse, data?: T, statusCode = 200): void {
  // Handle legacy format where uid was top-level
  if (data && typeof data === 'object' && 'uid' in data) {
    const legacyResponse = {
      success: true,
      ...data,
    };
    res.status(statusCode).json(legacyResponse);
    return;
  }

  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
}

/**
 * Send an error response
 * @param res VercelResponse object
 * @param error Error message
 * @param statusCode HTTP status code (default 500)
 */
export function sendError(res: VercelResponse, error: string, statusCode = 500): void {
  const response: ApiResponse = {
    success: false,
    error,
  };
  res.status(statusCode).json(response);
}

/**
 * Predefined error responses for common scenarios
 */
export const ErrorResponses = {
  METHOD_NOT_ALLOWED: (res: VercelResponse) => sendError(res, 'Method not allowed', 405),
  MISSING_AUTH_HEADER: (res: VercelResponse) =>
    sendError(res, 'Missing or invalid authorization header', 401),
  INVALID_TOKEN: (res: VercelResponse) =>
    sendError(res, 'Invalid or expired authentication token', 401),
  BAD_REQUEST: (res: VercelResponse, message: string) => sendError(res, message, 400),
  RATE_LIMIT_EXCEEDED: (res: VercelResponse) =>
    sendError(res, 'Too many attempts. Please try again later.', 429),
  FORBIDDEN: (res: VercelResponse, message = 'Access denied') => sendError(res, message, 403),
  SERVER_ERROR: (res: VercelResponse, message = 'Internal server error') =>
    sendError(res, message, 500),
};
