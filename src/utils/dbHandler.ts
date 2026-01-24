/**
 * Database Handler Utility
 *
 * Wrapper for Supabase operations with standardized error handling.
 * Reduces repeated try/catch + console.error patterns.
 */

import { PostgrestError } from '@supabase/supabase-js';

type DbResult<T> = { data: T | null; error: PostgrestError | null };

/**
 * Standard database error codes
 */
export const DB_ERROR_CODES = {
  NOT_FOUND: 'PGRST116',
} as const;

/**
 * Wraps a Supabase query with standardized error handling.
 *
 * @param operation - Name of the operation for logging
 * @param query - The Supabase query promise
 * @param options - Optional configuration
 * @returns The data or null/default on error
 *
 * @example
 * const user = await dbQuery('getUserByUsername', supabase.from('users').select('*').eq('username', name).single());
 */
export async function dbQuery<T>(
  operation: string,
  query: Promise<DbResult<T>>,
  options: {
    /** Value to return on "not found" errors instead of logging */
    notFoundValue?: T | null;
    /** Suppress error logging for specific error codes */
    suppressErrorCodes?: string[];
  } = {}
): Promise<T | null> {
  const { notFoundValue = null, suppressErrorCodes = [DB_ERROR_CODES.NOT_FOUND] } = options;

  try {
    const { data, error } = await query;

    if (error) {
      // Handle "not found" gracefully without logging
      if (suppressErrorCodes.includes(error.code)) {
        return notFoundValue;
      }

      console.error(`[DB] ${operation} error:`, error.message);
      return null;
    }

    return data;
  } catch (e) {
    console.error(`[DB] ${operation} exception:`, e);
    return null;
  }
}

/**
 * Wraps a mutation (insert/update/delete) with standardized error handling.
 *
 * @param operation - Name of the operation for logging
 * @param mutation - The Supabase mutation promise
 * @returns True on success, false on error
 *
 * @example
 * const success = await dbMutate('updateUser', supabase.from('users').update(data).eq('id', id));
 */
export async function dbMutate(
  operation: string,
  mutation: Promise<{ error: PostgrestError | null }>
): Promise<boolean> {
  try {
    const { error } = await mutation;

    if (error) {
      console.error(`[DB] ${operation} error:`, error.message);
      return false;
    }

    return true;
  } catch (e) {
    console.error(`[DB] ${operation} exception:`, e);
    return false;
  }
}

/**
 * Wraps a query that returns an array with standardized error handling.
 *
 * @param operation - Name of the operation for logging
 * @param query - The Supabase query promise
 * @returns The data array or empty array on error
 *
 * @example
 * const users = await dbQueryArray('getUsers', supabase.from('users').select('*').limit(10));
 */
export async function dbQueryArray<T>(
  operation: string,
  query: Promise<DbResult<T[]>>
): Promise<T[]> {
  try {
    const { data, error } = await query;

    if (error) {
      console.error(`[DB] ${operation} error:`, error.message);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error(`[DB] ${operation} exception:`, e);
    return [];
  }
}
