import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { createLogger } from '../../utils/logger';

const logger = createLogger('DB');

/**
 * Executes a Supabase query and handles errors/exceptions consistently.
 * Logs errors to the console using the standard logger.
 *
 * @param queryPromise - The Supabase query promise (e.g. supabase.from(...).select())
 * @param operationName - A descriptive name for the operation (for logging)
 * @returns The data from the query, or null if an error occurred.
 */
export async function executeQuery<T>(
  queryPromise: PromiseLike<PostgrestResponse<T> | PostgrestSingleResponse<T>>,
  operationName: string
): Promise<T | null> {
  try {
    const { data, error } = await queryPromise;

    if (error) {
      // Ignore "Result contains 0 rows" error for .single() queries
      if (error.code === 'PGRST116') {
        return null;
      }

      logger.error(`Error in ${operationName}:`, error.message, error.details);
      return null;
    }

    return data as T;
  } catch (err) {
    logger.error(`Exception in ${operationName}:`, err);
    return null;
  }
}
