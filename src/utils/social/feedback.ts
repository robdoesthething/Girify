/**
 * Feedback Management Functions
 *
 * Functions for user feedback submission, admin approval/rejection.
 */

import {
  submitFeedback as dbSubmitFeedback,
  getApprovedFeedbackRewards,
  markFeedbackNotified,
} from '../../services/database';
import { supabase } from '../../services/supabase';
import type { FeedbackRow } from '../../types/supabase';

import type { FeedbackItem, OperationResult } from './types';

/**
 * Submit user feedback
 */
export const submitFeedback = async (username: string, text: string): Promise<void> => {
  if (!username || !text) {
    return;
  }
  await dbSubmitFeedback(username, text);
};

/**
 * Get all feedback (Admin only)
 */
export const getFeedbackList = async (): Promise<FeedbackItem[]> => {
  try {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      return [];
    }

    return data.map((f: FeedbackRow) => ({
      id: f.id.toString(),
      username: f.username,
      text: f.text,
      status: (f.status as 'pending' | 'approved' | 'rejected') || 'pending',
      reward: f.reward,
      createdAt: f.created_at || undefined,
      approvedAt: f.approved_at || undefined,
      rejectedAt: f.rejected_at || undefined,
      notified: f.notified === true,
    }));
  } catch (e) {
    console.error('Error fetching feedback:', e);
    return [];
  }
};

/**
 * Approve feedback and award Giuros (Admin only)
 */
export const approveFeedback = async (
  feedbackId: string,
  giurosAmount = 50
): Promise<OperationResult> => {
  try {
    const { data: feedback, error: fetchError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', parseInt(feedbackId, 10))
      .single();

    if (fetchError || !feedback) {
      throw new Error('Feedback not found');
    }

    const { awardGiuros } = await import('../giuros');
    await awardGiuros(feedback.username, giurosAmount);

    const { error: updateError } = await supabase
      .from('feedback')
      .update({
        status: 'approved',
        reward: giurosAmount,
        approved_at: new Date().toISOString(),
      })
      .eq('id', parseInt(feedbackId, 10));

    if (updateError) {
      throw new Error(updateError.message);
    }

    return { success: true, username: feedback.username, reward: giurosAmount };
  } catch (e) {
    console.error('Error approving feedback:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Reject feedback (Admin only)
 */
export const rejectFeedback = async (feedbackId: string): Promise<OperationResult> => {
  try {
    const { error } = await supabase
      .from('feedback')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', parseInt(feedbackId, 10));

    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  } catch (e) {
    console.error('Error rejecting feedback:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Delete feedback (Admin only)
 */
export const deleteFeedback = async (feedbackId: string): Promise<OperationResult> => {
  try {
    const { error } = await supabase.from('feedback').delete().eq('id', parseInt(feedbackId, 10));

    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  } catch (e) {
    console.error('Error deleting feedback:', e);
    return { success: false, error: (e as Error).message };
  }
};

/**
 * Check for unseen feedback rewards for a user
 */
export const checkUnseenFeedbackRewards = async (username: string): Promise<FeedbackItem[]> => {
  if (!username) {
    return [];
  }

  const rewards = await getApprovedFeedbackRewards(username);
  return rewards.map((f: FeedbackRow) => ({
    id: f.id.toString(),
    username: f.username,
    text: f.text,
    status: (f.status as 'pending' | 'approved' | 'rejected') || 'approved',
    reward: f.reward,
    createdAt: f.created_at || undefined,
    approvedAt: f.approved_at || undefined,
    rejectedAt: f.rejected_at || undefined,
    notified: f.notified === true,
  }));
};

/**
 * Mark feedback reward as seen
 */
export const markFeedbackRewardSeen = async (feedbackId: string): Promise<void> => {
  await markFeedbackNotified(parseInt(feedbackId, 10));
};
