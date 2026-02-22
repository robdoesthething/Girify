/**
 * Tests for feedback API endpoint
 * @vitest-environment node
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../_lib/supabase', () => ({
  insertFeedbackRecord: vi.fn(),
}));

vi.mock('../_lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

// Mock fetch for Turnstile verification
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { insertFeedbackRecord } from '../_lib/supabase';
import { checkRateLimit } from '../_lib/rate-limit';
import handler from '../feedback';

function createMockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: {
      origin: 'https://girify.vercel.app',
      'x-real-ip': '1.2.3.4',
    },
    body: {
      username: 'testuser',
      text: 'Great game!',
      turnstileToken: 'valid-token',
    },
    socket: { remoteAddress: '1.2.3.4' },
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

describe('POST /api/feedback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetAt: Date.now() + 600000,
    });
  });

  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it('returns 405 for non-POST methods', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 400 when body fields are missing', async () => {
    const req = createMockReq({ body: { username: 'test' } });
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when Turnstile verification fails', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: false }),
    });
    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(insertFeedbackRecord).not.toHaveBeenCalled();
  });

  it('returns 200 and inserts feedback when token is valid', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    vi.mocked(insertFeedbackRecord).mockResolvedValueOnce({ success: true });

    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);

    expect(insertFeedbackRecord).toHaveBeenCalledWith('testuser', 'Great game!');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 500 when Supabase insert fails', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => ({ success: true }),
    });
    vi.mocked(insertFeedbackRecord).mockResolvedValueOnce({
      success: false,
      error: 'DB error',
    });

    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 600000,
    });
    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 500 when TURNSTILE_SECRET_KEY is not set', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const req = createMockReq();
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
