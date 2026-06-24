/**
 * Tests for admin delete-user API endpoint
 * @vitest-environment node
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../_lib/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('../_lib/auth')>();
  return { ...actual, verifySupabaseToken: vi.fn() };
});

vi.mock('../_lib/supabase', () => ({
  deleteAuthUser: vi.fn(),
  isUserAdmin: vi.fn(),
}));

import { verifySupabaseToken } from '../_lib/auth';
import { deleteAuthUser, isUserAdmin } from '../_lib/supabase';
import handler from '../admin/delete-user';
import { MOCK_IP, MOCK_UID, MOCK_USER_RECORD } from './fixtures';

function makeReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer valid-token', origin: 'https://girify.vercel.app' },
    body: { uid: MOCK_UID },
    socket: { remoteAddress: MOCK_IP },
    ...overrides,
  } as unknown as VercelRequest;
}

function makeRes(): VercelResponse {
  const r = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return r as unknown as VercelResponse;
}

describe('DELETE /api/admin/delete-user', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifySupabaseToken).mockResolvedValue(MOCK_USER_RECORD as any);
    vi.mocked(isUserAdmin).mockResolvedValue(true);
    vi.mocked(deleteAuthUser).mockResolvedValue({ success: true });
  });

  it('returns 405 for non-POST methods', async () => {
    const res = makeRes();
    await handler(makeReq({ method: 'GET' }), res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 401 when authorization header is missing', async () => {
    const res = makeRes();
    await handler(makeReq({ headers: {} }), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when token is invalid', async () => {
    vi.mocked(verifySupabaseToken).mockRejectedValue(new Error('invalid'));
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 403 when caller is not admin', async () => {
    vi.mocked(isUserAdmin).mockResolvedValue(false);
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 400 when uid is missing from body', async () => {
    const res = makeRes();
    await handler(makeReq({ body: {} }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('successfully deletes user and returns 200 with uid', async () => {
    const res = makeRes();
    await handler(makeReq(), res);
    expect(deleteAuthUser).toHaveBeenCalledWith(MOCK_UID);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ uid: MOCK_UID }));
  });

  it('returns 500 when deleteAuthUser fails', async () => {
    vi.mocked(deleteAuthUser).mockResolvedValue({ success: false, error: 'not found' });
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
