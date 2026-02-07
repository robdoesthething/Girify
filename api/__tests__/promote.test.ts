/**
 * Tests for admin promotion API endpoint
 * @vitest-environment node
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../_lib/auth', async importOriginal => {
  const actual = await importOriginal<typeof import('../_lib/auth')>();
  return {
    ...actual,
    verifyFirebaseToken: vi.fn(),
  };
});

vi.mock('../_lib/supabase', () => ({
  promoteUserToAdmin: vi.fn(),
}));

vi.mock('../_lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

import { verifyFirebaseToken } from '../_lib/auth';
import { checkRateLimit } from '../_lib/rate-limit';
import { promoteUserToAdmin } from '../_lib/supabase';
import handler from '../admin/promote';
import {
  MOCK_ADMIN_KEY,
  MOCK_IP,
  MOCK_UID,
  MOCK_USER_RECORD,
  MOCK_USERNAME,
  MOCK_VALID_BODY,
} from './fixtures';

// Helper to create mock request/response
function createMockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {
      authorization: 'Bearer valid-token',
      origin: 'https://girify.vercel.app',
    },
    body: { ...MOCK_VALID_BODY },
    socket: {
      remoteAddress: MOCK_IP,
    },
    ...overrides,
  } as unknown as VercelRequest;
}

function createMockRes(): VercelResponse {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
  return res as unknown as VercelResponse;
}

describe('Admin Promotion API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default environment variables
    process.env.ADMIN_SECRET_KEY = MOCK_ADMIN_KEY;
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Request validation', () => {
    it('should reject non-POST requests', async () => {
      const req = createMockReq({ method: 'GET' });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Method not allowed',
      });
    });

    it('should handle OPTIONS preflight request', async () => {
      const req = createMockReq({ method: 'OPTIONS' });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });

    it('should reject missing authorization header', async () => {
      const req = createMockReq({ headers: {} });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    });

    it('should reject invalid authorization header format', async () => {
      const req = createMockReq({
        headers: { authorization: 'InvalidFormat' },
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    });

    it('should reject missing adminKey', async () => {
      const req = createMockReq({
        body: { username: MOCK_USERNAME },
      });
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required field: adminKey',
      });
    });

    it('should reject missing username', async () => {
      const req = createMockReq({
        body: { adminKey: MOCK_ADMIN_KEY },
      });
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required field: username',
      });
    });

    it('should reject username too short', async () => {
      const req = createMockReq({
        body: { adminKey: MOCK_ADMIN_KEY, username: 'ab' },
      });
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'username must be at least 3 characters',
      });
    });

    it('should reject username too long', async () => {
      const req = createMockReq({
        body: {
          adminKey: MOCK_ADMIN_KEY,
          username: 'a'.repeat(21),
        },
      });
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'username must be at most 20 characters',
      });
    });
  });

  describe('Authentication', () => {
    it('should reject invalid Firebase token', async () => {
      const req = createMockReq();
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockRejectedValue(new Error('Invalid token'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid or expired authentication token',
      });
    });

    it('should accept valid Firebase token', async () => {
      const req = createMockReq();
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetAt: Date.now() + 900000,
      });

      vi.mocked(promoteUserToAdmin).mockResolvedValue({ success: true });

      await handler(req, res);

      expect(verifyFirebaseToken).toHaveBeenCalledWith('valid-token');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Rate limiting', () => {
    it('should reject requests exceeding rate limit', async () => {
      const req = createMockReq();
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 900000,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Too many attempts. Please try again later.',
      });
    });

    it('should set rate limit headers', async () => {
      const req = createMockReq();
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      const resetAt = Date.now() + 900000;
      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 3,
        resetAt,
      });

      vi.mocked(promoteUserToAdmin).mockResolvedValue({ success: true });

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '3');
      expect(res.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        new Date(resetAt).toISOString()
      );
    });
  });

  describe('Admin key validation', () => {
    it('should reject incorrect admin key', async () => {
      const req = createMockReq({
        body: { adminKey: 'WRONG_KEY', username: MOCK_USERNAME },
      });
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetAt: Date.now() + 900000,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid admin key',
      });
    });

    it('should reject when ADMIN_SECRET_KEY not configured', async () => {
      delete process.env.ADMIN_SECRET_KEY;

      const req = createMockReq();
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetAt: Date.now() + 900000,
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('User promotion', () => {
    it('should successfully promote user to admin', async () => {
      const req = createMockReq();
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetAt: Date.now() + 900000,
      });

      vi.mocked(promoteUserToAdmin).mockResolvedValue({ success: true });

      await handler(req, res);

      expect(promoteUserToAdmin).toHaveBeenCalledWith(MOCK_UID, MOCK_USERNAME);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        uid: MOCK_UID,
      });
    });

    it('should handle promotion failure', async () => {
      const req = createMockReq();
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockResolvedValue(MOCK_USER_RECORD);

      vi.mocked(checkRateLimit).mockResolvedValue({
        allowed: true,
        remaining: 4,
        resetAt: Date.now() + 900000,
      });

      vi.mocked(promoteUserToAdmin).mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
      });
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      const req = createMockReq();
      const res = createMockRes();

      vi.mocked(verifyFirebaseToken).mockRejectedValue(new Error('Unexpected error'));

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      // The exact response call happens inside ErrorResponses.INVALID_TOKEN (or generic handler)
      expect(res.json).toHaveBeenCalled();
    });
  });
});
