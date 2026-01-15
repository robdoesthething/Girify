/**
 * Environment variable validation for Girify
 * Validates required VITE_* environment variables on app startup
 */

const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
}

/**
 * Validates that all required environment variables are present
 * @returns Validation result with missing variables list
 */
export function validateEnv(): EnvValidationResult {
  const missingVars: string[] = [];

  REQUIRED_ENV_VARS.forEach(varName => {
    if (!import.meta.env[varName]) {
      missingVars.push(varName);
    }
  });

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

/**
 * Validates environment variables and throws if any are missing
 * Call this at app startup to fail fast on missing config
 */
export function assertEnvValid(): void {
  const { isValid, missingVars } = validateEnv();

  if (!isValid) {
    const message = `Missing required environment variables:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\nPlease check your .env file or environment configuration.`;
    console.error(message);
    throw new Error(message);
  }
}
