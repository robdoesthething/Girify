import { describe, expect, it } from 'vitest';

describe('Username Validation Logic', () => {
  const isValidUsername = (displayName: string): boolean => {
    const newFormatRegex = /^@[a-zA-Z0-9]+\d{4}$/;
    const hasExcessiveDigits = /\d{5,}$/.test(displayName);
    const isTooLong = displayName.length > 20;

    if (hasExcessiveDigits) {
      return false;
    }
    if (isTooLong) {
      return false;
    }
    return newFormatRegex.test(displayName);
  };

  const generateNewHandle = (displayName: string): string => {
    const randomId = 1234;
    let coreName = displayName.replace(/^@/, '').split(/\d/)[0];
    coreName = coreName.replace(/[^a-zA-Z]/g, '').slice(0, 10) || 'User';
    return `@${coreName}${randomId}`;
  };

  it('should reject long numeric suffixes', () => {
    expect(isValidUsername('@Roberto8320452683603623')).toBe(false);
    expect(isValidUsername('@Roberto12345')).toBe(false);
  });

  it('should accept valid handles', () => {
    expect(isValidUsername('@Roberto1234')).toBe(true);
    expect(isValidUsername('@User9999')).toBe(true);
  });

  it('should reject too long usernames', () => {
    const longName = `@${'a'.repeat(20)}1234`;
    expect(isValidUsername(longName)).toBe(false);
  });

  it('should generate short, clean handles from bad input', () => {
    const badInput = '@Roberto8320452683603623';
    const newHandle = generateNewHandle(badInput);
    expect(newHandle).toBe('@Roberto1234');
  });

  it('should handle email-like inputs correctly for generation', () => {
    const input = 'robertosanchezgallego';
    const newHandle = generateNewHandle(input);
    expect(newHandle).toBe('@robertosan1234');
  });

  it('should handle names with spaces or special chars', () => {
    const input = 'John Doe!';
    const newHandle = generateNewHandle(input);
    expect(newHandle).toBe('@JohnDoe1234');
  });
});
