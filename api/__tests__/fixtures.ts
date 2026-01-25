/**
 * Test fixtures for Admin API tests
 */

export const MOCK_ADMIN_KEY = 'GIRIFY_ADMIN_ACCESS_2026_SECURE';
export const MOCK_USERNAME = 'testuser';
export const MOCK_UID = 'test-uid';
export const MOCK_EMAIL = 'test@example.com';
export const MOCK_IP = '127.0.0.1';

export const MOCK_USER_RECORD = {
  uid: MOCK_UID,
  email: MOCK_EMAIL,
  emailVerified: true,
};

export const MOCK_VALID_BODY = {
  adminKey: MOCK_ADMIN_KEY,
  username: MOCK_USERNAME,
};

export const MOCK_INVALID_BODY_NO_KEY = {
  username: MOCK_USERNAME,
};

export const MOCK_INVALID_BODY_NO_USERNAME = {
  adminKey: MOCK_ADMIN_KEY,
};
