/**
 * Request validation utilities
 */

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    // eslint-disable-next-line no-unused-vars
    custom?: (value: any) => boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate an object against a schema
 * @param body The object to validate
 * @param schema The validation schema
 * @returns Validation result
 */
export function validateRequestBody(body: any, schema: ValidationSchema): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  for (const [key, rules] of Object.entries(schema)) {
    const value = body[key];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `Missing required field: ${key}` };
    }

    // Skip other checks if optional and missing
    if (value === undefined || value === null) {
      continue;
    }

    // Check type
    if (typeof value !== rules.type) {
      return { valid: false, error: `Field ${key} must be of type ${rules.type}` };
    }

    // Check string constraints
    if (rules.type === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return { valid: false, error: `${key} must be at least ${rules.minLength} characters` };
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return { valid: false, error: `${key} must be at most ${rules.maxLength} characters` };
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return { valid: false, error: `${key} validation failed` };
      }
    }

    // Check custom validator
    if (rules.custom && !rules.custom(value)) {
      return { valid: false, error: `Field ${key} failed validation` };
    }
  }

  return { valid: true };
}
