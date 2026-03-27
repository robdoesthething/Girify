/**
 * Admin Delete User API Endpoint
 * POST /api/admin/delete-user
 *
 * Deletes a user from Supabase Auth (service role required).
 * The users table row and cascaded DB data are deleted client-side
 * before calling this endpoint.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractBearerToken, verifySupabaseToken } from '../_lib/auth';
import { handleCors } from '../_lib/cors';
import { handleError } from '../_lib/errorHandler';
import { ErrorResponses, sendSuccess } from '../_lib/response';
import { deleteAuthUser, isUserAdmin } from '../_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(res, req.headers.origin, req.method || 'GET')) {
    return;
  }

  if (req.method !== 'POST') {
    ErrorResponses.METHOD_NOT_ALLOWED(res);
    return;
  }

  try {
    // Verify caller is authenticated
    const authResult = extractBearerToken(req.headers.authorization);
    if (!authResult.token) {
      ErrorResponses.MISSING_AUTH_HEADER(res);
      return;
    }

    let caller;
    try {
      caller = await verifySupabaseToken(authResult.token);
    } catch {
      ErrorResponses.INVALID_TOKEN(res);
      return;
    }

    // Verify caller is an admin
    const adminCheck = await isUserAdmin(caller.uid);
    if (!adminCheck) {
      ErrorResponses.FORBIDDEN(res, 'Admin access required');
      return;
    }

    const { uid } = req.body as { uid?: string };
    if (!uid || typeof uid !== 'string') {
      ErrorResponses.BAD_REQUEST(res, 'uid is required');
      return;
    }

    const result = await deleteAuthUser(uid);

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete auth user');
    }

    console.log(`[API] Admin ${caller.uid} deleted auth user ${uid}`);
    sendSuccess(res, { uid });
  } catch (error) {
    handleError(res, error, 'delete auth user');
  }
}
