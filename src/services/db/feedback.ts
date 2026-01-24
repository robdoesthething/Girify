/**
 * Feedback Database Operations
 *
 * User feedback submission and approval.
 */

import type { FeedbackRow } from '../../types/supabase';
import { supabase } from '../supabase';

export async function submitFeedback(username: string, text: string): Promise<boolean> {
  const { error } = await supabase.from('feedback').insert({
    username: username.toLowerCase(),
    text,
  });

  if (error) {
    console.error('[DB] submitFeedback error:', error.message);
    return false;
  }
  return true;
}

export async function getApprovedFeedbackRewards(username: string): Promise<FeedbackRow[]> {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('username', username.toLowerCase())
    .eq('status', 'approved')
    .eq('notified', false);

  if (error) {
    console.error('[DB] getApprovedFeedbackRewards error:', error.message);
    return [];
  }
  return data || [];
}

export async function markFeedbackNotified(feedbackId: number): Promise<boolean> {
  const { error } = await supabase.from('feedback').update({ notified: true }).eq('id', feedbackId);

  if (error) {
    console.error('[DB] markFeedbackNotified error:', error.message);
    return false;
  }
  return true;
}
