/**
 * Referral Bonus API Endpoint
 * POST /api/referral
 *
 * Awards a giuros bonus to the referrer of the authenticated user.
 * Uses service_role for the credit so it can target a different account,
 * bypassing the ownership check in the add_giuros RPC.
 *
 * Body: { referredUsername: string }
 * Headers: Authorization: Bearer <supabase_jwt>
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { extractBearerToken, verifySupabaseToken } from './_lib/auth';
import { handleCors } from './_lib/cors';
import { handleError } from './_lib/errorHandler';
import { ErrorResponses, sendSuccess } from './_lib/response';
import { creditGiuros, getUsernameByUid } from './_lib/supabase';
import { validateRequestBody, ValidationSchema } from './_lib/validation';

const SCHEMA: ValidationSchema = {
  referredUsername: { type: 'string', required: true, minLength: 1, maxLength: 50 },
};

const REFERRAL_BONUS = 15;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (handleCors(res, req.headers.origin, req.method || 'GET')) return;

  if (req.method !== 'POST') {
    ErrorResponses.METHOD_NOT_ALLOWED(res);
    return;
  }

  try {
    const { token, error: tokenError } = extractBearerToken(req.headers.authorization);
    if (!token || tokenError) {
      ErrorResponses.MISSING_AUTH_HEADER(res);
      return;
    }

    const caller = await verifySupabaseToken(token);

    const validation = validateRequestBody(req.body, SCHEMA);
    if (!validation.valid) {
      ErrorResponses.BAD_REQUEST(res, validation.error || 'Invalid request');
      return;
    }

    const { referredUsername } = req.body as { referredUsername: string };
    const normalized = referredUsername.toLowerCase().replace(/^@/, '');

    // Verify the referredUsername belongs to the authenticated caller
    const callerUsername = await getUsernameByUid(caller.uid);
    if (!callerUsername || callerUsername.toLowerCase() !== normalized) {
      ErrorResponses.FORBIDDEN(res);
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      ErrorResponses.SERVER_ERROR(res, 'Server configuration error');
      return;
    }
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Find unclaimed referral for this user (mirrors getReferrer logic)
    const { data: referral, error: refError } = await admin
      .from('referrals')
      .select('id, referrer, bonus_awarded')
      .eq('referred', normalized)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (refError || !referral || referral.bonus_awarded) {
      // No unclaimed referral — nothing to do
      sendSuccess(res);
      return;
    }

    // Mark as awarded before crediting (prevent double-pay on retry)
    await admin.from('referrals').update({ bonus_awarded: true }).eq('id', referral.id);

    const result = await creditGiuros(
      referral.referrer as string,
      REFERRAL_BONUS,
      `referral:${normalized}`
    );
    if (!result.success) {
      console.error(`[API] Failed to credit referral bonus to ${referral.referrer}:`, result.error);
      // Rollback the bonus_awarded flag so it can be retried
      await admin.from('referrals').update({ bonus_awarded: false }).eq('id', referral.id);
      ErrorResponses.SERVER_ERROR(res, 'Failed to award referral bonus');
      return;
    }

    sendSuccess(res);
  } catch (error) {
    handleError(res, error, 'referral bonus');
  }
}
